import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const size = Math.max(1, parseInt(searchParams.get('size') || '10'))
    const week = parseInt(searchParams.get('week') || '0')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'min_date'
    const order = searchParams.get('order') || 'desc'

    // Calculate offset from 1-based page number
    const offset = (page - 1) * size
    
    // Get clusters with pagination and filters
    const [clusters, [{ total }]] = await Promise.all([
      db`
        WITH week_dates AS (
          SELECT 
            date_trunc('week', make_date(${year}, 1, 1)) + 
            (interval '1 week' * (${week} - 1)) as week_start,
            date_trunc('week', make_date(${year}, 1, 1)) + 
            (interval '1 week' * ${week}) as week_end
          WHERE ${week} > 0
        )
        SELECT DISTINCT
          c.cluster_id,
          c.bill_count,
          c.state_count,
          c.min_date,
          ca.status,
          ca.executive_summary,
          c.created_at,
          c.updated_at
        FROM legislation_clusters c
        JOIN cluster_analysis ca ON c.cluster_id = ca.cluster_id
        LEFT JOIN blog_posts bp ON c.cluster_id = bp.cluster_id
        LEFT JOIN week_dates wd ON true
        WHERE EXTRACT(YEAR FROM c.min_date) = ${year}
        ${week > 0 ? db`AND c.min_date >= wd.week_start AND c.min_date < wd.week_end` : db``}
        ${status ? db`AND ca.status = ${status}` : db``}
        AND bp.post_id IS NULL
        ORDER BY ${sort ? db`${db(sort)} ${order === 'asc' ? db`ASC` : db`DESC`}` : db`c.created_at DESC`}
        LIMIT ${size}
        OFFSET ${offset}
      `,
      db`
        WITH week_dates AS (
          SELECT 
            date_trunc('week', make_date(${year}, 1, 1)) + 
            (interval '1 week' * (${week} - 1)) as week_start,
            date_trunc('week', make_date(${year}, 1, 1)) + 
            (interval '1 week' * ${week}) as week_end
          WHERE ${week} > 0
        )
        SELECT COUNT(DISTINCT c.cluster_id)::int as total 
        FROM legislation_clusters c
        JOIN cluster_analysis ca ON c.cluster_id = ca.cluster_id
        LEFT JOIN blog_posts bp ON c.cluster_id = bp.cluster_id
        LEFT JOIN week_dates wd ON true
        WHERE EXTRACT(YEAR FROM c.min_date) = ${year}
        ${week > 0 ? db`AND c.min_date >= wd.week_start AND c.min_date < wd.week_end` : db``}
        ${status ? db`AND ca.status = ${status}` : db``}
        AND bp.post_id IS NULL
      `
    ])

    return NextResponse.json({
      data: clusters,
      total: Number(total),
      page: page,
      pageSize: size
    })
  } catch (error) {
    console.error('Error fetching clusters:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 