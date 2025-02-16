import { STATES } from './constants/states';
import db from '@/lib/db';

async function getPublishedBlogPosts() {
  const posts = await db`
    SELECT slug, updated_at
    FROM blog_posts
    WHERE status = 'published'
    AND published_at <= NOW()
    ORDER BY published_at DESC
  `;
  
  return posts.map(post => ({
    url: `https://legiequity.us/blog/${post.slug}`,
    lastModified: post.updated_at,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}

export default async function sitemap() {
  const stateEntries = STATES.map(state => ({
    url: `https://legiequity.us/${state.code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const otherPages = [
    {
      url: 'https://legiequity.us',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://legiequity.us/search',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: 'https://legiequity.us/blog',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: 'https://legiequity.us/about',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: 'https://legiequity.us/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: 'https://legiequity.us/privacy',
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: 'https://legiequity.us/terms',
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