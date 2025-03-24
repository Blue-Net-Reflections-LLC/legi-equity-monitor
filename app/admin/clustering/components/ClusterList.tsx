'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/lib/redux/hooks'
import { setPagination, fetchClusters } from '@/app/lib/redux/features/clustering/clusteringSlice'
import { LoadingState } from '@/app/admin/components/LoadingState'
import { StatusBadge } from './StatusBadge'
import { ClusterActions } from './ClusterActions'
import { type ClusterListItem } from '@/app/admin/clustering/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"

// Add sorting state type
type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

// Add sortable header component
function SortableHeader({ label, sortKey, sortConfig, onSort }: { 
  label: string; 
  sortKey: string; 
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}) {
  const isActive = sortConfig?.key === sortKey;
  return (
    <button 
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      {label}
      {isActive && (
        sortConfig?.direction === 'asc' ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function ClusterList() {
  const dispatch = useAppDispatch()
  const { items, pagination, filters } = useAppSelector(state => state.clustering)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'min_date',
    direction: 'desc'
  })

  const handleSort = (key: string) => {
    const newSortConfig = {
      key,
      direction: sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    } as const;
    
    setSortConfig(newSortConfig)
  };

  useEffect(() => {
    dispatch(fetchClusters({ 
      ...pagination, 
      filters,
      sorting: sortConfig
    }))
  }, [dispatch, pagination, filters, sortConfig])

  return (
    <div className="relative">
      <LoadingState feature="clusters" />
      
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_3fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <SortableHeader label="Cluster ID" sortKey="cluster_id" sortConfig={sortConfig} onSort={handleSort} />
        <SortableHeader label="Bills" sortKey="bill_count" sortConfig={sortConfig} onSort={handleSort} />
        <SortableHeader label="States" sortKey="state_count" sortConfig={sortConfig} onSort={handleSort} />
        <SortableHeader label="Summary" sortKey="executive_summary" sortConfig={sortConfig} onSort={handleSort} />
        <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
        <SortableHeader label="Date" sortKey="min_date" sortConfig={sortConfig} onSort={handleSort} />
        <div className="w-8"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {items.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No clusters found
          </div>
        ) : (
          items.map((item: ClusterListItem) => (
            <div key={item.cluster_id} className="grid grid-cols-[2fr_1fr_1fr_3fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50  text-zinc-900 dark:text-zinc-50">
              <div className="text-sm">
                <Link 
                  href={`/admin/clustering/${item.cluster_id}`}
                  className="text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {item.cluster_id}
                </Link>
              </div>
              <div className="text-sm">{item.bill_count}</div>
              <div className="text-sm">{item.state_count}</div>
              <div className="text-sm max-w-[400px] overflow-hidden">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="truncate cursor-help">{item.executive_summary}</div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[500px] whitespace-normal bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
                      {item.executive_summary}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-sm"><StatusBadge status={item.status} /></div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(item.min_date)}</div>
              <div><ClusterActions cluster={item} /></div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {items.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
          <div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Showing{' '}
              <span className="font-medium">
                {pagination.pageIndex * pagination.pageSize + 1}
              </span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.total)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{pagination.total}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => dispatch(setPagination({ pageIndex: pagination.pageIndex - 1 }))}
                disabled={pagination.pageIndex === 0}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => dispatch(setPagination({ pageIndex: pagination.pageIndex + 1 }))}
                disabled={pagination.pageIndex >= Math.ceil(pagination.total / pagination.pageSize) - 1}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
} 