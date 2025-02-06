'use client'

import { useAppDispatch, useAppSelector } from '@/app/lib/redux/hooks'
import { setFilters } from '@/app/lib/redux/features/clustering/clusteringSlice'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getWeek } from 'date-fns'

export function ClusterFilters() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(state => state.clustering.filters)

  // Get current year and week
  const currentYear = new Date().getFullYear()
  const currentWeek = getWeek(new Date())

  // Generate years (current year and previous year)
  const years = [currentYear, currentYear - 1]

  // Generate weeks (1-52)
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-4">
      <Select
        value={filters.year.toString()}
        onValueChange={(value) => dispatch(setFilters({ year: parseInt(value) }))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.week.toString()}
        onValueChange={(value) => dispatch(setFilters({ week: parseInt(value) }))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select week" />
        </SelectTrigger>
        <SelectContent>
          {weeks.map((week) => (
            <SelectItem key={week} value={week.toString()}>
              Week {week}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 