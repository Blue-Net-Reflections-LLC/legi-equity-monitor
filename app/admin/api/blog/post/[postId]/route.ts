import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import { updateBlogPostSchema } from '@/app/lib/validations/blog'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch a single blog post
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
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
    // Fetch blog post
    const [post] = await db`
      SELECT * FROM blog_posts 
      WHERE post_id = ${params.postId}::uuid
    `

    if (!post) {
      return new NextResponse('Not Found', { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PUT - Update a blog post
export async function PUT(
  request: Request,
  { params }: { params: { postId: string } }
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
    const body = await request.json()
    
    // Validate request body
    const validationResult = updateBlogPostSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    
    // Convert string date to Date object if needed
    if (validatedData.published_at && typeof validatedData.published_at === 'string') {
      validatedData.published_at = new Date(validatedData.published_at)
    }

    // Update blog post
    const [post] = await db`
      UPDATE blog_posts 
      SET 
        title = ${validatedData.title},
        content = ${validatedData.content},
        slug = ${validatedData.slug},
        status = ${validatedData.status},
        published_at = ${validatedData.published_at},
        author = ${validatedData.author},
        hero_image = ${validatedData.hero_image},
        main_image = ${validatedData.main_image},
        thumb = ${validatedData.thumb}
      WHERE post_id = ${params.postId}::uuid
      RETURNING *
    `

    if (!post) {
      return new NextResponse('Not Found', { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error updating blog post:', error)
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { errors: { slug: ['This slug is already in use'] } },
        { status: 400 }
      )
    }
    
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// DELETE - Delete a blog post
export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
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
    // Delete blog post
    const [post] = await db`
      DELETE FROM blog_posts 
      WHERE post_id = ${params.postId}::uuid
      RETURNING *
    `

    if (!post) {
      return new NextResponse('Not Found', { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 