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

    // Get latest analysis for the cluster
    const [analysis] = await db`
      SELECT *
      FROM cluster_analysis
      WHERE cluster_id = ${clusterId}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (!analysis) {
      return new NextResponse('Analysis not found', { status: 404 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 