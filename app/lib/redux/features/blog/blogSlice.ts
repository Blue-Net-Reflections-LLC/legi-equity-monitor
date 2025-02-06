import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { type TableState } from '../table/tableSlice'

interface BlogPost {
  id: string
  title: string
  status: 'draft' | 'review' | 'published' | 'archived'
  author: string
  publishedAt?: string
  updatedAt: string
}

interface BlogFilters {
  status?: string
  author?: string
  dateRange?: { start: Date; end: Date }
}

const initialState: TableState<BlogPost, BlogFilters> = {
  items: [],
  filters: {},
  pagination: {
    pageIndex: 0,
    pageSize: 10,
    total: 0
  },
  sorting: [],
  columnFilters: []
}

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<BlogPost[]>) => {
      state.items = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<BlogFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.pageIndex = 0
    },
    setPagination: (state, action: PayloadAction<Partial<TableState<any, any>['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setSorting: (state, action: PayloadAction<TableState<any, any>['sorting']>) => {
      state.sorting = action.payload
    },
    setColumnFilters: (state, action: PayloadAction<TableState<any, any>['columnFilters']>) => {
      state.columnFilters = action.payload
    }
  }
})

export const { setItems, setFilters, setPagination, setSorting, setColumnFilters } = blogSlice.actions
export const blogReducer = blogSlice.reducer 