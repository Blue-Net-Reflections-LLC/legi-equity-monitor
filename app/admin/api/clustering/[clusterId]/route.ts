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

    // Get cluster details with stats
    const [cluster] = await db`
      SELECT 
        c.*,
        cs.actual_bill_count,
        cs.actual_state_count,
        cs.min_confidence,
        cs.avg_confidence,
        cs.max_confidence,
        cs.earliest_bill_date,
        cs.latest_bill_date,
        cs.analysis_count,
        cs.blog_post_count
      FROM legislation_clusters c
      LEFT JOIN cluster_stats cs ON c.cluster_id = cs.cluster_id
      WHERE c.cluster_id = ${clusterId}::uuid
    `

    if (!cluster) {
      return new NextResponse('Cluster not found', { status: 404 })
    }

    return NextResponse.json(cluster)
  } catch (error) {
    console.error('Error fetching cluster:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 