import { NextResponse } from 'next/server'
import db from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [bill] = await db`
      SELECT 
        bill_number,
        title,
        description,
        state_abbr,
        state_name,
        status_desc,
        current_body_name
      FROM lsv_bill
      WHERE bill_id = ${params.id}
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