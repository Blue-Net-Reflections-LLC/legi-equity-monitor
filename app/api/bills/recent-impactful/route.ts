import db from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get bills from the last 10 days with high impact scores
    const rows = await db`
      WITH recent_bills AS (
        SELECT 
          b.bill_id,
          b.state_id,
          st.state_abbr,
          st.state_name,
          b.bill_number,
          b.title,
          b.status_date,
          h.history_date as latest_action_date,
          ar.overall_bias_score,
          ar.overall_positive_impact_score
        FROM ls_bill b
        JOIN ls_state st ON b.state_id = st.state_id
        JOIN bill_analysis_results ar ON b.bill_id = ar.bill_id
        LEFT JOIN LATERAL (
          SELECT history_date
          FROM ls_bill_history
          WHERE bill_id = b.bill_id
          ORDER BY history_step DESC
          LIMIT 1
        ) h ON true
        WHERE 
          h.history_date >= NOW() - INTERVAL '10 days'
          AND b.bill_type_id = 1  -- Regular bills only
          AND b.status_id IN (1, 2, 3, 4)  -- Introduced, Engrossed, Enrolled, or Passed
      ),
      high_impact_bills AS (
        (
          -- High bias bills
          SELECT 
            *,
            overall_bias_score as sort_score,
            1 as score_type
          FROM recent_bills
          WHERE overall_bias_score >= 0.6
          ORDER BY overall_bias_score DESC, latest_action_date DESC
          LIMIT 6
        )
        UNION ALL
        (
          -- High positive impact bills
          SELECT 
            *,
            overall_positive_impact_score as sort_score,
            2 as score_type
          FROM recent_bills
          WHERE overall_positive_impact_score >= 0.6
          ORDER BY overall_positive_impact_score DESC, latest_action_date DESC
          LIMIT 6
        )
      )
      SELECT 
        bill_id,
        state_id,
        state_abbr,
        state_name,
        bill_number,
        title,
        status_date,
        latest_action_date,
        overall_bias_score,
        overall_positive_impact_score
      FROM high_impact_bills
      ORDER BY sort_score DESC, latest_action_date DESC;
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.error();
  }
} 