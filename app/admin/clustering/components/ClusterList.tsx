'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type ColumnDef
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { useCluster } from '../context/ClusterContext'
import { useAdmin } from '../../context/AdminContext'
import { LoadingState } from '@/app/admin/components/LoadingState'
import { StatusBadge } from './StatusBadge'
import { ClusterActions } from './ClusterActions'
import { type ClusterListItem } from '../types'

// Define columns based on our design doc
const columns: ColumnDef<ClusterListItem>[] = [
  {
    id: 'cluster_id',
    header: 'Cluster ID',
    cell: ({ row }) => (
      <Link 
        href={`/admin/clustering/${row.original.cluster_id}`}
        className="text-orange-600 dark:text-orange-400 hover:underline"
      >
        {row.original.cluster_id.slice(0, 8)}...
      </Link>
    )
  },
  {
    id: 'bill_count',
    header: 'Bills',
    cell: ({ row }) => row.original.bill_count
  },
  {
    id: 'executive_summary',
    header: 'Summary',
    cell: ({ row }) => (
      <div className="max-w-md truncate" title={row.original.executive_summary}>
        {row.original.executive_summary}
      </div>
    )
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    id: 'dates',
    header: 'Dates',
    cell: ({ row }) => (
      <div className="text-sm space-y-1">
        <div className="text-zinc-500 dark:text-zinc-400">
          Created: {format(new Date(row.original.created_at), 'MMM d, yyyy')}
        </div>
        <div className="text-zinc-500 dark:text-zinc-400">
          Updated: {format(new Date(row.original.updated_at), 'MMM d, yyyy')}
        </div>
      </div>
    )
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ClusterActions cluster={row.original} />
  }
]

export function ClusterList() {
  const { loading } = useAdmin()
  const { 
    items,
    filters,
    pagination,
    sorting,
    columnFilters,
    setItems,
    setPagination,
    setSorting,
    setColumnFilters
  } = useCluster()

  // Initialize table
  const table = useReactTable({
    data: items,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize },
      columnFilters
    },
    onSortingChange: (updater) => setSorting(typeof updater === 'function' ? updater(sorting) : updater),
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      setPagination({ ...pagination, ...newPagination })
    },
    onColumnFiltersChange: (updater) => setColumnFilters(typeof updater === 'function' ? updater(columnFilters) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  // Fetch data when filters change
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const response = await fetch(`/admin/api/clustering?${new URLSearchParams({
          page: (pagination.pageIndex + 1).toString(),
          pageSize: pagination.pageSize.toString(),
          week: filters.week.toString(),
          year: filters.year.toString(),
          ...(filters.status && { status: filters.status })
        })}`)

        if (!response.ok) throw new Error('Failed to fetch clusters')

        const data = await response.json()
        setItems(data.items)
        setPagination({ total: data.total })
      } catch (error) {
        console.error('Error fetching clusters:', error)
      }
    }

    fetchClusters()
  }, [filters, pagination.pageIndex, pagination.pageSize])

  return (
    <div className="relative">
      <LoadingState feature="clusters" />
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    {header.column.columnDef.header?.toString()}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Showing{' '}
              <span className="font-medium">{pagination.pageSize * pagination.pageIndex + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(pagination.pageSize * (pagination.pageIndex + 1), pagination.total)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{pagination.total}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
} 