import { MetadataRoute } from 'next';

// Get the app URL from environment variables with fallback
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legiequity.us';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/(auth)/',
        '/workers/',
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
} 