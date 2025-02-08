import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import { partialUpdateBlogPostSchema } from '@/app/lib/validations/blog'
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
    const validationResult = partialUpdateBlogPostSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // If status is being changed to archived, set published_at to null
    if (validatedData.status === 'archived') {
      validatedData.published_at = null
    }

    // Update blog post
    const [post] = await db`
      UPDATE blog_posts 
      SET ${db(validatedData)},
      updated_at = CURRENT_TIMESTAMP
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