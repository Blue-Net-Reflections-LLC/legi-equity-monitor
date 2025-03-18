import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

// Get the app URL from environment variables with fallback
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legiequity.us';

// Check if we're in development or if this is the dev site
function isDevelopment() {
  // Check based on environment variable
  if (process.env.NODE_ENV === 'development') return true
  
  // Check based on hostname
  try {
    const headersList = headers();
    const host = headersList.get('host') || '';
    return host.includes('dev.legiequity') || host.includes('localhost') || host.includes('127.0.0.1');
  } catch (e) {
    return false;
  }
}

export default function robots(): MetadataRoute.Robots {
  // For development environments, block all indexing
  if (isDevelopment()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      host: APP_URL,
    };
  }
  
  // For production
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