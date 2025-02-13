import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/app/lib/validations/blog';

interface BlogPostViewProps {
  post: BlogPost;
  isPreview?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export function BlogPostView({ 
  post, 
  isPreview = false,
  backUrl = '/blog',
  backLabel = 'Back to Blog'
}: BlogPostViewProps) {
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
      {isPreview && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 sticky top-0 z-50 mb-8">
          <p className="text-yellow-700">Preview Mode</p>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="flex justify-end mb-8">
            <Link href={backUrl}>
              <Button variant="ghost" className="-mr-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
              </Button>
            </Link>
          </div>

          {/* Main Image */}
          {post.main_image && (
            <div className="relative h-[400px] mb-8 rounded-lg overflow-hidden">
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
              [&_a:hover]:text-blue-800 dark:[&_a:hover]:text-blue-300

              [&_table]:w-full
              [&_table]:my-8
              [&_table]:border-collapse
              [&_table]:border
              [&_table]:border-zinc-300
              dark:[&_table]:border-zinc-700

              [&_thead]:bg-zinc-100
              dark:[&_thead]:bg-zinc-800
              [&_thead_tr]:border-b
              [&_thead_tr]:border-zinc-300
              dark:[&_thead_tr]:border-zinc-700

              [&_th]:p-3
              [&_th]:text-left
              [&_th]:font-semibold
              [&_th]:text-zinc-900
              dark:[&_th]:text-zinc-100

              [&_tbody_tr]:border-b
              [&_tbody_tr]:border-zinc-200
              dark:[&_tbody_tr]:border-zinc-800
              [&_tbody_tr]:transition-colors
              [&_tbody_tr:hover]:bg-zinc-50
              dark:[&_tbody_tr:hover]:bg-zinc-800/50

              [&_td]:p-3
              [&_td]:text-zinc-700
              dark:[&_td]:text-zinc-300

              [&_caption]:mt-4
              [&_caption]:text-sm
              [&_caption]:text-zinc-500
              dark:[&_caption]:text-zinc-400
              [&_caption]:text-center
              [&_caption]:italic"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>
    </article>
  );
} 