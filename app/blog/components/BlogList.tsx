'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published_at: string;
  author: string;
  thumb: string | null;
  is_curated: boolean;
  main_image?: string;
}

// Helper function to remove HTML tags
function scrubTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function BlogCard({ post, className = '' }: { post: BlogPost; className?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`group block text-neutral-900 dark:text-neutral-50 ${className}`}>
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
      <div className="text-sm text-muted-foreground">
        {post.published_at && (
          <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
        )}
      </div>
    </Link>
  );
}

function FeaturedBlogCard({ post }: { post: BlogPost }) {
  if (!post) return null;
  
  return (
    <Link href={`/blog/${post.slug}`} className="group block text-center text-neutral-900 dark:text-neutral-50">
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
      <h2 className="text-4xl md:text-5xl font-bold mb-3 group-hover:text-primary transition-colors">
        {post.title}
      </h2>
      <p className="text-xl text-muted-foreground line-clamp-3 mb-4 max-w-xl mx-auto">
        {scrubTags(post.excerpt)}
      </p>
      <div className="text-sm text-muted-foreground">
        {post.published_at && (
          <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
        )}
      </div>
    </Link>
  );
}

export function BlogList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialPage = parseInt(searchParams.get('page') || '1');
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPosts, setTotalPosts] = useState(0);
  
  const postsPerPage = currentPage === 1 ? 21 : 20;

  // Reset to page 1 when navigating directly to /blog
  useEffect(() => {
    if (pathname === '/blog' && !searchParams.get('page')) {
      setCurrentPage(1);
    }
  }, [pathname, searchParams]);

  const handlePageChange = (newPage: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(newPage);
  };

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/posts?page=${currentPage}&limit=${postsPerPage}`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        setPosts(data.data || []);
        setTotalPosts(data.total || 0);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [currentPage, postsPerPage]);

  // Update URL when page changes
  useEffect(() => {
    const newUrl = currentPage === 1 
      ? '/blog' 
      : `/blog?page=${currentPage}`;
    router.push(newUrl, { scroll: false });
  }, [currentPage, router]);

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

  const totalPages = Math.ceil((totalPosts - 1) / 20);

  // First page with featured layout (21 posts)
  if (currentPage === 1) {
    const [featured, second, third, fourth, fifth, ...rest] = posts;

    return (
      <div className="max-w-[1920px] mx-auto space-y-12">
        {/* Featured Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
          {/* Left Column */}
          <div className="space-y-8 order-2 md:order-1">
            {second && <BlogCard post={second} />}
            {third && <BlogCard post={third} />}
          </div>

          {/* Center Column - Featured Post */}
          <div className="md:col-span-2 order-1 md:order-2">
            {featured && <FeaturedBlogCard post={featured} />}
          </div>

          {/* Right Column */}
          <div className="space-y-8 order-3">
            {fourth && <BlogCard post={fourth} />}
            {fifth && <BlogCard post={fifth} />}
          </div>
        </div>

        {/* Remaining Posts Grid */}
        {rest.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {rest.map((post: BlogPost) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center pt-8 border-t border-border">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  // Subsequent pages with grid-only layout (20 posts)
  return (
    <div className="max-w-[1920px] mx-auto space-y-12">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {posts.map((post: BlogPost) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-8 border-t border-border">
        <Button
          variant="outline"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
} 