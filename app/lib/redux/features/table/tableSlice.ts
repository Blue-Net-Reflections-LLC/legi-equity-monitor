import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { type SortingState, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table'

export interface TableState<I, F> {
  items: I[]
  filters: F
  pagination: PaginationState & { total: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

export const createTableSlice = <I, F>(name: string, initialState: TableState<I, F>) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      setItems: (state, action: PayloadAction<I[]>) => {
        state.items = action.payload
      },
      setFilters: (state, action: PayloadAction<Partial<F>>) => {
        state.filters = { ...state.filters, ...action.payload }
        state.pagination.pageIndex = 0
      },
      setPagination: (state, action: PayloadAction<Partial<PaginationState & { total: number }>>) => {
        state.pagination = { ...state.pagination, ...action.payload }
      },
      setSorting: (state, action: PayloadAction<SortingState>) => {
        state.sorting = action.payload
      },
      setColumnFilters: (state, action: PayloadAction<ColumnFiltersState>) => {
        state.columnFilters = action.payload
      }
    }
  })
} 