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
      
      -- Final bill selection combining basic criteria before detailed scoring
      eligible_bills AS (
        SELECT 
          b.bill_id
        FROM ls_bill b
        LEFT JOIN advanced_bills ab ON b.bill_id = ab.bill_id
        WHERE b.bill_type_id = 1  -- Only regular bills
        AND b.session_id = (SELECT MAX(session_id) FROM ls_session WHERE state_id = b.state_id)  -- Current session
        AND b.updated >= NOW() - INTERVAL '${config.recencyWindowDays} days'  -- Recently updated
        -- Only get bills not already processed
        AND NOT EXISTS (
          SELECT 1 FROM bill_analysis_status bas
          WHERE bas.bill_id = b.bill_id 
          AND bas.analysis_state IN ('completed')
        )
        ORDER BY ${!envConfig.randomOrder ? sql`b.bill_id DESC` : sql`RANDOM()`}
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
      WITH 
      -- Committee Power scoring (contributes up to 40 points)
      committee_scores AS (
        SELECT 
          c.committee_id,
          (
            -- Base points: Maximum 5 points for committee with bills
            CASE WHEN COUNT(DISTINCT br.bill_id) >= 50 THEN 5
                 WHEN COUNT(DISTINCT br.bill_id) >= 20 THEN 3
                 WHEN COUNT(DISTINCT br.bill_id) >= 5 THEN 1
                 ELSE 0 END +
            -- Engrossed: 5 points maximum
            CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2) 
                   THEN br.bill_id END) >= 20 THEN 5
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2) 
                   THEN br.bill_id END) >= 10 THEN 3
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 2) 
                   THEN br.bill_id END) >= 1 THEN 1
                 ELSE 0 END +
            -- Enrolled: 10 points maximum
            CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3) 
                   THEN br.bill_id END) >= 20 THEN 10
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3) 
                   THEN br.bill_id END) >= 10 THEN 7
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3) 
                   THEN br.bill_id END) >= 5 THEN 5
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 3) 
                   THEN br.bill_id END) >= 1 THEN 2
                 ELSE 0 END +
            -- Passed: 15 points maximum
            CASE WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4) 
                   THEN br.bill_id END) >= 20 THEN 15
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4) 
                   THEN br.bill_id END) >= 10 THEN 10
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4) 
                   THEN br.bill_id END) >= 5 THEN 7
                 WHEN COUNT(DISTINCT CASE WHEN EXISTS (
                   SELECT 1 FROM ls_bill_progress bp 
                   WHERE bp.bill_id = br.bill_id AND bp.progress_event_id = 4) 
                   THEN br.bill_id END) >= 1 THEN 3
                 ELSE 0 END
          ) AS power_score
        FROM ls_committee c
        JOIN ls_bill_referral br ON c.committee_id = br.committee_id
        GROUP BY c.committee_id
        HAVING COUNT(DISTINCT br.bill_id) > 0
      ),
      
      -- Sponsor success rates (contributes to sponsor leadership scoring)
      sponsor_success_rates AS (
        SELECT
          p.people_id,
          COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) AS bills_sponsored,
          COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
            SELECT 1 FROM ls_bill_progress bp 
            WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
          ) THEN bs.bill_id END) AS successful_bills,
          CASE 
            WHEN COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END) > 0 
            THEN (COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 AND EXISTS (
              SELECT 1 FROM ls_bill_progress bp 
              WHERE bp.bill_id = bs.bill_id AND bp.progress_event_id IN (3, 4, 8)
            ) THEN bs.bill_id END)::float / 
              COUNT(DISTINCT CASE WHEN bs.sponsor_type_id = 1 THEN bs.bill_id END))
            ELSE 0 
          END AS success_rate
        FROM 
          ls_people p
        JOIN 
          ls_bill_sponsor bs ON p.people_id = bs.people_id
        GROUP BY
          p.people_id
      ),
      
      -- Bipartisan support calculation
      bipartisan_scores AS (
        SELECT 
          b.bill_id,
          -- Primary sponsor party
          (SELECT pa.party_id 
           FROM ls_bill_sponsor bs 
           JOIN ls_people p ON bs.people_id = p.people_id
           JOIN ls_party pa ON p.party_id = pa.party_id
           WHERE bs.bill_id = b.bill_id AND bs.sponsor_type_id = 1 
           LIMIT 1) AS primary_sponsor_party_id,
          -- Count Democrat cosponsors
          COUNT(DISTINCT CASE WHEN p.party_id = 1 AND bs.sponsor_type_id != 1 THEN bs.people_id END) AS dem_cosponsors,
          -- Count Republican cosponsors
          COUNT(DISTINCT CASE WHEN p.party_id = 2 AND bs.sponsor_type_id != 1 THEN bs.people_id END) AS rep_cosponsors
        FROM ls_bill b
        JOIN ls_bill_sponsor bs ON b.bill_id = bs.bill_id
        JOIN ls_people p ON bs.people_id = p.people_id
        GROUP BY b.bill_id
      ),
      
      -- Final bill selection combining all criteria
      bill_selection AS (
        SELECT 
          b.bill_id as id,
          b.bill_number,
          b.title,
          b.state_id,
          (SELECT state_abbr FROM ls_state WHERE state_id = b.state_id) as state_abbr,
          
          -- Committee score
          COALESCE((
            SELECT cs.power_score
            FROM committee_scores cs
            JOIN ls_bill_referral br ON cs.committee_id = br.committee_id
            WHERE br.bill_id = b.bill_id
            ORDER BY cs.power_score DESC
            LIMIT 1
          ), 0) AS committee_score,
          
          -- Sponsor success rate
          COALESCE((
            SELECT ssr.success_rate
            FROM sponsor_success_rates ssr
            JOIN ls_bill_sponsor bs ON ssr.people_id = bs.people_id
            WHERE bs.bill_id = b.bill_id AND bs.sponsor_type_id = 1
            LIMIT 1
          ), 0) AS sponsor_success_rate,
          
          -- Sponsor bill count
          COALESCE((
            SELECT ssr.bills_sponsored
            FROM sponsor_success_rates ssr
            JOIN ls_bill_sponsor bs ON ssr.people_id = bs.people_id
            WHERE bs.bill_id = b.bill_id AND bs.sponsor_type_id = 1
            LIMIT 1
          ), 0) AS sponsor_bill_count,
          
          -- Bipartisan check (has cosponsors from both major parties)
          CASE
            WHEN EXISTS (
              SELECT 1 FROM bipartisan_scores bs 
              WHERE bs.bill_id = b.bill_id
              AND bs.primary_sponsor_party_id = 1 AND bs.rep_cosponsors > 0
            ) THEN TRUE
            WHEN EXISTS (
              SELECT 1 FROM bipartisan_scores bs 
              WHERE bs.bill_id = b.bill_id
              AND bs.primary_sponsor_party_id = 2 AND bs.dem_cosponsors > 0
            ) THEN TRUE
            ELSE FALSE
          END AS has_bipartisan_support,
          
          -- Whether this is an advanced bill
          CASE WHEN EXISTS (SELECT 1 FROM advanced_bills ab WHERE ab.bill_id = b.bill_id) 
               THEN TRUE ELSE FALSE END AS is_advanced_bill
        FROM ls_bill b
        WHERE b.bill_id IN (${eligibleBillIds.map(b => b.id).join(',')})
      )
      
      -- Final selection with scoring criteria
      SELECT 
        id,
        bill_number,
        title,
        state_abbr
      FROM bill_selection
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