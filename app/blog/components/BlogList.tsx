'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  author: string;
  thumb: string | null;
  is_curated: boolean;
  main_image?: string;
}

function BlogCard({ post, className = '' }: { post: BlogPost; className?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`group block ${className}`}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-4">
        {post.main_image ? (
          <Image
            src={post.main_image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>
      <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {post.title}
      </h2>
      <div className="flex items-center text-sm text-muted-foreground">
        <span>{post.author}</span>
        {post.published_at && (
          <>
            <span className="mx-2">•</span>
            <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
          </>
        )}
      </div>
    </Link>
  );
}

function FeaturedBlogCard({ post }: { post: BlogPost }) {
  if (!post) return null;
  
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-6">
        {post.main_image ? (
          <Image
            src={post.main_image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>
      <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
        {post.title}
      </h2>
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <span>{post.author}</span>
        {post.published_at && (
          <>
            <span className="mx-2">•</span>
            <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
          </>
        )}
      </div>
      <Button variant="ghost" className="group/button">
        Read More
        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/button:translate-x-1" />
      </Button>
    </Link>
  );
}

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/posts`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        console.log('API Response:', data);
        setPosts(data.data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No blog posts found.</p>
      </div>
    );
  }

  // If we have only one post, display it as featured
  if (posts.length === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <FeaturedBlogCard post={posts[0]} />
      </div>
    );
  }

  // If we have 2-5 posts, adapt the grid layout
  if (posts.length <= 5) {
    const [featured, ...otherPosts] = posts;
    
    return (
      <div className="space-y-12">
        {/* Featured Post */}
        <div className="max-w-2xl mx-auto mb-12">
          <FeaturedBlogCard post={featured} />
        </div>

        {/* Other Posts Grid */}
        <div className={`grid ${
          otherPosts.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
          otherPosts.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' :
          otherPosts.length >= 3 ? 'md:grid-cols-3' : ''
        } gap-8`}>
          {otherPosts.map((post: BlogPost) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    );
  }

  // If we have 6 or more posts, use the full layout
  const [featured, second, third, fourth, fifth, ...rest] = posts;

  return (
    <div className="space-y-12">
      {/* Featured Grid Layout */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {second && <BlogCard post={second} />}
          {third && <BlogCard post={third} />}
        </div>

        {/* Center Column - Featured Post */}
        <div className="col-span-1">
          {featured && <FeaturedBlogCard post={featured} />}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {fourth && <BlogCard post={fourth} />}
          {fifth && <BlogCard post={fifth} />}
        </div>
      </div>

      {/* Remaining Posts Grid */}
      {rest.length > 0 && (
        <>
          <div className="border-t border-border pt-12">
            <h2 className="text-2xl font-bold mb-8">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((post: BlogPost) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 