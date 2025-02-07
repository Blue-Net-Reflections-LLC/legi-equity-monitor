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

    // Get bills in the cluster with analysis data
    const bills = await db`
      WITH bill_categories AS (
        SELECT 
          bar.bill_id,
          json_agg(
            json_build_object(
              'category', bacs.category,
              'bias_score', bacs.bias_score,
              'positive_impact_score', bacs.positive_impact_score
            )
          ) as categories
        FROM bill_analysis_results bar
        JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
        GROUP BY bar.bill_id
      )
      SELECT 
        cb.*,
        b.bill_number,
        b.title,
        b.description,
        b.status_date,
        s.state_abbr,
        s.state_name,
        bar.overall_bias_score,
        bar.overall_positive_impact_score,
        bc.categories
      FROM cluster_bills cb
      JOIN ls_bill b ON cb.bill_id = b.bill_id
      JOIN ls_state s ON b.state_id = s.state_id
      LEFT JOIN bill_analysis_results bar ON cb.bill_id = bar.bill_id
      LEFT JOIN bill_categories bc ON cb.bill_id = bc.bill_id
      WHERE cb.cluster_id = ${clusterId}::uuid
      ORDER BY cb.membership_confidence DESC
    `

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching cluster bills:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 