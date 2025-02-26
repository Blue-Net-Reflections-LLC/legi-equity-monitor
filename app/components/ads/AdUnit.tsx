'use client';

import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  className?: string;
  format?: string;
  layoutKey?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdUnit({ slot, className, format = 'auto', layoutKey }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);
  const adsEnabled = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED === 'true';

  useEffect(() => {
    // Only initialize if ads are enabled, not already done and element exists
    if (adsEnabled && adRef.current && !isInitialized.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isInitialized.current = true;
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [adsEnabled]);

  // Return null if ads are disabled
  if (!adsEnabled) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div 
          style={{
            display: 'block',
            border: '4px dashed #ccc',
            background: '#f0f0f0',
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            margin: '10px 0'
          }}
        >
          Ad Unit (Disabled via NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED)
        </div>
      );
    }
    return null;
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className || ''}`}
      style={{ 
        display: 'block',
        border: process.env.NODE_ENV === "development" ? "4px solid red" : "none",
        background: process.env.NODE_ENV === "development" ? "rgba(255, 0, 0, 0.1)" : "none",
      }}
      data-adtest="on"
      data-ad-client="ca-pub-1600412472864086"
      data-ad-slot={slot}
      data-ad-format={format}
      {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
      data-full-width-responsive="true"
    />
  );
} 