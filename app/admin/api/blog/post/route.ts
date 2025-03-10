import { auth } from '@/app/(auth)/auth'
import { ADMIN_ROLES } from '@/app/constants/user-roles'
import { createBlogPostSchema } from '@/app/lib/validations/blog'
import { uploadBlogImages } from '@/app/lib/cloudflare'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

// Define nullable columns
const NULLABLE_COLUMNS = [
  'published_at',
  'hero_image',
  'main_image',
  'thumb'
] as const

// POST - Create a new blog post
export async function POST(request: Request) {
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

    const body = await request.json()
    const validationResult = createBlogPostSchema.safeParse(body)
    
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

    // If status is published but no published_at date is set, use current timestamp
    if (validatedData.status === 'published' && !validatedData.published_at) {
      validatedData.published_at = new Date()
    }

    // Upload any generated images to Cloudflare
    const postDataWithCdnUrls = await uploadBlogImages(validatedData)

    // Handle nullable fields
    const insertData = {
      ...postDataWithCdnUrls,
      is_curated: postDataWithCdnUrls.is_curated ?? false,
      ...Object.fromEntries(
        NULLABLE_COLUMNS.map(col => [col, postDataWithCdnUrls[col] ?? null])
      )
    }
    
    // Insert new blog post
    const [post] = await db`
      INSERT INTO blog_posts ${db(insertData)}
      RETURNING *
    `

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    
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