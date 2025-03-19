import postgres from 'postgres';
import { Bill } from './types';
import { validateConfig } from './config';
import { AnalysisConfig, defaultAnalysisConfig } from './analysis-config';

const envConfig = validateConfig();

interface BillId { bill_id: number }

export async function getBillsForAnalysis(
  sql: postgres.Sql,
  batchSize: number,
  config: AnalysisConfig = defaultAnalysisConfig
): Promise<Array<Bill>> {
  // Use a transaction to lock rows during selection
  return await sql.begin(async (sql) => {
    // First get eligible bill IDs with locking
    const eligibleBillIds = await sql`
      WITH 
      -- Identify bills with significant progress
      advanced_bills AS (
        SELECT DISTINCT b.bill_id
        FROM ls_bill b
        JOIN ls_bill_progress bp ON b.bill_id = bp.bill_id
        WHERE bp.progress_event_id IN (2, 3, 4, 5, 8) -- Engrossed, Enrolled, Passed, Vetoed, Chaptered
      ),
      
      -- Calculate passage likelihood score using pre-calculated tables
      scored_bills AS (
        SELECT 
          b.bill_id,
          b.title,
          -- Determine if bill is introduced only or more advanced
          NOT EXISTS (
            SELECT 1 FROM ls_bill_progress bp 
            WHERE bp.bill_id = b.bill_id AND bp.progress_event_id IN (2, 3, 4, 5, 8)
          ) AS is_introduced_only,
          
          -- Committee power score (up to 35 points)
          COALESCE((
            SELECT cps.power_score
            FROM committee_power_scores cps
            JOIN ls_bill_referral br ON cps.committee_id = br.committee_id
            WHERE br.bill_id = b.bill_id
            ORDER BY cps.power_score DESC
            LIMIT 1
          ), 0) AS committee_score,
          
          -- Sponsor success score (up to 100 points, scaled down to 35 max)
          COALESCE((
            SELECT sss.success_score * 0.35
            FROM sponsor_success_scores sss
            JOIN ls_bill_sponsor bs ON sss.people_id = bs.people_id
            WHERE bs.bill_id = b.bill_id AND bs.sponsor_type_id = 1
            LIMIT 1
          ), 0) AS sponsor_score,
          
          -- Bipartisan support (10 points)
          CASE WHEN EXISTS (
            -- Democrat primary sponsor with Republican cosponsors
            SELECT 1 FROM ls_bill_sponsor bs1
            JOIN ls_people p1 ON bs1.people_id = p1.people_id
            WHERE bs1.bill_id = b.bill_id AND bs1.sponsor_type_id = 1 AND p1.party_id = 1
            AND EXISTS (
              SELECT 1 FROM ls_bill_sponsor bs2
              JOIN ls_people p2 ON bs2.people_id = p2.people_id
              WHERE bs2.bill_id = b.bill_id AND bs2.sponsor_type_id != 1 AND p2.party_id = 2
            )
          ) OR EXISTS (
            -- Republican primary sponsor with Democrat cosponsors
            SELECT 1 FROM ls_bill_sponsor bs1
            JOIN ls_people p1 ON bs1.people_id = p1.people_id
            WHERE bs1.bill_id = b.bill_id AND bs1.sponsor_type_id = 1 AND p1.party_id = 2
            AND EXISTS (
              SELECT 1 FROM ls_bill_sponsor bs2
              JOIN ls_people p2 ON bs2.people_id = p2.people_id
              WHERE bs2.bill_id = b.bill_id AND bs2.sponsor_type_id != 1 AND p2.party_id = 1
            )
          ) THEN 10 ELSE 0 END AS bipartisan_score,
          
          -- Amendment score (20 points for adopted amendments)
          CASE WHEN EXISTS (
            SELECT 1 FROM ls_bill_amendment ba
            WHERE ba.bill_id = b.bill_id AND ba.adopted = 1
          ) THEN 20 ELSE 0 END AS amendment_score
        FROM ls_bill b
        WHERE b.bill_type_id = 1  -- Only regular bills
        AND b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)  -- Current session
        AND b.updated >= NOW() - INTERVAL '${config.recencyWindowDays} days'  -- Recently updated
        -- Only get bills not already processed
        AND NOT EXISTS (
          SELECT 1 FROM bill_analysis_status bas
          WHERE bas.bill_id = b.bill_id 
          AND bas.analysis_state IN ('completed')
        )
      ),
      
      -- Final bill selection with passage likelihood thresholds
      eligible_bills AS (
        SELECT 
          sb.bill_id,
          sb.committee_score + sb.sponsor_score + sb.bipartisan_score + sb.amendment_score AS passage_likelihood_score
        FROM scored_bills sb
        LEFT JOIN advanced_bills ab ON sb.bill_id = ab.bill_id
        WHERE (
          -- Include advanced bills if configured
          (${config.includeAdvancedBills} AND ab.bill_id IS NOT NULL)
          
          -- For introduced bills, apply stricter passage likelihood threshold (50%)
          OR (sb.is_introduced_only AND 
             (sb.committee_score + sb.sponsor_score + sb.bipartisan_score + sb.amendment_score) >= 50)
        )
        ORDER BY ${!envConfig.randomOrder ? sql`sb.bill_id DESC` : sql`RANDOM()`}
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      SELECT bill_id AS id FROM eligible_bills
    `;

    if (eligibleBillIds.length === 0) {
      return [];
    }

    // Mark selected bills as processing to prevent other workers from picking them up
    await sql`
      INSERT INTO bill_analysis_status (bill_id, analysis_state, updated_at)
      SELECT id, 'pending'::analysis_state_enum, NOW()
      FROM unnest(${eligibleBillIds.map(b => b.id)}::int[]) AS t(id)
      ON CONFLICT (bill_id) 
      DO UPDATE SET analysis_state = 'pending'::analysis_state_enum, updated_at = NOW()
    `;

    // Now fetch full bill data for the locked IDs
    const query = `
      SELECT 
        b.bill_id as id,
        b.bill_number,
        b.title,
        b.state_id,
        (SELECT state_abbr FROM ls_state WHERE state_id = b.state_id) as state_abbr
      FROM ls_bill b
      WHERE b.bill_id IN (${eligibleBillIds.map(b => b.id).join(',')})
    `;
    
    // Execute query and map results
    const bills = await sql.unsafe(query);
    
    // Map to expected Bill interface
    return bills.map((bill: any) => ({
      id: bill.id,
      bill_number: bill.bill_number,
      title: bill.title,
      state_abbr: bill.state_abbr
    }));
  });
} 