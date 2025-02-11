import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from "@/app/(auth)/auth";
import { ADMIN_ROLES } from "@/app/constants/user-roles";
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const isEditor = (session: any) => {
  return session?.user?.role && ADMIN_ROLES.includes(session.user.role);
};

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
  searchParams: {
    preview?: string;
  };
}

export async function generateMetadata({ params, searchParams }: BlogPostPageProps): Promise<Metadata> {
  try {
    let post;
    if (searchParams.preview) {
      const session = await auth();
      if (session && isEditor(session)) {
        const previewData = JSON.parse(Buffer.from(searchParams.preview, 'base64').toString());
        post = previewData;
      }
    }
    
    if (!post) {
      post = await getBlogPost(params.slug);
    }

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
    return { title: 'Blog Post' };
  }
}

export default async function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  try {
    let post;
    
    // Check for preview mode
    if (searchParams.preview) {
      const session = await auth();
      if (session && isEditor(session)) {
        try {
          const previewData = JSON.parse(Buffer.from(searchParams.preview, 'base64').toString());
          post = previewData;
        } catch (error) {
          console.error('Failed to parse preview data:', error);
        }
      }
    }
    
    // If not in preview mode or preview failed, get the actual post
    if (!post) {
      post = await getBlogPost(params.slug);
    }

    if (!post) {
      notFound();
    }

    return (
      <article className="text-neutral-900 dark:text-neutral-50 -mt-8">
        {/* Hero Image */}
        {post.hero_image ? (
          <div className="relative h-[80vh] w-full mb-8">
            <Image
              src={post.hero_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60">
              <div className="container mx-auto px-4 h-full flex items-end pb-12">
                <div className="max-w-4xl mx-auto w-full">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{post.title}</h1>
                  <div className="flex items-center text-white/80">
                    <span>{post.author}</span>
                    {post.published_at && (
                      <>
                        <span className="mx-2">•</span>
                        <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
              <div className="flex items-center text-muted-foreground">
                <span>{post.author}</span>
                {post.published_at && (
                  <>
                    <span className="mx-2">•</span>
                    <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Banner */}
        {searchParams.preview && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8 -mt-8">
            <p className="text-yellow-700">Preview Mode</p>
          </div>
        )}

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link href="/blog">
              <Button variant="ghost" className="mb-8 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>

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
              className="prose dark:prose-invert max-w-none [&>p]:mb-6 
                [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 
                [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6
                [&>ul>li]:mb-2 [&>ol>li]:mb-2
                [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline 
                [&_a:hover]:text-blue-800 dark:[&_a:hover]:text-blue-300"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>
    );
  } catch (error) {
    console.error('Error rendering blog post:', error);
    notFound();
  }
} 