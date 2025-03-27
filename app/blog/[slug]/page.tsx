import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostView } from '../components/BlogPostView';
import { generateMetadata as generatePageMetadata } from '@/app/utils/metadata-utils';
import { Bill } from '@/app/types';

interface RelatedBill extends Bill {
  overall_bias_score: number | null;
  overall_positive_impact_score: number | null;
  membership_confidence: number;
}

async function getBlogPost(slug: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/posts/${slug}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch blog post');
  }
  const data = await response.json();
  return data.post;
}

async function getRelatedBills(slug: string): Promise<RelatedBill[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/posts/${slug}/related-bills`);
  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch related bills');
  }
  const data = await response.json();
  return data.bills;
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

    const description = post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 200) || post.title;
    
    return generatePageMetadata(
      post.title,
      description,
      `/blog/${params.slug}`,
      {
        openGraph: {
          title: post.title,
          description: post.excerpt || post.title,
          images: post.main_image ? [{ url: post.main_image }] : [],
        },
      }
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return { title: 'Blog Post' };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, relatedBills] = await Promise.all([
    getBlogPost(params.slug),
    getRelatedBills(params.slug)
  ]);
  
  if (!post) {
    notFound();
  }

  return (
    <BlogPostView post={post} relatedBills={relatedBills} />
  );
} 