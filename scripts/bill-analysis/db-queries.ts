import postgres from 'postgres';
import { Bill } from './types';

export async function getBillsForAnalysis(sql: postgres.Sql, limit: number, offset = 0): Promise<Bill[]> {
    // Query to find bills with all required fields
    const bills = await sql<Bill[]>`
        WITH bill_data AS (
            SELECT 
                b.bill_id,
                b.bill_type_id,
                b.description,
                b.change_hash,
                b.status_id,
                s.status_desc as status,
                ses.year_start as session_year_start,
                ses.year_end as session_year_end,
                st.state_name as state,
                -- Get sponsors as JSON array
                (
                    SELECT json_agg(json_build_object(
                        'people_id', sp.people_id,
                        'party', p.party_abbr,
                        'type', CASE WHEN sp.sponsor_order = 1 THEN 'Primary Sponsor' ELSE 'Co-Sponsor' END
                    ))
                    FROM ls_bill_sponsor sp
                    JOIN ls_people p ON sp.people_id = p.people_id
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
                        'name', bt.bill_text_name,
                        'content_url', bt.state_url
                    ))
                    FROM ls_bill_text bt
                    WHERE bt.bill_id = b.bill_id
                ) as full_texts
            FROM ls_bill b
            LEFT JOIN ls_status s ON b.status_id = s.status_id
            LEFT JOIN ls_session ses ON b.session_id = ses.session_id
            LEFT JOIN ls_state st ON b.state_id = st.state_id
            LEFT JOIN bill_analysis_status bas ON b.bill_id = bas.bill_id
            WHERE b.bill_type_id = 1  -- Only actual bills
            AND (
                bas.bill_id IS NULL  -- New bills
                OR b.change_hash != bas.last_change_hash  -- Changed bills
            )
            AND (
                array_length(regexp_split_to_array(trim(b.description), '\s+'), 1) >= 20
                OR EXISTS (
                    SELECT 1 FROM ls_bill_amendment ba 
                    WHERE ba.bill_id = b.bill_id
                )
            )
        )
        SELECT *
        FROM bill_data
        ORDER BY bill_id DESC
        LIMIT ${limit}
        OFFSET ${offset}
    `;

    return bills;
} 