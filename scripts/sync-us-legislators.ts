#!/usr/bin/env node

/**
 * US Legislators Sync Script
 * 
 * This script fetches current data from the unitedstates/congress-legislators 
 * GitHub repository and syncs it to our database.
 * 
 * Usage:
 *   npm run sync:legislators [-- --force] [-- --verbose]
 *   
 *   Options:
 *     --force    Force a full sync even if no changes are detected
 *     --verbose  Show detailed logs during sync process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Handle ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  verbose: args.includes('--verbose')
};

// Setup logging based on verbosity
const log = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  verbose: (message: string) => { if (options.verbose) console.log(`[VERBOSE] ${message}`); },
  error: (message: string) => console.error(`[ERROR] ${message}`),
  success: (message: string) => console.log(`[SUCCESS] ${message}`)
};

// Configuration
const GITHUB_BASE_URL = 'https://unitedstates.github.io/congress-legislators/';
const DATA_FILES = {
  legislators: 'legislators-current.json',
  legislatorsHistorical: 'legislators-historical.json'
};
const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Database connection
const sql = postgres(process.env.LEGISCAN_DB_URL || '');

/**
 * Main function to orchestrate the sync process
 */
async function syncLegislators() {
  try {
    log.info('Starting US Legislators sync...');
    
    // Check if required tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      log.error('Required tables do not exist. Please run migration 014_add_us_legislators_schema.sql first.');
      process.exit(1);
    }
    
    // Fetch data from GitHub
    const currentLegislatorsData = await fetchAndSaveData(DATA_FILES.legislators);
    const historicalLegislatorsData = await fetchAndSaveData(DATA_FILES.legislatorsHistorical);
    
    // Check if sync is needed
    const syncNeeded = options.force || await isNewDataAvailable(currentLegislatorsData, historicalLegislatorsData);
    
    if (syncNeeded) {
      log.info('New data detected or force sync requested. Starting import...');
      
      // Parse JSON data
      const currentLegislators = JSON.parse(currentLegislatorsData);
      const historicalLegislators = options.force ? JSON.parse(historicalLegislatorsData) : [];
      
      // Process and import data
      await importLegislators([...currentLegislators, ...historicalLegislators]);
      
      // Update sync timestamp
      await updateSyncTimestamp();
      
      log.success('US Legislators sync completed successfully!');
    } else {
      log.info('No new data available. Sync skipped.');
    }
  } catch (error: any) {
    log.error(`Sync failed: ${error.message}`);
    if (options.verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

/**
 * Check if required tables exist in the database
 */
async function checkTablesExist() {
  const tables = await sql`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('us_leg_legislators', 'us_leg_terms', 'us_leg_ids', 'us_leg_names', 'us_leg_bio', 'us_leg_social_media')
  `;
  return parseInt(tables[0].count) === 6;
}

/**
 * Fetch data from GitHub and save to temp file
 */
async function fetchAndSaveData(filename: string): Promise<string> {
  const url = `${GITHUB_BASE_URL}${filename}`;
  const tempPath = path.join(TEMP_DIR, filename);
  
  log.verbose(`Fetching ${url}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.text();
  fs.writeFileSync(tempPath, data);
  log.verbose(`Saved data to ${tempPath}`);
  
  return data;
}

/**
 * Check if new data is available by comparing checksums
 */
async function isNewDataAvailable(currentData: string, historicalData: string): Promise<boolean> {
  const currentChecksum = createHash('md5').update(currentData).digest('hex');
  const historicalChecksum = createHash('md5').update(historicalData).digest('hex');
  const combinedChecksum = createHash('md5').update(currentChecksum + historicalChecksum).digest('hex');
  
  try {
    const metadataExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_metadata'
      ) as exists
    `;
    
    if (!metadataExists[0].exists) {
      log.error('The app_metadata table does not exist. Please run migration 015_add_app_metadata_table.sql first.');
      process.exit(1);
    }
    
    const storedChecksum = await sql`
      SELECT value FROM app_metadata
      WHERE key = 'us_legislators_checksum'
    `;
    
    if (storedChecksum.length === 0) {
      await sql`
        INSERT INTO app_metadata (key, value)
        VALUES ('us_legislators_checksum', ${combinedChecksum})
      `;
      return true;
    }
    
    if (storedChecksum[0].value !== combinedChecksum) {
      await sql`
        UPDATE app_metadata
        SET value = ${combinedChecksum}, updated_at = NOW()
        WHERE key = 'us_legislators_checksum'
      `;
      return true;
    }
    
    return false;
  } catch (error: any) {
    log.error(`Error checking for data changes: ${error.message}`);
    // If there's an error, assume we need to sync
    return true;
  }
}

/**
 * Import legislators data into the database
 */
async function importLegislators(legislators: any[]): Promise<void> {
  // Begin transaction
  await sql.begin(async (sql) => {
    // Clear existing data if doing a force sync
    if (options.force) {
      log.verbose('Force sync: Clearing existing data...');
      await sql`TRUNCATE us_leg_legislators CASCADE`;
    }
    
    log.info(`Processing ${legislators.length} legislators...`);
    
    // Process each legislator
    for (const legislator of legislators) {
      try {
        // Insert legislator
        const legislatorResult = await sql`
          INSERT INTO us_leg_legislators (last_updated) 
          VALUES (NOW()) 
          RETURNING id
        `;
        const legislatorId = legislatorResult[0].id;
        
        // Insert names
        if (legislator.name) {
          await sql`
            INSERT INTO us_leg_names 
            (legislator_id, first, middle, last, suffix, nickname, official_full)
            VALUES (
              ${legislatorId},
              ${legislator.name.first || null},
              ${legislator.name.middle || null},
              ${legislator.name.last || null},
              ${legislator.name.suffix || null},
              ${legislator.name.nickname || null},
              ${legislator.name.official_full || null}
            )
          `;
        }
        
        // Insert IDs
        if (legislator.id) {
          await sql`
            INSERT INTO us_leg_ids
            (legislator_id, bioguide_id, thomas_id, govtrack_id, opensecrets_id, fec_id, icpsr_id, lis_id)
            VALUES (
              ${legislatorId},
              ${legislator.id.bioguide || null},
              ${legislator.id.thomas || null},
              ${legislator.id.govtrack || null},
              ${legislator.id.opensecrets || null},
              ${Array.isArray(legislator.id.fec) ? legislator.id.fec[0] : (legislator.id.fec || null)},
              ${legislator.id.icpsr || null},
              ${legislator.id.lis || null}
            )
          `;
        }
        
        // Insert bio
        if (legislator.bio) {
          await sql`
            INSERT INTO us_leg_bio
            (legislator_id, birthday, gender)
            VALUES (
              ${legislatorId},
              ${legislator.bio.birthday || null},
              ${legislator.bio.gender || null}
            )
          `;
        }
        
        // Insert terms
        if (legislator.terms && Array.isArray(legislator.terms)) {
          for (const term of legislator.terms) {
            const isCurrent = isCurrentTerm(term);
            await sql`
              INSERT INTO us_leg_terms
              (legislator_id, type, state, district, party, start_date, end_date, chamber, url, office, phone, is_current)
              VALUES (
                ${legislatorId},
                ${term.type || null},
                ${term.state || null},
                ${term.district || null},
                ${term.party || null},
                ${term.start || null},
                ${term.end || null},
                ${term.type === 'sen' ? 'senate' : 'house'},
                ${term.url || null},
                ${term.office || null},
                ${term.phone || null},
                ${isCurrent}
              )
            `;
          }
        }
        
        // Insert social media
        const socialMedia = {
          twitter: getNestedValue(legislator, 'social', 'twitter'),
          facebook: getNestedValue(legislator, 'social', 'facebook'),
          youtube: getNestedValue(legislator, 'social', 'youtube'),
          instagram: getNestedValue(legislator, 'social', 'instagram')
        };
        
        if (socialMedia.twitter || socialMedia.facebook || socialMedia.youtube || socialMedia.instagram) {
          await sql`
            INSERT INTO us_leg_social_media
            (legislator_id, twitter, facebook, youtube, instagram)
            VALUES (
              ${legislatorId},
              ${socialMedia.twitter || null},
              ${socialMedia.facebook || null},
              ${socialMedia.youtube || null},
              ${socialMedia.instagram || null}
            )
          `;
        }
        
        log.verbose(`Processed legislator: ${legislator.name?.official_full || 'Unnamed'}`);
      } catch (error: any) {
        log.error(`Error processing legislator ${legislator.name?.official_full || 'Unnamed'}: ${error.message}`);
        throw error;
      }
    }
  });
}

/**
 * Update the sync timestamp in the metadata table
 */
async function updateSyncTimestamp() {
  await sql`
    INSERT INTO app_metadata (key, value)
    VALUES ('us_legislators_last_sync', NOW()::text)
    ON CONFLICT (key) DO UPDATE
    SET value = NOW()::text, updated_at = NOW()
  `;
}

/**
 * Check if a term is current based on its end date
 */
function isCurrentTerm(term: any): boolean {
  if (!term.end) return true;
  
  const endDate = new Date(term.end);
  const now = new Date();
  
  return endDate >= now;
}

/**
 * Safely get a nested value from an object
 */
function getNestedValue(obj: any, ...keys: string[]): any {
  return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj);
}

// Start the sync process
syncLegislators(); 