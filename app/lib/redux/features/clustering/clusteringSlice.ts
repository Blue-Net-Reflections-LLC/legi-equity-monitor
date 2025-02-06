import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getWeek } from 'date-fns'
import { type TableState } from '../table/tableSlice'
import { type ClusterListItem, type ClusterDetail } from '@/app/admin/clustering/types'

interface ClusterFilters {
  week: number
  year: number
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
}

interface ClusteringState extends TableState<ClusterListItem, ClusterFilters> {
  currentCluster: ClusterDetail | null
}

const initialState: ClusteringState = {
  items: [],
  currentCluster: null,
  filters: {
    week: getWeek(new Date()),
    year: new Date().getFullYear()
  },
  pagination: {
    pageIndex: 0,
    pageSize: 10,
    total: 0
  },
  sorting: [],
  columnFilters: []
}

const clusteringSlice = createSlice({
  name: 'clustering',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<ClusterListItem[]>) => {
      state.items = action.payload
    },
    setCurrentCluster: (state, action: PayloadAction<ClusterDetail | null>) => {
      state.currentCluster = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<ClusterFilters>>) => {
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

export const { 
  setItems, 
  setCurrentCluster, 
  setFilters, 
  setPagination, 
  setSorting, 
  setColumnFilters 
} = clusteringSlice.actions

export const clusteringReducer = clusteringSlice.reducer 