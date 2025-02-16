'use client'

import { useAppDispatch, useAppSelector } from '@/app/lib/redux/hooks'
import { setFilters } from '@/app/lib/redux/features/clustering/clusteringSlice'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ClusterFilters() {
  const dispatch = useAppDispatch()
  const { week = 0, year = new Date().getFullYear() } = useAppSelector(state => state.clustering.filters)

  // Get current year only since we don't use currentWeek
  const currentYear = new Date().getFullYear()

  // Generate years (current year and previous year)
  const years = [currentYear, currentYear - 1]

  // Generate weeks (0-52, where 0 is "All Weeks")
  const weeks = [
    { value: 0, label: 'All Weeks' },
    ...Array.from({ length: 52 }, (_, i) => ({
      value: i + 1,
      label: `Week ${i + 1}`
    }))
  ]

  const handleYearChange = (value: string) => {
    dispatch(setFilters({ year: parseInt(value) }))
  }

  const handleWeekChange = (value: string) => {
    dispatch(setFilters({ week: parseInt(value) }))
  }

  return (
    <div className="flex items-center gap-4">
      <Select
        value={year.toString()}
        onValueChange={handleYearChange}
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
        value={week.toString()}
        onValueChange={handleWeekChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select week" />
        </SelectTrigger>
        <SelectContent>
          {weeks.map((week) => (
            <SelectItem key={week.value} value={week.value.toString()}>
              {week.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 