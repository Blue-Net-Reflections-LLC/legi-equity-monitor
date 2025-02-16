'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BlogPostForm } from '../components/BlogPostForm';
import type { BlogPost } from '@/app/lib/validations/blog';

export default function CreateBlogPost() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: BlogPost) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/admin/api/blog/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to create blog post');
      }

      if (data.status === 'published') {
        toast.success('Blog post published successfully');
        router.push('/admin/blog');
      } else {
        toast.success('Draft saved successfully');
        router.push('/admin/blog');
      }
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create blog post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BlogPostForm 
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
} 