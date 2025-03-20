'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BillCard } from '@/app/components/BillCard'
import { BillCardSkeleton } from './BillCardSkeleton'
import { BillFiltersWrapper } from '../filters/BillFiltersWrapper'
import { FilterPills } from '../filters/FilterPills'
import { StateSlider } from '../states/StateSlider'
import Pagination from '../Pagination'
import { Gavel } from 'lucide-react'
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
    <>
      <StateSlider currentStateCode={stateCode} />
      <section className="py-4 px-6">
        <div className="max-w-[2000px] mx-auto space-y-4">
          <div className="flex justify-between items-center flex-wrap">
            <div className="text-sm text-zinc-500 whitespace-nowrap">
              {(!loading && bills.length > 0) && (
                <>Showing bills {offset + 1}-{Math.min(offset + bills.length, totalCount)} of {totalCount}</>
              )}
            </div>
            <div className="flex items-center gap-3 ml-auto">
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
              {!filters && (
                <div className="h-10 w-10 text-sm text-zinc-500 whitespace-nowrap">
                  
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {Array.from({ length: pageSize }).map((_, i) => (
                <BillCardSkeleton key={i} />
              ))}
            </div>
          ) : bills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {bills.map(bill => (
                <BillCard key={bill.bill_id} bill={bill} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="mb-8">
                <Gavel className="w-32 h-32 text-orange-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                No bills found
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md">
                {searchParams.toString()
                  ? "Try adjusting your filters to see more bills."
                  : "There are no bills available at the moment."}
              </p>
              {searchParams.toString() && (
                <a
                  href={`/${stateCode.toLowerCase()}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
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
              searchParams={Object.fromEntries(
                [...searchParams.entries()].map(([key, value]) => {
                  // Get all values for this key
                  const values = searchParams.getAll(key);
                  // If there are multiple values, return the key with an array
                  return values.length > 1 ? [key, values] : [key, value];
                })
              )}
            />
          )}
        </div>
      </section>
    </>
  )
} 