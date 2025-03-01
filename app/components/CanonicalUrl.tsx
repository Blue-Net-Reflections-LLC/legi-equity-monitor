'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getCanonicalUrl } from '../utils/canonical-url';

/**
 * Component to add a canonical URL to the page head
 * This is necessary for pages that need dynamic canonical URLs
 * For static routes, prefer using the Metadata API alternates.canonical
 */
export default function CanonicalUrl() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Function to safely handle DOM operations
    const updateCanonicalLink = () => {
      try {
        // Check if head exists (it might not during SSR or fast navigation)
        const head = document.head;
        if (!head) return;
        
        // Find existing canonical link - use querySelector to be safe
        const existingCanonical = head.querySelector('link[rel="canonical"]');
        
        // If it exists, update the href instead of removing and re-creating
        if (existingCanonical) {
          existingCanonical.setAttribute('href', getCanonicalUrl(pathname));
        } else {
          // Only create a new element if it doesn't exist
          const link = document.createElement('link');
          link.rel = 'canonical';
          link.href = getCanonicalUrl(pathname);
          head.appendChild(link);
        }
      } catch (error) {
        console.error('Error updating canonical link:', error);
      }
    };
    
    // Update the canonical link
    updateCanonicalLink();
    
    // No need for cleanup - we're updating the href instead of removing elements
  }, [pathname]);
  
  // This component doesn't render anything visible
  return null;
} 