import postgres from 'postgres';
import { Bill } from './types';

interface BillId { bill_id: number }

export async function getBillsForAnalysis(sql: postgres.Sql, limit: number): Promise<Bill[]> {
    return await sql.begin(async (sql): Promise<Bill[]> => {
        try {
            // First get the eligible bill IDs with locking
            const eligibleBills = await sql<BillId[]>`
                SELECT b.bill_id
                FROM ls_bill b
                WHERE b.bill_type_id = 1
                AND (
                    NOT EXISTS (
                        SELECT 1 FROM bill_analysis_status bas 
                        WHERE bas.bill_id = b.bill_id
                    )
                    OR EXISTS (
                        SELECT 1 FROM bill_analysis_status bas 
                        WHERE bas.bill_id = b.bill_id
                        AND (
                            b.change_hash != bas.last_change_hash
                            OR bas.analysis_state = 'error'
                            OR (
                                bas.analysis_state = 'pending'
                                AND bas.updated_at < NOW() - INTERVAL '5 minutes'
                            )
                        )
                    )
                )
                AND (
                    array_length(regexp_split_to_array(trim(b.description), '\s+'), 1) >= 20
                    OR EXISTS (
                        SELECT 1 FROM ls_bill_amendment ba 
                        WHERE ba.bill_id = b.bill_id
                    )
                )
                ORDER BY ${sql(envConfig.randomOrder ? 'RANDOM()' : 'b.bill_id DESC')}
                LIMIT ${limit}
                FOR UPDATE SKIP LOCKED
            `;

            if (eligibleBills.length === 0) {
                return [];
            }

            // Then get full data for locked bills
            const bills = await sql<Bill[]>`
                WITH bill_data AS (
                    SELECT 
                        b.bill_id,
                        b.bill_type_id,
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
                    WHERE b.bill_id = ANY(${eligibleBills.map(b => b.bill_id)}::integer[])
                )
                SELECT * FROM bill_data
            `;

            // Mark selected bills as pending
            await sql`
                INSERT INTO bill_analysis_status (bill_id, analysis_state, updated_at)
                SELECT id, 'pending'::analysis_state_enum, NOW()
                FROM unnest(${eligibleBills.map(b => b.bill_id)}::integer[]) AS t(id)
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