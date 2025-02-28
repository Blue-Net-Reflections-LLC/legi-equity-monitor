'use client';

import { AuroraBackground } from "@/app/components/ui/aurora-background";
import AnimatedContent from "../components/AnimatedContent";
import Link from "next/link";
import { Footer } from "@/app/components/layout/Footer";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import AdUnit from '../components/ads/AdUnit';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import LocationAutocomplete from '../components/address/LocationAutocomplete';

// Dynamically import components with CSR
const AnimatedStatesMap = dynamic(
  () => import("../components/AnimatedStatesMap"),
  { ssr: false }
);

const AnimatedCompass = dynamic(
  () => import("../components/AnimatedCompass"),
  { ssr: false }
);

const VideoSection = dynamic(
  () => import("../components/VideoSection").then(mod => mod.VideoSection),
  { 
    ssr: false,
    loading: () => <VideoLoadingState />
  }
);

const RecentImpactfulBills = dynamic(
  () => import("../components/RecentImpactfulBills"),
  { ssr: false }
);

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

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  duration: string;
}

interface SecondHomepageProps {
  blogPosts: BlogPost[];
  videos: YouTubeVideo[];
}

// Loading component for the map
function MapLoadingState() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading interactive map...</p>
      </div>
    </div>
  );
}

// Loading component for the compass
function CompassLoadingState() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

// Loading component for the video section
function VideoLoadingState() {
  return (
    <section className="relative py-12 px-4 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading video content...</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SecondHomepageClient({ blogPosts, videos }: SecondHomepageProps) {
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
                <Suspense fallback={<CompassLoadingState />}>
                  <AnimatedCompass />
                </Suspense>
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
                  <Suspense fallback={<MapLoadingState />}>
                    <AnimatedStatesMap />
                  </Suspense>
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
          
          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Featured Post - Split Layout */}
            {featuredPost && (
              <div className="col-span-1 md:col-span-3 group grid md:grid-cols-2 gap-6 overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
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

            {/* Right Rail - Stacks on Mobile */}
            <div className="col-span-1 order-3 md:order-2">
              {/* Find Representatives Form */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <LocationAutocomplete 
                    formAction="/api/representatives/submit"
                    fullWidth={true}
                  />
                </CardContent>
              </Card>
              <AdUnit
                slot="4008304448"
                className="h-full"
              />
              <div className="mt-6">
                <AdUnit
                  slot="1063173377"
                  className="min-h-[100px]"
                  format="fluid"
                  layoutKey="-6t+ed+2i-1n-4w"
                />
              </div>
            </div>

            {/* Recent Posts - Under the Featured Post, Full Width on Mobile */}
            <div className="col-span-1 md:col-span-3 order-2 md:order-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
        </div>
      </section>

      {/* Recent Impactful Bills Section */}
      <RecentImpactfulBills />

      {/* Video Section */}
      <VideoSection videos={videos} />

      <Footer />
    </div>
  );
} 