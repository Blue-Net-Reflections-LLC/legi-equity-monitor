import { type SortingState, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table'

export interface TableState<I, F> {
  items: I[]
  filters: F
  pagination: PaginationState & { total: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

export type TablePagination = PaginationState & { total: number } 