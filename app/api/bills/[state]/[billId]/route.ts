import { NextResponse } from 'next/server'
import db from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { state: string } }
) {
  try {
    const [bill] = await db`
      SELECT 
        b.bill_id,
        b.bill_number,
        b.title,
        b.description,
        b.state_abbr,
        b.state_name,
        b.status_id,
        b.status_desc,
        b.status_date,
        b.bill_type_id,
        b.bill_type_name,
        b.bill_type_abbr,
        b.body_id,
        b.body_name,
        b.current_body_id,
        b.current_body_name,
        b.pending_committee_id,
        b.pending_committee_name,
        b.pending_committee_body_name,
        b.legiscan_url,
        b.state_url
      FROM ls_bill b
      WHERE b.bill_id = ${params.state}
    `

    if (!bill) {
      return new NextResponse('Bill not found', { status: 404 })
    }

    return NextResponse.json(bill)
  } catch (error) {
    console.error('Error fetching bill:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 