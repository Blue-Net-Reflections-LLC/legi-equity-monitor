import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { type TableState } from '../table/tableSlice'

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

const initialState: TableState<Bill, BillFilters> = {
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

export const { setItems, setFilters, setPagination, setSorting, setColumnFilters } = billsSlice.actions
export const billsReducer = billsSlice.reducer 