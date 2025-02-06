'use client'

import { ReactNode } from 'react'
import { AdminProvider } from './AdminContext'
import { BlogProvider } from './BlogContext'
import { ClusterProvider } from './ClusterContext'
import { BillsProvider } from './BillsContext'
import { UsersProvider } from './UsersContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AdminProvider>
      <BlogProvider>
        <ClusterProvider>
          <BillsProvider>
            <UsersProvider>
              {children}
            </UsersProvider>
          </BillsProvider>
        </ClusterProvider>
      </BlogProvider>
    </AdminProvider>
  )
} 