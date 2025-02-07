import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateBlogPostSchema } from '@/app/lib/validations/blog';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const posts = await db`
      SELECT *
      FROM blog_posts
      WHERE post_id = ${params.postId}::uuid
      LIMIT 1
    `;

    if (!posts.length) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: posts[0] });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const json = await request.json();
    const validatedData = updateBlogPostSchema.parse(json);

    const posts = await db`
      UPDATE blog_posts
      SET
        title = ${validatedData.title},
        content = ${validatedData.content},
        slug = ${validatedData.slug},
        status = ${validatedData.status},
        author = ${validatedData.author},
        hero_image = ${validatedData.hero_image},
        main_image = ${validatedData.main_image},
        thumb = ${validatedData.thumb},
        published_at = ${validatedData.status === 'published' 
          ? validatedData.published_at || new Date() 
          : validatedData.published_at},
        updated_at = NOW()
      WHERE post_id = ${params.postId}::uuid
      RETURNING *
    `;

    if (!posts.length) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: posts[0] });
  } catch (error) {
    console.error('Error updating blog post:', error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
} 