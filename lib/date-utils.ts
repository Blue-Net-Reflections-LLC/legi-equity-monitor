import { format } from 'date-fns'

export interface WeekRange {
  week: number
  year: number
  startDate: Date
  endDate: Date
}

export function getWeekRanges(year: number): WeekRange[] {
  const ranges: WeekRange[] = []
  for (let week = 1; week <= 53; week++) {
    // Get first day of the week (Monday)
    const firstDay = new Date(year, 0, 1)
    while (firstDay.getDay() !== 1) {
      firstDay.setDate(firstDay.getDate() + 1)
    }
    firstDay.setDate(firstDay.getDate() + (week - 1) * 7)
    
    // Get last day of the week (Sunday)
    const lastDay = new Date(firstDay)
    lastDay.setDate(lastDay.getDate() + 6)
    lastDay.setHours(23, 59, 59, 999)

    // Only include weeks that fall within the year
    if (lastDay.getFullYear() === year) {
      ranges.push({
        week,
        year,
        startDate: firstDay,
        endDate: lastDay
      })
    }
  }
  return ranges
} 