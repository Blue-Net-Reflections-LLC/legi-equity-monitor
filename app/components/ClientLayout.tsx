'use client'

import { useEffect } from 'react'
import { embeddingService } from '../services/embedding.service'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Prefetch the model when the app loads
    embeddingService.load().catch(console.error)

    // Cleanup when the app unmounts
    return () => {
      embeddingService.dispose()
    }
  }, [])

  return <>{children}</>
} 