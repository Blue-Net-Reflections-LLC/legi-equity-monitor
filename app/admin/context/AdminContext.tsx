'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'
import { getWeek } from 'date-fns'
import { type SortingState, type ColumnFiltersState, type PaginationState } from '@tanstack/react-table'

// Clustering Types
interface ClusterState {
  items: Array<{
    cluster_id: string
    bill_count: number
    state_count: number
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
    executive_summary: string
    created_at: string
    updated_at: string
  }>
  currentCluster: any | null // TODO: Type this properly
  filters: {
    week: number
    year: number
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
  }
  pagination: PaginationState & { total: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

// Blog Types
interface BlogState {
  posts: Array<{
    id: string
    title: string
    status: 'draft' | 'review' | 'published' | 'archived'
    author: string
    publishedAt?: string
    updatedAt: string
  }>
  filters: {
    status?: string
    author?: string
    dateRange?: { start: Date; end: Date }
  }
  pagination: PaginationState & { total: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

// Bills Types
interface BillsState {
  items: Array<{
    id: string
    title: string
    state: string
    status: string
    clusterId?: string
    introducedDate: string
    lastActionDate: string
  }>
  filters: {
    state?: string
    status?: string
    dateRange?: { start: Date; end: Date }
  }
  pagination: PaginationState & { total: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

// Combined Admin State
interface AdminState {
  sidebarExpanded: boolean
  activeSection: string | null
  loading: Record<string, boolean>
  error: string | null
  clustering: ClusterState
  blog: BlogState
  bills: BillsState
}

// Action Types
type AdminAction =
  | { type: 'SET_SIDEBAR_EXPANDED'; payload: boolean }
  | { type: 'SET_ACTIVE_SECTION'; payload: string | null }
  | { type: 'SET_LOADING'; payload: { feature: string; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  // Clustering Actions
  | { type: 'clustering/SET_ITEMS'; payload: ClusterState['items'] }
  | { type: 'clustering/SET_CURRENT_CLUSTER'; payload: ClusterState['currentCluster'] }
  | { type: 'clustering/SET_FILTERS'; payload: Partial<ClusterState['filters']> }
  | { type: 'clustering/SET_PAGINATION'; payload: Partial<ClusterState['pagination']> }
  | { type: 'clustering/SET_SORTING'; payload: SortingState }
  | { type: 'clustering/SET_COLUMN_FILTERS'; payload: ColumnFiltersState }
  // Blog Actions
  | { type: 'blog/SET_POSTS'; payload: BlogState['posts'] }
  | { type: 'blog/SET_FILTERS'; payload: Partial<BlogState['filters']> }
  | { type: 'blog/SET_PAGINATION'; payload: Partial<BlogState['pagination']> }
  | { type: 'blog/SET_SORTING'; payload: SortingState }
  | { type: 'blog/SET_COLUMN_FILTERS'; payload: ColumnFiltersState }
  // Bills Actions
  | { type: 'bills/SET_ITEMS'; payload: BillsState['items'] }
  | { type: 'bills/SET_FILTERS'; payload: Partial<BillsState['filters']> }
  | { type: 'bills/SET_PAGINATION'; payload: Partial<BillsState['pagination']> }
  | { type: 'bills/SET_SORTING'; payload: SortingState }
  | { type: 'bills/SET_COLUMN_FILTERS'; payload: ColumnFiltersState }

const initialState: AdminState = {
  sidebarExpanded: false,
  activeSection: null,
  loading: {
    clusters: false,
    bills: false,
    users: false,
    blog: false
  },
  error: null,
  clustering: {
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
  },
  blog: {
    posts: [],
    filters: {},
    pagination: {
      pageIndex: 0,
      pageSize: 10,
      total: 0
    },
    sorting: [],
    columnFilters: []
  },
  bills: {
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
}

const adminReducer = produce((draft: AdminState, action: AdminAction) => {
  switch (action.type) {
    // UI Actions
    case 'SET_SIDEBAR_EXPANDED':
      draft.sidebarExpanded = action.payload
      break
    case 'SET_ACTIVE_SECTION':
      draft.activeSection = action.payload
      break
    case 'SET_LOADING':
      draft.loading[action.payload.feature] = action.payload.value
      break
    case 'SET_ERROR':
      draft.error = action.payload
      break

    // Clustering Actions
    case 'clustering/SET_ITEMS':
      draft.clustering.items = action.payload
      break
    case 'clustering/SET_CURRENT_CLUSTER':
      draft.clustering.currentCluster = action.payload
      break
    case 'clustering/SET_FILTERS':
      draft.clustering.filters = { ...draft.clustering.filters, ...action.payload }
      // Reset pagination when filters change
      draft.clustering.pagination.pageIndex = 0
      break
    case 'clustering/SET_PAGINATION':
      draft.clustering.pagination = { ...draft.clustering.pagination, ...action.payload }
      break
    case 'clustering/SET_SORTING':
      draft.clustering.sorting = action.payload
      break
    case 'clustering/SET_COLUMN_FILTERS':
      draft.clustering.columnFilters = action.payload
      break

    // Blog Actions
    case 'blog/SET_POSTS':
      draft.blog.posts = action.payload
      break
    case 'blog/SET_FILTERS':
      draft.blog.filters = { ...draft.blog.filters, ...action.payload }
      draft.blog.pagination.pageIndex = 0
      break
    case 'blog/SET_PAGINATION':
      draft.blog.pagination = { ...draft.blog.pagination, ...action.payload }
      break
    case 'blog/SET_SORTING':
      draft.blog.sorting = action.payload
      break
    case 'blog/SET_COLUMN_FILTERS':
      draft.blog.columnFilters = action.payload
      break

    // Bills Actions
    case 'bills/SET_ITEMS':
      draft.bills.items = action.payload
      break
    case 'bills/SET_FILTERS':
      draft.bills.filters = { ...draft.bills.filters, ...action.payload }
      draft.bills.pagination.pageIndex = 0
      break
    case 'bills/SET_PAGINATION':
      draft.bills.pagination = { ...draft.bills.pagination, ...action.payload }
      break
    case 'bills/SET_SORTING':
      draft.bills.sorting = action.payload
      break
    case 'bills/SET_COLUMN_FILTERS':
      draft.bills.columnFilters = action.payload
      break
  }
})

const AdminContext = createContext<{
  state: AdminState
  dispatch: React.Dispatch<AdminAction>
} | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState)

  return (
    <AdminContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }

  const { state, dispatch } = context

  return {
    // UI State
    sidebarExpanded: state.sidebarExpanded,
    activeSection: state.activeSection,
    loading: state.loading,
    error: state.error,

    // UI Actions
    setSidebarExpanded: (expanded: boolean) => 
      dispatch({ type: 'SET_SIDEBAR_EXPANDED', payload: expanded }),
    setActiveSection: (section: string | null) => 
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: section }),
    setLoading: (feature: string, value: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: { feature, value } }),
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),

    // Clustering State & Actions
    clustering: {
      ...state.clustering,
      setItems: (items: ClusterState['items']) => 
        dispatch({ type: 'clustering/SET_ITEMS', payload: items }),
      setCurrentCluster: (cluster: ClusterState['currentCluster']) => 
        dispatch({ type: 'clustering/SET_CURRENT_CLUSTER', payload: cluster }),
      setFilters: (filters: Partial<ClusterState['filters']>) => 
        dispatch({ type: 'clustering/SET_FILTERS', payload: filters }),
      setPagination: (pagination: Partial<ClusterState['pagination']>) => 
        dispatch({ type: 'clustering/SET_PAGINATION', payload: pagination }),
      setSorting: (sorting: SortingState) => 
        dispatch({ type: 'clustering/SET_SORTING', payload: sorting }),
      setColumnFilters: (filters: ColumnFiltersState) => 
        dispatch({ type: 'clustering/SET_COLUMN_FILTERS', payload: filters })
    },

    // Blog State & Actions
    blog: {
      ...state.blog,
      setPosts: (posts: BlogState['posts']) => 
        dispatch({ type: 'blog/SET_POSTS', payload: posts }),
      setFilters: (filters: Partial<BlogState['filters']>) => 
        dispatch({ type: 'blog/SET_FILTERS', payload: filters }),
      setPagination: (pagination: Partial<BlogState['pagination']>) => 
        dispatch({ type: 'blog/SET_PAGINATION', payload: pagination }),
      setSorting: (sorting: SortingState) => 
        dispatch({ type: 'blog/SET_SORTING', payload: sorting }),
      setColumnFilters: (filters: ColumnFiltersState) => 
        dispatch({ type: 'blog/SET_COLUMN_FILTERS', payload: filters })
    },

    // Bills State & Actions
    bills: {
      ...state.bills,
      setItems: (items: BillsState['items']) => 
        dispatch({ type: 'bills/SET_ITEMS', payload: items }),
      setFilters: (filters: Partial<BillsState['filters']>) => 
        dispatch({ type: 'bills/SET_FILTERS', payload: filters }),
      setPagination: (pagination: Partial<BillsState['pagination']>) => 
        dispatch({ type: 'bills/SET_PAGINATION', payload: pagination }),
      setSorting: (sorting: SortingState) => 
        dispatch({ type: 'bills/SET_SORTING', payload: sorting }),
      setColumnFilters: (filters: ColumnFiltersState) => 
        dispatch({ type: 'bills/SET_COLUMN_FILTERS', payload: filters })
    }
  }
} 