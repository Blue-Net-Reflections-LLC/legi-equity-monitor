import type { Metadata } from 'next';

// Define the base URL for the entire application
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legiequity.us';

/**
 * Generates metadata for a page, including canonical URL
 * 
 * @param title - The page title
 * @param description - The page description
 * @param path - The path for the canonical URL (excluding domain)
 * @param additionalMetadata - Any additional metadata properties
 * @returns Metadata object with canonical URL
 */
export function generateMetadata(
  title: string,
  description: string,
  path: string,
  additionalMetadata: Partial<Metadata> = {}
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    // Allow overriding or extending the metadata
    ...additionalMetadata,
  };
} 