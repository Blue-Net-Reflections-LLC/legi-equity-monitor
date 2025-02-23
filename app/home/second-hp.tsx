import { AuroraBackground } from "@/app/components/ui/aurora-background";
import AnimatedContent from "../components/AnimatedContent";
import AnimatedStatesMap from "../components/AnimatedStatesMap";
import Link from "next/link";
import { Footer } from "@/app/components/layout/Footer";
import { ArrowUpRight, Compass, TrendingUp } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { VideoSection } from "../components/VideoSection";
import { getYouTubeVideos } from "../lib/youtube";

// Helper function to remove HTML tags
function scrubTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  author: string;
  main_image: string | null;
}

async function getRecentBlogPosts(): Promise<BlogPost[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/posts?page=1&limit=4`, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error('Failed to fetch blog posts');
  const data = await response.json();
  return data.data;
}

export default async function SecondHomepage() {
  const [blogPosts, videos] = await Promise.all([
    getRecentBlogPosts(),
    getYouTubeVideos(4)
  ]);
  
  const [featuredPost, ...recentPosts] = blogPosts;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section with Split Layout */}
      <section className="min-h-[calc(75vh-4rem)]">
        <AuroraBackground>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center min-h-[calc(75vh-8rem)] relative">
              {/* Centered Floating Compass Guide - Non-blocking */}
              <div className="hidden md:block pointer-events-none absolute left-[40%] top-[35%] -translate-x-1/2 -translate-y-1/2 z-30 animate-float-y">
                <div className="relative flex flex-col items-center gap-3">
                  {/* Main Compass Container */}
                  <div className="relative">
                    {/* Rotating Outer Ring */}
                    <div className="absolute -inset-1 rounded-full border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/30 animate-spin-slow"></div>
                    
                    <div className="relative z-10 bg-zinc-900/10 dark:bg-white/10 backdrop-blur-lg rounded-full p-6 border border-zinc-900/20 dark:border-white/20 shadow-xl">
                      <div className="relative">
                        {/* Center Icon */}
                        <Compass className="w-8 h-8 text-emerald-600 dark:text-emerald-500 animate-pulse" />
                        
                        {/* Orbiting Dots */}
                        <div className="absolute inset-0 animate-spin-reverse">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Bubble with Link */}
                  <div className="pointer-events-auto bg-zinc-900/10 dark:bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-zinc-900/20 dark:border-white/20">
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-zinc-900 dark:text-white text-sm font-medium text-center">
                        Click any state on the map
                      </p>
                      <Link
                        href="/states"
                        className="group inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                      >
                        or browse all states
                        <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Column - Text Content */}
              <AnimatedContent>
                <div className="relative z-10 flex items-center h-full">
                  {/* Glow Effect */}
                  <div className="absolute -inset-px transition duration-500"></div>
                  
                  <div className="relative z-20">
                    <div className="space-y-6 max-w-[75%]">
                      <p className="text-2xl md:text-4xl text-zinc-700 dark:text-neutral-200 font-semibold">
                        AI-powered analysis of legislation&apos;s impact on demographic equity
                      </p>
                      <p className="text-lg text-zinc-600 dark:text-neutral-300">
                        Understand how bills and laws affect communities across age, disability, gender, race, and religion
                      </p>
                      {/* Mobile CTA */}
                      <div className="md:hidden">
                        <Link 
                          href="/states"
                          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg 
                                   shadow-lg hover:shadow-xl transition-all duration-200 
                                   text-xl font-semibold"
                        >
                          Select Your State
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedContent>

              {/* Right Column - Interactive Map (Desktop Only) */}
              <div className="hidden md:block relative h-[450px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatedStatesMap />
                </div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </section>

      {/* Blog Section */}
      <section className="relative py-12 px-4 bg-white dark:bg-zinc-900">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded bg-blue-500/10 px-6 py-3 text-lg font-semibold text-blue-500 dark:text-blue-400 mb-8 uppercase tracking-wide">
            <TrendingUp className="w-5 h-5" />
            Latest Legislative Trends
          </div>
          <div className="grid grid-cols-4 gap-6">
            {/* Featured Post - Split Layout */}
            {featuredPost && (
              <div className="col-span-3 group grid md:grid-cols-2 gap-6 overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex flex-col justify-center p-8">
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors mb-3">
                      {featuredPost.title}
                    </h2>
                  </Link>
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-4">
                    {format(new Date(featuredPost.published_at), 'MMMM d, yyyy')} • {Math.ceil(featuredPost.excerpt.length / 1000)} MIN READ
                  </div>
                  <p className="text-lg text-zinc-600 dark:text-zinc-300 line-clamp-3">
                    {scrubTags(featuredPost.excerpt)}
                  </p>
                </div>
                <Link 
                  href={`/blog/${featuredPost.slug}`}
                  className="relative h-full min-h-[300px] md:min-h-full overflow-hidden"
                >
                  {featuredPost.main_image ? (
                    <Image
                      src={featuredPost.main_image}
                      alt={featuredPost.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700" />
                  )}
                </Link>
              </div>
            )}

            {/* Empty Column for Ads */}
            <div className="col-span-1">
              {/* Ad space */}
            </div>

            {/* Recent Posts - Under the Featured Post */}
            <div className="col-span-3 grid grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <article key={post.slug} className="group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="aspect-[16/9] relative overflow-hidden mb-4">
                      {post.main_image ? (
                        <Image
                          src={post.main_image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors mb-2">
                      {post.title}
                    </h3>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      {format(new Date(post.published_at), 'MMMM d, yyyy')}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <VideoSection videos={videos} />

      <Footer />
    </div>
  );
} 