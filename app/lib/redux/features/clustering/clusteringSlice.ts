import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { type TableState, type TablePagination } from '../table/types'
import { type ClusterListItem, type ClusterDetail, type SortConfig } from '@/app/admin/clustering/types'

interface ClusterFilters {
  week: number  // 0 means all weeks
  year: number
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
}

interface ClusteringState extends Omit<TableState<ClusterListItem, ClusterFilters>, 'filters'> {
  filters: ClusterFilters  // Keep required fields in state
  currentCluster: ClusterDetail | null
  loading: boolean
  error: string | null
  data: ClusterListItem[]
  total: number
}

const initialState: ClusteringState = {
  items: [],
  currentCluster: null,
  filters: {
    week: 0, // Default to all weeks
    year: new Date().getFullYear()
  },
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

interface FetchClustersPayload {
  data: ClusterListItem[]
  total: number
}

interface ErrorPayload {
  message: string
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
      state.filters = { 
        week: state.filters.week,
        year: state.filters.year,
        ...action.payload
      }
      state.pagination.pageIndex = 0
    },
    setPagination: (state, action: PayloadAction<Partial<TablePagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setSorting: (state, action: PayloadAction<TableState<ClusterListItem, ClusterFilters>['sorting']>) => {
      state.sorting = action.payload
    },
    setColumnFilters: (state, action: PayloadAction<TableState<ClusterListItem, ClusterFilters>['columnFilters']>) => {
      state.columnFilters = action.payload
    },
    fetchClustersStart: (state) => {
      state.loading = true
    },
    fetchClustersSuccess: (state, action: PayloadAction<FetchClustersPayload>) => {
      state.loading = false
      state.data = action.payload.data
      state.total = action.payload.total
    },
    fetchClustersFailure: (state, action: PayloadAction<ErrorPayload>) => {
      state.loading = false
      state.error = action.payload.message
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClusters.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchClusters.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.pagination.total = Number(action.payload.total)
        state.error = null
      })
      .addCase(fetchClusters.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch clusters'
      })
  }
})

// Create async thunk for fetching clusters
export const fetchClusters = createAsyncThunk(
  'clustering/fetchClusters',
  async (params: { 
    pageIndex: number; 
    pageSize: number; 
    filters: ClusterFilters;
    sorting: SortConfig
  }) => {
    const queryParams = new URLSearchParams({
      page: (params.pageIndex + 1).toString(),
      size: params.pageSize.toString(),
      year: params.filters.year.toString()
    })
    
    // Only add week parameter if it's not 0 (all weeks)
    if (params.filters.week !== 0) {
      queryParams.append('week', params.filters.week.toString())
    }
    
    if (params.filters.status) {
      queryParams.append('status', params.filters.status)
    }

    // Default to sorting by min_date desc if no sorting specified
    const sortKey = params.sorting?.key || 'min_date'
    const sortDirection = params.sorting?.direction || 'desc'
    queryParams.append('sort', sortKey)
    queryParams.append('order', sortDirection)

    const response = await fetch(`/admin/api/clustering?${queryParams}`)
    return response.json()
  }
)

export const { 
  setItems, 
  setCurrentCluster, 
  setFilters, 
  setPagination, 
  setSorting, 
  setColumnFilters,
  fetchClustersStart,
  fetchClustersSuccess,
  fetchClustersFailure
} = clusteringSlice.actions

export const clusteringReducer = clusteringSlice.reducer 