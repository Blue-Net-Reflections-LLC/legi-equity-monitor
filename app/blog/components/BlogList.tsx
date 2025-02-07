'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  author: string;
  thumb: string | null;
  is_curated: boolean;
}

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/blog/posts?page=${page}&size=9`);
      const data = await response.json();
      
      if (page === 1) {
        setPosts(data.data);
      } else {
        setPosts(prev => [...prev, ...data.data]);
      }
      
      setHasMore(data.data.length === 9);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
              {post.thumb && (
                <div className="relative h-48 w-full">
                  <Image
                    src={post.thumb}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                  {post.is_curated && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    </div>
                  )}
                </div>
              )}
              <CardHeader>
                <h2 className="text-xl font-semibold line-clamp-2">{post.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <div className="flex justify-between items-center w-full">
                  <span>{post.author}</span>
                  <time>{format(new Date(post.published_at), 'MMM d, yyyy')}</time>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
} 