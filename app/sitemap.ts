import { STATES } from './constants/states';
import db from '@/lib/db';

// Define the base URL for consistent usage
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legiequity.us';

async function getPublishedBlogPosts() {
  const posts = await db`
    SELECT slug, updated_at
    FROM blog_posts
    WHERE status = 'published'
    AND published_at <= NOW()
    ORDER BY published_at DESC
  `;
  
  return posts.map(post => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}

export default async function sitemap() {
  const stateEntries = STATES.map(state => ({
    url: `${BASE_URL}/${state.code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const otherPages = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
  ];

  // Fetch published blog posts
  const blogPosts = await getPublishedBlogPosts();

  return [
    ...otherPages,
    ...stateEntries,
    ...blogPosts,
  ];
} 