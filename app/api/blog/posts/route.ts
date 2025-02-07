import db from '@/lib/db'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - List published blog posts with pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const size = Math.max(1, parseInt(searchParams.get('size') || '10'))
    const sort = searchParams.get('sort') || 'published_at'
    const order = searchParams.get('order') || 'desc'

    // Calculate offset
    const offset = (page - 1) * size

    // Get published posts with pagination
    const [posts, [{ total }]] = await Promise.all([
      db`
        SELECT 
          title,
          slug,
          SUBSTRING(content, 1, 300) as excerpt,
          published_at,
          author,
          is_curated,
          hero_image,
          main_image,
          thumb,
          created_at
        FROM blog_posts
        WHERE status = 'published'
        AND published_at <= NOW()
        ORDER BY ${sort ? db`${db(sort)} ${order === 'asc' ? db`ASC` : db`DESC`}` : db`published_at DESC`}
        LIMIT ${size}
        OFFSET ${offset}
      `,
      db`
        SELECT COUNT(*)::int as total 
        FROM blog_posts
        WHERE status = 'published'
        AND published_at <= NOW()
      `
    ])

    return NextResponse.json({
      data: posts,
      total,
      page,
      pageSize: size
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 