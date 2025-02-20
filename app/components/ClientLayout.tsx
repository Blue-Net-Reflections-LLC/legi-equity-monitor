'use client'

import { useEffect } from 'react'
import { embeddingService } from '@/app/services/embedding.service'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize embedding service once at the app level
  useEffect(() => {
    console.log('[ClientLayout] Initializing embedding service...')
    embeddingService.load().catch(error => {
      console.error('[ClientLayout] Failed to initialize embedding service:', error)
    })

    // Cleanup when the app unmounts
    return () => {
      // Only dispose in production
      if (process.env.NODE_ENV !== 'development') {
        embeddingService.dispose()
      }
    }
  }, [])

  return <>{children}</>
} 