'use client'

import { ClusterList } from './components/ClusterList'
import { ClusterFilters } from './components/ClusterFilters'

export default function ClusteringPage() {
  return (
    <div className="h-full space-y-6 p-8 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clustering Analysis</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage and monitor bill clusters
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <ClusterFilters />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <ClusterList />
      </div>
    </div>
  )
} 