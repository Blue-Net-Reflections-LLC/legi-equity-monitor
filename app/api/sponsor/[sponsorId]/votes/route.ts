import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { sponsorId: string } }
) {
  try {
    const votes = await db`
      SELECT 
        rcv.roll_call_id,
        rcv.vote_text,
        rcv.vote_date,
        b.bill_id,
        b.bill_number,
        b.title,
        b.description,
        b.state_abbr,
        rc.roll_call_desc,
        rc.yea,
        rc.nay,
        rc.nv,
        rc.absent,
        rc.passed
      FROM ls_roll_call_vote rcv
      INNER JOIN ls_roll_call rc ON rcv.roll_call_id = rc.roll_call_id
      INNER JOIN ls_bill b ON rc.bill_id = b.bill_id
      WHERE rcv.people_id = ${params.sponsorId}
      ORDER BY rcv.vote_date DESC
      LIMIT 50
    `;

    return NextResponse.json(votes);
  } catch (error) {
    console.error('Error fetching voting history:', error);
    return NextResponse.json({ error: 'Failed to fetch voting history' }, { status: 500 });
  }
} 