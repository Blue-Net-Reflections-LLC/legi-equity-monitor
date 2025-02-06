'use client'

import { ReactNode } from 'react'
import { AdminProvider } from './AdminContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  )
} 