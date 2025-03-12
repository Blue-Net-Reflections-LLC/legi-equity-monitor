/**
 * Utility functions for managing SEO-friendly URL slugs
 */

/**
 * Generates a slug from any text
 * @param text Text to slugify
 * @returns Slugified string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .slice(0, 100);           // Limit length
}

/**
 * Generates a bill slug from bill number and title
 * @param billNumber Bill number (e.g. "HB123")
 * @param title Bill title
 * @returns Slugified string for bill URL
 */
export function generateBillSlug(billNumber: string, title: string): string {
  // Use bill number and title to create a slug
  const baseText = title && title.trim() !== '' ? `${billNumber}-${title}` : billNumber;
  return generateSlug(baseText);
}

/**
 * Generates a sponsor slug from sponsor name
 * @param name Sponsor name
 * @returns Slugified string for sponsor URL
 */
export function generateSponsorSlug(name: string, party?: string): string {
  // Use only the name to create a slug (party is ignored)
  return generateSlug(name);
}

/**
 * Checks if the current slug matches the expected slug
 * @param currentSlug Current slug from URL (may be undefined)
 * @param expectedSlug Expected canonical slug
 * @returns Boolean indicating if slug is valid
 */
export function isValidSlug(currentSlug: string | undefined, expectedSlug: string): boolean {
  if (!currentSlug) return false;
  return currentSlug === expectedSlug;
}

/**
 * Formats the canonical URL for a bill page
 * @param stateCode State code (e.g. "CA")
 * @param billId Bill ID
 * @param slug SEO-friendly slug
 * @param baseUrl Base URL of the site (optional)
 * @returns Full canonical URL
 */
export function formatBillUrl(stateCode: string, billId: string, slug: string, baseUrl: string = 'https://legiequity.us'): string {
  return `${baseUrl}/${stateCode.toLowerCase()}/bill/${billId}/${slug}`;
}

/**
 * Formats the canonical URL for a sponsor page
 * @param sponsorId Sponsor ID
 * @param slug SEO-friendly slug
 * @param baseUrl Base URL of the site (optional)
 * @returns Full canonical URL
 */
export function formatSponsorUrl(sponsorId: string, slug: string, baseUrl: string = 'https://legiequity.us'): string {
  return `${baseUrl}/sponsor/${sponsorId}/${slug}`;
}

/**
 * Formats a relative URL path for a bill page
 * @param stateCode State code (e.g. "CA")
 * @param billId Bill ID
 * @param billNumber Bill number (e.g. "HB123")
 * @param title Bill title
 * @returns Relative URL path for bill
 */
export function getBillPath(stateCode: string, billId: string, billNumber: string, title: string): string {
  const slug = generateBillSlug(billNumber, title);
  return `/${stateCode.toLowerCase()}/bill/${billId}/${slug}`;
}

/**
 * Formats a relative URL path for a sponsor page
 * @param sponsorId Sponsor ID
 * @param name Sponsor name
 * @param party Sponsor party affiliation (not used in slug, but kept for API compatibility)
 * @returns Relative URL path for sponsor
 */
export function getSponsorPath(sponsorId: string, name: string, party: string): string {
  const slug = generateSponsorSlug(name);
  return `/sponsor/${sponsorId}/${slug}`;
} 