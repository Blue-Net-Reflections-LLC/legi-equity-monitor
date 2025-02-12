import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostView } from '../components/BlogPostView';

async function getBlogPost(slug: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/posts/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch blog post');
  }
  const data = await response.json();
  return data.post;
}

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const post = await getBlogPost(params.slug);
    if (!post) return { title: 'Blog Post Not Found' };

    return {
      title: post.title,
      description: post.excerpt || post.title,
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        images: post.metadata?.hero_image ? [{ url: post.metadata.hero_image }] : [],
      },
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return { title: 'Blog Post' };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    notFound();
  }

  return (
    <BlogPostView post={post} />
  );
} 