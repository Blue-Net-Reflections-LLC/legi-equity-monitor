'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogPost {
  title: string;
  content: string;
  published_at: string;
  author: string;
  hero_image: string | null;
  main_image: string | null;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, []);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/${params.slug}`);
      if (!response.ok) {
        throw new Error('Post not found');
      }
      const data = await response.json();
      setPost(data.post);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error || 'Post not found'}</p>
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Hero Image */}
        {post.hero_image && (
          <div className="relative h-[400px] mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.hero_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Title and Meta */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center text-muted-foreground">
            <span>{post.author}</span>
            <span className="mx-2">•</span>
            <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
          </div>
        </header>

        {/* Main Image */}
        {post.main_image && (
          <div className="relative h-[300px] mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.main_image}
              alt="Main image"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  );
} 