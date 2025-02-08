import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import { batchUpdateBlogPostSchema } from '@/app/lib/validations/blog'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - List all blog posts with filtering and pagination
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    // Check authentication
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check admin role
    if (!session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '12'))
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build the base query
    let query = db`
      SELECT 
        post_id,
        title,
        slug,
        status,
        author,
        published_at,
        created_at,
        is_curated
      FROM blog_posts
    `

    let countQuery = db`SELECT COUNT(*)::int as total FROM blog_posts`
    const conditions = []
    const countConditions = []


    // Add status filter if provided
    if (status) {
      conditions.push(db`status = ${status}`)
      countConditions.push(db`status = ${status}`)
    }

    // Add search filter if provided
    if (search) {
      const searchCondition = db`(
        title ILIKE ${'%' + search + '%'} OR 
        content ILIKE ${'%' + search + '%'}
      )`
      conditions.push(searchCondition)
      countConditions.push(searchCondition)
    }

    // Combine conditions if any exist
    if (conditions.length > 0) {
      query = db`
        SELECT 
          post_id,
          title,
          slug,
          status,
          author,
          published_at,
          created_at,
          is_curated
        FROM blog_posts
        WHERE ${db.unsafe(conditions.map(c => `(${c})`).join(' AND '))}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
      countQuery = db`
        SELECT COUNT(*)::int as total 
        FROM blog_posts
        WHERE ${db.unsafe(countConditions.map(c => `(${c})`).join(' AND '))}
      `
    } else {
      query = db`
        SELECT 
          post_id,
          title,
          slug,
          status,
          author,
          published_at,
          created_at,
          is_curated
        FROM blog_posts
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }

    // Execute queries
    const [posts, [{ total }]] = await Promise.all([
      query,
      countQuery
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST - Create a new blog post
export async function POST(request: Request) {
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
    const body = await request.json()
    
    // Insert new blog post
    const [post] = await db`
      INSERT INTO blog_posts ${db(body, [
        'title',
        'slug',
        'content',
        'status',
        'published_at',
        'author',
        'is_curated',
        'hero_image',
        'main_image',
        'thumb'
      ])}
      RETURNING *
    `

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PUT - Update blog post status
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    // Check authentication
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check admin role
    if (!session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { postId, status } = await request.json()

    if (!postId || !status) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const [updatedPost] = await db`
      UPDATE blog_posts
      SET 
        status = ${status},
        published_at = CASE 
          WHEN ${status} = 'published' THEN CURRENT_TIMESTAMP
          ELSE NULL
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE post_id = ${postId}
      RETURNING *
    `

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating blog post:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PATCH - Batch update posts
export async function PATCH(request: Request) {
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
    const body = await request.json()
    
    // Validate request body
    const validationResult = batchUpdateBlogPostSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { ids, data } = validationResult.data

    // Update posts
    const posts = await db`
      UPDATE blog_posts 
      SET ${db(data)}
      WHERE id = ANY(${ids})
      RETURNING *
    `

    if (posts.length === 0) {
      return new NextResponse('No posts found', { status: 404 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error updating blog posts:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// DELETE - Delete a blog post
export async function DELETE(request: Request) {
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
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('Post ID is required', { status: 400 })
    }

    // Delete post
    const [post] = await db`
      DELETE FROM blog_posts
      WHERE id = ${parseInt(id)}
      RETURNING *
    `

    if (!post) {
      return new NextResponse('Post not found', { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 