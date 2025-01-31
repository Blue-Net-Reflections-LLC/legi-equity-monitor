'use client'

import { useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { safeGtag, initializeGtag } from '@/app/utils/analytics'

declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      data?: { [key: string]: any }
    ) => void
  }
}

type TrackingAttributes = {
  'data-track-click'?: string;
  'data-track-inview'?: string;
  'data-track-event-category'?: string;
  'data-track-event-action'?: string;
  'data-track-event-label'?: string;
  'data-track-event-value'?: string;
  'data-track-custom-props'?: string;
}

export const useAnalytics = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize GA
  useEffect(() => {
    initializeGtag()
  }, [])

  // Track page views
  useEffect(() => {
    if (pathname) {
      safeGtag('event', 'page_view', {
        page_path: pathname,
        page_search: searchParams?.toString(),
        page_title: document.title
      })
    }
  }, [pathname, searchParams])

  // Core tracking function
  const trackEvent = useCallback((action: string, data?: { [key: string]: any }) => {
    try {
      safeGtag('event', action, {
        ...data,
        page_path: pathname,
        page_title: document.title
      })
    } catch (error) {
      console.error('Analytics Error:', error)
    }
  }, [pathname])

  // Extract tracking data from element
  const getTrackingData = (element: HTMLElement & Partial<TrackingAttributes>) => {
    const category = element.getAttribute('data-track-event-category')
    const action = element.getAttribute('data-track-event-action')
    const label = element.getAttribute('data-track-event-label')
    const value = element.getAttribute('data-track-event-value')
    const customPropsString = element.getAttribute('data-track-custom-props')
    const customProps = customPropsString ? JSON.parse(customPropsString) : {}

    return {
      event_category: category,
      event_action: action || 'click',
      event_label: label,
      event_value: value ? parseInt(value, 10) : undefined,
      element_type: element.tagName.toLowerCase(),
      element_id: element.id || undefined,
      element_class: element.className || undefined,
      ...customProps
    }
  }

  // Click tracking handler
  const handleClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    const trackElement = target.closest<HTMLElement>('[data-track-click]')
    
    if (trackElement) {
      const trackingData = getTrackingData(trackElement)
      trackEvent(trackingData.event_action, trackingData)
    }
  }, [trackEvent])

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const trackingData = getTrackingData(element)
            
            trackEvent(trackingData.event_action || 'impression', {
              ...trackingData,
              visibility_percent: Math.round(entry.intersectionRatio * 100)
            })

            // Only track once
            observer.unobserve(element)
          }
        })
      },
      { threshold: [0, 0.5, 1.0] } // Track at 0%, 50%, and 100% visibility
    )

    // Setup observers
    const setupObservers = () => {
      document.querySelectorAll<HTMLElement>('[data-track-inview]')
        .forEach(element => observer.observe(element))
    }

    // Initial setup
    setupObservers()

    // Setup click tracking
    document.addEventListener('click', handleClick)

    // Cleanup
    return () => {
      observer.disconnect()
      document.removeEventListener('click', handleClick)
    }
  }, [trackEvent, handleClick])

  return { trackEvent }
}

// Example usage in JSX:
/*
  // Click tracking
  <button 
    data-track-click
    data-track-event-category="Navigation"
    data-track-event-action="button_click"
    data-track-event-label="Submit Form"
    data-track-event-value="1"
    data-track-custom-props='{"button_type": "submit"}'
  >
    Click me
  </button>

  // Impression tracking
  <div 
    data-track-inview
    data-track-event-category="Content"
    data-track-event-action="section_view"
    data-track-event-label="Hero Section"
    data-track-custom-props='{"section_type": "hero"}'
  >
    Content
  </div>

  // Manual tracking
  const { trackEvent } = useAnalytics()
  trackEvent('custom_event', {
    event_category: 'User Action',
    event_label: 'Custom Interaction',
    custom_prop: 'value'
  })
*/ 