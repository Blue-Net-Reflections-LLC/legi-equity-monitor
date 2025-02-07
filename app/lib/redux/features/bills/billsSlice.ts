import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { type TableState, TablePagination } from '../table/types'

interface Bill {
  bill_id: number
  title: string
  state: string
  status: string
  created_at: string
  updated_at: string
}

interface BillFilters {
  state?: string
  status?: string
  dateRange?: { start: Date; end: Date }
}

interface BillsState extends TableState<Bill, BillFilters> {
  loading: boolean
  error: string | null
  data: Bill[]
  total: number
}

const initialState: BillsState = {
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

interface FetchBillsPayload {
  data: Bill[]
  total: number
}

interface ErrorPayload {
  message: string
}

const billsSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<Bill[]>) => {
      state.items = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<BillFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.pageIndex = 0
    },
    setPagination: (state, action: PayloadAction<Partial<TablePagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setSorting: (state, action: PayloadAction<TableState<Bill, BillFilters>['sorting']>) => {
      state.sorting = action.payload
    },
    setColumnFilters: (state, action: PayloadAction<TableState<Bill, BillFilters>['columnFilters']>) => {
      state.columnFilters = action.payload
    },
    fetchBillsStart: (state) => {
      state.loading = true
    },
    fetchBillsSuccess: (state, action: PayloadAction<FetchBillsPayload>) => {
      state.loading = false
      state.data = action.payload.data
      state.total = action.payload.total
    },
    fetchBillsFailure: (state, action: PayloadAction<ErrorPayload>) => {
      state.loading = false
      state.error = action.payload.message
    }
  }
})

export const { setItems, setFilters, setPagination, setSorting, setColumnFilters } = billsSlice.actions
export const billsReducer = billsSlice.reducer 