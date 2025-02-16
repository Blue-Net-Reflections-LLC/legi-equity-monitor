'use client';

import { BlogPostView } from '@/app/blog/components/BlogPostView';
import { BlogPost } from '@/app/lib/validations/blog';
import { useEffect, useState } from 'react';

export default function PreviewPage() {
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    // Get preview data from localStorage
    const previewData = localStorage.getItem('blog-preview');
    if (previewData) {
      setPost(JSON.parse(previewData));
    }
    localStorage.removeItem('blog-preview');
  }, []);

  if (!post) {
    return <div>Loading preview...</div>;
  }

  return (
    <BlogPostView 
      post={post}
      isPreview={true}
      backUrl="/admin/blog"
      backLabel="Back to Blog Admin"
    />
  );
} 