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

  useEffect(() => {
    // Only initialize if not already done and element exists
    if (adRef.current && !isInitialized.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isInitialized.current = true;
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, []);

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