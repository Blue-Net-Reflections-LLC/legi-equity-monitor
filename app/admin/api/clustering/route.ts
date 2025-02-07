import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const size = Math.max(1, parseInt(searchParams.get('size') || '10'))
    const week = parseInt(searchParams.get('week') || '1')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const status = searchParams.get('status')

    // Calculate offset from 1-based page number
    const offset = (page - 1) * size
    
    // Get clusters with pagination and filters
    const [clusters, [{ total }]] = await Promise.all([
      db`
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
        WHERE EXTRACT(WEEK FROM c.min_date) = ${week}
        AND EXTRACT(YEAR FROM c.min_date) = ${year}
        ${status ? db`AND ca.status = ${status}` : db``}
        ORDER BY c.created_at DESC
        LIMIT ${size}
        OFFSET ${offset}
      `,
      db`
        SELECT COUNT(DISTINCT c.cluster_id)::int as total 
        FROM legislation_clusters c
        JOIN cluster_analysis ca ON c.cluster_id = ca.cluster_id
        WHERE EXTRACT(WEEK FROM c.min_date) = ${week}
        AND EXTRACT(YEAR FROM c.min_date) = ${year}
        ${status ? db`AND ca.status = ${status}` : db``}
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