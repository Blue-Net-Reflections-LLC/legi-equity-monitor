'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { BlogPostForm } from '../components/BlogPostForm';
import type { BlogPost } from '@/app/lib/validations/blog';

export default function EditBlogPost({ params }: { params: { postId: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/admin/api/blog/post/${params.postId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        setPost(data.post);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [params.postId]);

  const handleSubmit = async (data: BlogPost) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/admin/api/blog/post/${params.postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update blog post');
      }

      if (data.status === 'published') {
        toast.success('Blog post updated and published');
        router.push('/admin/blog');
      } else {
        toast.success('Blog post updated successfully');
        router.push('/admin/blog');
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update blog post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p>Post not found</p>
      </div>
    );
  }

  return (
    <BlogPostForm 
      initialData={post}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
} 