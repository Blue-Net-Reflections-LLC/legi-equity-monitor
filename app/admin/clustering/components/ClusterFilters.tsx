'use client'

import { format } from 'date-fns'
import { useCluster } from '../context/ClusterContext'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { getWeekRanges } from '@/lib/date-utils'

export function ClusterFilters() {
  const { filters, setFilters } = useCluster()
  const weeks = getWeekRanges(filters.year)
  
  return (
    <div className="flex gap-4">
      <Select
        value={filters.year.toString()}
        onValueChange={(year) => setFilters({ year: parseInt(year) })}
      >
        <SelectTrigger>
          {filters.year}
        </SelectTrigger>
        <SelectContent>
          {[2023, 2024].map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.week.toString()}
        onValueChange={(week) => setFilters({ week: parseInt(week) })}
      >
        <SelectTrigger>
          Week {filters.week}
        </SelectTrigger>
        <SelectContent>
          {weeks.map((range) => (
            <SelectItem key={range.week} value={range.week.toString()}>
              Week {range.week}: {format(range.startDate, 'MMM d')} - {format(range.endDate, 'MMM d')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 