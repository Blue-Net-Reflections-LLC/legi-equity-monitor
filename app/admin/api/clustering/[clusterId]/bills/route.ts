import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { clusterId: string } }
) {
  const session = await auth()
  
  // Check authentication
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check admin role
  if (!session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const { clusterId } = params

    // Get bills in the cluster
    const bills = await db`
      SELECT 
        cb.*,
        b.bill_number,
        b.title,
        b.description,
        b.status_date,
        s.state_abbr,
        s.state_name
      FROM cluster_bills cb
      JOIN ls_bill b ON cb.bill_id = b.bill_id
      JOIN ls_state s ON b.state_id = s.state_id
      WHERE cb.cluster_id = ${clusterId}::uuid
      ORDER BY cb.membership_confidence DESC
    `

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching cluster bills:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 