import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { sponsorId: string } }
) {
  try {
    const votes = await db`
      SELECT 
        bv.roll_call_id,
        bvd.vote_id,
        CASE 
          WHEN bvd.vote_id = 1 THEN 'Yea'
          WHEN bvd.vote_id = 2 THEN 'Nay'
          WHEN bvd.vote_id = 3 THEN 'Not Voting'
          ELSE 'Other'
        END as vote_text,
        bv.roll_call_date as vote_date,
        b.bill_id,
        b.bill_number,
        b.title,
        b.description,
        st.state_abbr,
        bv.roll_call_desc,
        bv.yea,
        bv.nay,
        bv.nv,
        bv.absent,
        bv.passed
      FROM ls_bill_vote bv
      INNER JOIN ls_bill_vote_detail bvd ON bv.roll_call_id = bvd.roll_call_id
      INNER JOIN ls_bill b ON bv.bill_id = b.bill_id
      INNER JOIN ls_state st ON b.state_id = st.state_id
      WHERE bvd.people_id = ${params.sponsorId}
      AND b.bill_type_id = 1
      ORDER BY bv.roll_call_date DESC
      LIMIT 50
    `;

    return NextResponse.json(votes);
  } catch (error) {
    console.error('Error fetching voting history:', error);
    return NextResponse.json({ error: 'Failed to fetch voting history' }, { status: 500 });
  }
} 