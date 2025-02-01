'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BillCard } from '@/app/components/BillCard'
import { BillCardSkeleton } from './BillCardSkeleton'
import { BillFiltersWrapper } from '../filters/BillFiltersWrapper'
import { FilterPills } from '../filters/FilterPills'
import Pagination from '../Pagination'
import type { Bill } from '@/app/types'
import type { BillFilters as BillFiltersType } from '@/app/types/filters'

interface BillListProps {
  stateCode: string
}

export function BillList({ stateCode }: BillListProps) {
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<BillFiltersType>()
  const [bills, setBills] = useState<Bill[]>([])

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 12
  const offset = (page - 1) * pageSize

  useEffect(() => {
    async function loadBills() {
      setLoading(true)
      try {
        // Fetch bills based on current search params
        const response = await fetch(`/api/bills/${stateCode}?${searchParams.toString()}`)
        const data = await response.json()
        setBills(data.bills)
        setTotalCount(data.totalCount)
        setFilters(data.filters)
      } catch (error) {
        console.error('Failed to load bills:', error)
      }
      setLoading(false)
    }

    loadBills()
  }, [stateCode, searchParams])

  return (
    <section className="py-4 md:px-0 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center flex-wrap">
          <div className="text-sm text-zinc-500 whitespace-nowrap">
            Showing bills {offset + 1}-{Math.min(offset + (loading ? pageSize : bills.length), totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-3">
            {filters && (
              <>
                <FilterPills
                  stateCode={stateCode}
                  billFilters={filters}
                  categoryFilters={filters.categories.filter(cat => cat.selected) as unknown as { id: string; impactTypes: ("POSITIVE" | "BIAS" | "NEUTRAL")[] }[]}
                  filters={{
                    party: searchParams.get('party') || undefined,
                    support: searchParams.get('support') || undefined,
                    committee: searchParams.getAll('committee')
                  }}
                  searchParams={Object.fromEntries(searchParams.entries())}
                />
                <BillFiltersWrapper 
                  filters={filters} 
                  stateCode={stateCode} 
                />
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <BillCardSkeleton key={i} />
            ))}
          </div>
        ) : bills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map(bill => (
              <BillCard key={bill.bill_id} bill={bill} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bills found
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              {searchParams.toString()
                ? "Try adjusting your filters to see more bills."
                : "There are no bills available at the moment."}
            </p>
            {searchParams.toString() && (
              <a
                href={`/${stateCode.toLowerCase()}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </a>
            )}
          </div>
        )}

        {totalCount > pageSize && (
          <Pagination
            currentPage={page}
            totalItems={totalCount}
            pageSize={pageSize}
            searchParams={Object.fromEntries(searchParams.entries())}
          />
        )}
      </div>
    </section>
  )
} 