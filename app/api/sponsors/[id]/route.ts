import { NextResponse } from 'next/server'
import db from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [sponsor] = await db`
      SELECT 
        p.name,
        r.role_name as title,
        st.state_abbr,
        pa.party_name as party,
        p.district,
        p.votesmart_id,
        (
          SELECT COUNT(*)::int
          FROM ls_bill_sponsor bs
          INNER JOIN ls_bill b ON bs.bill_id = b.bill_id
          WHERE bs.people_id = p.people_id
          AND bs.sponsor_type_id = 1
          AND b.bill_type_id = 1
        ) as bills_sponsored,
        (
          SELECT COUNT(*)::int
          FROM ls_bill_sponsor bs
          INNER JOIN ls_bill b ON bs.bill_id = b.bill_id
          WHERE bs.people_id = p.people_id
          AND bs.sponsor_type_id = 2
          AND b.bill_type_id = 1
        ) as bills_cosponsored
      FROM ls_people p
      INNER JOIN ls_party pa ON p.party_id = pa.party_id
      INNER JOIN ls_role r ON p.role_id = r.role_id
      INNER JOIN ls_state st ON p.state_id = st.state_id
      WHERE p.people_id = ${params.id}
    `

    if (!sponsor) {
      return new NextResponse('Sponsor not found', { status: 404 })
    }

    return NextResponse.json(sponsor)
  } catch (error) {
    console.error('Error fetching sponsor:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 