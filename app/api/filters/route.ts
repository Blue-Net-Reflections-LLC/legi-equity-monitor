import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Get unique committees from the LegiScan view
    const committees = await sql`
      SELECT DISTINCT pending_committee_name
      FROM lsv_bill
      WHERE pending_committee_name IS NOT NULL 
        AND pending_committee_name != ''
      ORDER BY pending_committee_name ASC
    `;

    // Return just the committees since we don't have categories in the LegiScan schema
    return NextResponse.json({
      committees: committees.map(c => c.pending_committee_name).filter(Boolean),
      categories: [] // No categories in LegiScan schema
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
} 