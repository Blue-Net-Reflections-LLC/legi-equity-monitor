/**
 * Generates a canonical URL for the current page
 * This ensures search engines only index the primary domain (legiequity.us)
 * 
 * @param path - The path of the current page (excluding domain)
 * @returns The full canonical URL
 */
export function getCanonicalUrl(path: string = ''): string {
  // Base URL from environment variable with fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://legiequity.us';
  
  // Clean the path to ensure it starts with a slash if not empty
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  
  // Return the full canonical URL
  return `${baseUrl}${cleanPath}`;
} 