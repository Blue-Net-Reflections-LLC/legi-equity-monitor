'use client'

import { useAnalytics } from '@/app/hooks/useAnalytics'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Initialize analytics hook
  useAnalytics()
  
  return <>{children}</>
} 