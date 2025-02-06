import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import db from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth()
  
  // 1. Check authentication
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Check admin role
  if (!session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const week = parseInt(searchParams.get('week') || '1')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const status = searchParams.get('status')

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize

    // Get total count with filters
    const countQuery = db`
      SELECT COUNT(DISTINCT c.cluster_id) as total 
      FROM legislation_clusters c
      JOIN cluster_analysis ca ON c.cluster_id = ca.cluster_id
      WHERE EXTRACT(WEEK FROM c.min_date) = ${week}
      AND EXTRACT(YEAR FROM c.min_date) = ${year}
      ${status ? db`AND ca.status = ${status}` : db``}
    `

    // Get paginated results
    const itemsQuery = db`
      SELECT DISTINCT
        c.cluster_id,
        c.bill_count,
        c.state_count,
        ca.status,
        ca.executive_summary,
        c.created_at,
        c.updated_at
      FROM legislation_clusters c
      JOIN cluster_analysis ca ON c.cluster_id = ca.cluster_id
      WHERE EXTRACT(WEEK FROM c.min_date) = ${week}
      AND EXTRACT(YEAR FROM c.min_date) = ${year}
      ${status ? db`AND ca.status = ${status}` : db``}
      ORDER BY c.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `

    const [countResult, items] = await Promise.all([countQuery, itemsQuery])
    const [{ total }] = countResult

    return Response.json({
      items,
      total: parseInt(total),
      page,
      pageSize
    })

  } catch (error) {
    console.error('Error fetching clusters:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 