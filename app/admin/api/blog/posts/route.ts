import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import { batchUpdateBlogPostSchema } from '@/app/lib/validations/blog'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


// GET - List blog posts with pagination and filters
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    // Validate pagination params
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { errors: { page: ['Invalid page number'] } },
        { status: 400 }
      )
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { errors: { limit: ['Limit must be between 1 and 100'] } },
        { status: 400 }
      )
    }

    const offset = (page - 1) * limit

    // Build query conditions
    const conditions: string[] = []
    const params: string[] = []


    if (status) {
      conditions.push('status = $1')
      params.push(status)
    }

    if (search) {
      const searchParam = `%${search}%`
      conditions.push('(title ILIKE $${params.length + 1} OR content ILIKE $${params.length + 1})')
      params.push(searchParam)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const [{ total }] = await db`
      SELECT COUNT(*) as total 
      FROM blog_posts 
      ${db(whereClause)}
    `

    // Get paginated posts
    const posts = await db`
      SELECT * 
      FROM blog_posts 
      ${db(whereClause)}
      ORDER BY created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `

    return NextResponse.json({
      posts,
      pagination: {
        total: parseInt(total),
        page,
        limit,
        totalPages: Math.ceil(parseInt(total) / limit)
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

// PUT - Update a blog post
export async function PUT(request: Request) {
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

    const body = await request.json()

    // Update post
    const [post] = await db`
      UPDATE blog_posts
      SET ${db(body, [
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
      WHERE id = ${parseInt(id)}
      RETURNING *
    `

    if (!post) {
      return new NextResponse('Post not found', { status: 404 })
    }

    return NextResponse.json({ post })
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