'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/app/lib/validations/blog';
import { Toaster } from 'sonner';
import { Recommendations } from '@/components/recommendations';
import { ShareButtons } from '@/app/components/ShareButtons';
import AdUnit from '@/app/components/ads/AdUnit';
import LocationAutocomplete from '@/app/components/address/LocationAutocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Bill } from '@/app/types';
import { BlogRelatedBills } from './BlogRelatedBills';

interface RelatedBill extends Bill {
  overall_bias_score: number | null;
  overall_positive_impact_score: number | null;
  membership_confidence: number;
}

interface BlogPostViewProps {
  post: BlogPost;
  relatedBills?: RelatedBill[];
  isPreview?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export function BlogPostView({ 
  post, 
  relatedBills = [],
  isPreview = false,
  backUrl = '/blog',
  backLabel = 'Back to Blog'
}: BlogPostViewProps) {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`;
  
  return (
    <article className="text-neutral-900 dark:text-neutral-50 -mt-8">
      <Toaster />
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
                <div className="flex flex-col gap-4">
                  <div className="flex items-center text-white/80">
                    <span>{post.author}</span>
                    {post.published_at && (
                      <>
                        <span className="mx-2">•</span>
                        <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
                      </>
                    )}
                  </div>
                  <ShareButtons url={shareUrl} title={post.title} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <div className="flex flex-col gap-4">
              <div className="flex items-center text-muted-foreground">
                <span>{post.author}</span>
                {post.published_at && (
                  <>
                    <span className="mx-2">•</span>
                    <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
                  </>
                )}
              </div>
              <ShareButtons url={shareUrl} title={post.title} />
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

          {/* Content with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8">
            {/* Main Content */}
            <section>
              <div 
                className="prose dark:prose-invert max-w-none [&>p]:mb-6 
                  [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 
                  [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6
                  [&>ul>li]:mb-2 [&>ol>li]:mb-2
                  [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline 
                  [&_a:hover]:text-blue-800 dark:[&_a:hover]:text-blue-300

                  [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mb-6 [&>h2]:mt-12
                  [&>h2]:bg-gradient-to-r [&>h2]:from-neutral-900 [&>h2]:to-neutral-600
                  dark:[&>h2]:from-white dark:[&>h2]:to-neutral-400
                  [&>h2]:bg-clip-text [&>h2]:text-transparent
                  [&>h2]:pb-2 [&>h2]:border-b [&>h2]:border-neutral-200 dark:[&>h2]:border-neutral-800

                  [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mb-4 [&>h3]:mt-8
                  [&>h3]:text-neutral-800 dark:[&>h3]:text-neutral-200
                  [&>h3]:flex [&>h3]:items-center [&>h3]:gap-2
                  [&>h3]:before:content-[''] [&>h3]:before:w-2 [&>h3]:before:h-2
                  [&>h3]:before:rounded-full [&>h3]:before:bg-primary

                  [&>h4]:text-xl [&>h4]:font-medium [&>h4]:mb-4 [&>h4]:mt-6
                  [&>h4]:text-neutral-700 dark:[&>h4]:text-neutral-300
                  [&>h4]:pl-4 [&>h4]:border-l-4 [&>h4]:border-primary/60

                  [&>h5]:text-lg [&>h5]:font-medium [&>h5]:mb-3 [&>h5]:mt-4
                  [&>h5]:text-neutral-600 dark:[&>h5]:text-neutral-400
                  [&>h5]:uppercase [&>h5]:tracking-wide

                  [&>h6]:text-base [&>h6]:font-medium [&>h6]:mb-3 [&>h6]:mt-4
                  [&>h6]:text-neutral-500 dark:[&>h6]:text-neutral-500
                  [&>h6]:italic

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
              {/* Related Bills */}
              {!isPreview && relatedBills.length > 0 && (
                <div className="mt-8">
                  <BlogRelatedBills bills={relatedBills} />
                </div>
              )}
            </section>
            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="lg:sticky lg:top-8">
                {/* Find Representatives Form */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">Who Represents You?</CardTitle>
                    <p className="text-sm text-muted-foreground">Discover your Congressional & State representatives</p>
                  </CardHeader>
                  <CardContent>
                    <LocationAutocomplete 
                      formAction="/api/representatives/submit"
                      fullWidth={true}
                      showLabel={false}
                    />
                  </CardContent>
                </Card>

                <AdUnit
                  slot="3689574391"
                  className="h-full"
                />
              </div>
            </aside>
          </div>

          {/* Recommendations */}
          <div className="my-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <Recommendations
              keyphrases={[
                ...(post.metadata?.keywords || [])
              ].filter(Boolean)}
              limit={8}
              exclude={[{ entity_type: 'blog_post', entity_id: post.post_id! }]}
              title="Related Articles"
              description="You might also be interested in these articles"
              orientation="horizontal"
              itemsPerView={4}
              loadOnView
              entityType="blog_post"
            />
          </div>
        </div>
      </div>
    </article>
  );
} 