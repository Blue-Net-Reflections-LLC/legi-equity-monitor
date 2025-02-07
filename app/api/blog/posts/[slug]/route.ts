import db from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch a single published blog post by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Get published post by slug
    const [post] = await db`
      SELECT 
        title,
        slug,
        content,
        published_at,
        author,
        is_curated,
        hero_image,
        main_image,
        thumb,
        created_at
      FROM blog_posts
      WHERE slug = ${slug}
      AND status = 'published'
      AND published_at <= NOW()
    `

    if (!post) {
      return new NextResponse('Post not found', { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 