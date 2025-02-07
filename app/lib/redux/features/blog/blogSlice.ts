import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { type TableState, TablePagination } from '../table/types'

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

interface FetchPostsPayload {
  data: BlogPost[]
  total: number
}

interface ErrorPayload {
  message: string
}

interface BlogState extends TableState<BlogPost, BlogFilters> {
  loading: boolean
  error: string | null
  data: BlogPost[]
  total: number
}

const initialState: BlogState = {
  items: [],
  filters: {},
  pagination: {
    pageIndex: 0,
    pageSize: 10,
    total: 0
  },
  sorting: [],
  columnFilters: [],
  loading: false,
  error: null,
  data: [],
  total: 0
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
    setPagination: (state, action: PayloadAction<Partial<TablePagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setSorting: (state, action: PayloadAction<TableState<BlogPost, BlogFilters>['sorting']>) => {
      state.sorting = action.payload
    },
    setColumnFilters: (state, action: PayloadAction<TableState<BlogPost, BlogFilters>['columnFilters']>) => {
      state.columnFilters = action.payload
    },
    fetchPostsStart: (state) => {
      state.loading = true
    },
    fetchPostsSuccess: (state, action: PayloadAction<FetchPostsPayload>) => {
      state.loading = false
      state.data = action.payload.data
      state.total = action.payload.total
    },
    fetchPostsFailure: (state, action: PayloadAction<ErrorPayload>) => {
      state.loading = false
      state.error = action.payload.message
    }
  }
})

export const { setItems, setFilters, setPagination, setSorting, setColumnFilters } = blogSlice.actions
export const blogReducer = blogSlice.reducer 