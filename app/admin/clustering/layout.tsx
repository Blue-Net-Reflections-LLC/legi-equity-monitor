'use client'

import { ClusterProvider } from './context/ClusterContext'

export default function ClusteringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClusterProvider>
      {children}
    </ClusterProvider>
  )
} 