import postgres from 'postgres';
import { Bill } from './types';
import { validateConfig } from './config';

const envConfig = validateConfig();

interface BillId { bill_id: number }

export async function getBillsForAnalysis(sql: postgres.Sql, batchSize: number): Promise<Bill[]> {
  return await sql.begin(async (sql): Promise<Bill[]> => {
    try {
      // First get eligible bill IDs with locking using new scoring logic
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
          AND b.updated >= NOW() - INTERVAL '30 days'  -- Recently updated bills (hardcoded to 30 days)
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
            -- Include advanced bills
            (ab.bill_id IS NOT NULL)
            
            -- For introduced bills, apply stricter passage likelihood threshold (50%)
            OR (sb.is_introduced_only AND 
               (sb.committee_score + sb.sponsor_score + sb.bipartisan_score + sb.amendment_score) >= 50)
          )
          ORDER BY RANDOM()
          LIMIT ${batchSize}
          FOR UPDATE SKIP LOCKED
        )
        SELECT bill_id AS id FROM eligible_bills
      `;

      if (eligibleBillIds.length === 0) {
        return [];
      }

      // Then get full data for locked bills - USING ORIGINAL QUERY FROM MAIN BRANCH
      const bills = await sql<Bill[]>`
        WITH bill_data AS (
          SELECT
            b.bill_id,
            b.bill_type_id,
            b.title,
            b.description,
            b.change_hash,
            b.status_id as status,
            ses.year_start as session_year_start,
            ses.year_end as session_year_end,
            st.state_name as state,
            -- Get sponsors as JSON array
            (
              SELECT json_agg(json_build_object(
                'people_id', sp.people_id,
                'party', party.party_name,
                'type', CASE WHEN sp.sponsor_order = 1 THEN 'Primary Sponsor' ELSE 'Co-Sponsor' END
              ))
              FROM ls_bill_sponsor sp
              JOIN ls_people p ON sp.people_id = p.people_id
              JOIN ls_party party ON p.party_id = party.party_id
              WHERE sp.bill_id = b.bill_id
            ) as sponsors,
            -- Get subjects as JSON array
            (
              SELECT json_agg(s.subject_name)
              FROM ls_bill_subject bs
              JOIN ls_subject s ON bs.subject_id = s.subject_id
              WHERE bs.bill_id = b.bill_id
            ) as subjects,
            -- Get amendments
            (
              SELECT json_agg(json_build_object(
                'amendment_id', ba.amendment_id,
                'title', ba.amendment_title,
                'description', ba.amendment_desc,
                'adopted', (ba.adopted = 1)
              ))
              FROM ls_bill_amendment ba
              WHERE ba.bill_id = b.bill_id
            ) as amendments,
            -- Get full texts
            (
              SELECT json_agg(json_build_object(
                'date', bt.bill_text_date,
                'name', tt.bill_text_name,
                'content_url', bt.state_url
              ))
              FROM ls_bill_text bt
              JOIN ls_text_type tt ON bt.bill_text_type_id = tt.bill_text_type_id
              WHERE bt.bill_id = b.bill_id
            ) as full_texts
          FROM ls_bill b
          LEFT JOIN ls_session ses ON b.session_id = ses.session_id
          LEFT JOIN ls_state st ON b.state_id = st.state_id
          WHERE b.bill_id = ANY(${eligibleBillIds.map(b => b.id)}::integer[])
        )
        SELECT * FROM bill_data
      `;

      // Mark selected bills as pending - USING ORIGINAL PARAMETER STYLE
      await sql`
        INSERT INTO bill_analysis_status (bill_id, analysis_state, updated_at)
        SELECT id, 'pending'::analysis_state_enum, NOW()
        FROM unnest(${eligibleBillIds.map(b => b.id)}::integer[]) AS t(id)
        ON CONFLICT (bill_id)
        DO UPDATE SET analysis_state = 'pending'::analysis_state_enum, updated_at = NOW()
      `;

      return bills;
    } catch (error) {
      // Transaction will automatically rollback on error
      console.error('Error in getBillsForAnalysis:', error);
      throw error;
    }
  });
} 