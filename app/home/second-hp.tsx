import { getYouTubeVideos } from "../lib/youtube";
import { SecondHomepageClient } from "./SecondHomepageClient";

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  author: string;
  main_image: string | null;
}

// Server Component
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
  
  return <SecondHomepageClient blogPosts={blogPosts} videos={videos} />;
} 