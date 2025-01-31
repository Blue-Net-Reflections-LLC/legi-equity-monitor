'use client'

declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      data?: { [key: string]: any }
    ) => void
    dataLayer: IArguments[]
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Initialize gtag
export const initializeGtag = () => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtag
    window.gtag('js', new Date().toISOString())
    window.gtag('config', GA_MEASUREMENT_ID!, {
      page_path: window.location.pathname,
    })
  }
}

// Safe gtag call
export const safeGtag = (
  type: string,
  action: string,
  data?: { [key: string]: any }
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(type, action, data)
  } else {
    console.warn('GTM not initialized')
  }
} 