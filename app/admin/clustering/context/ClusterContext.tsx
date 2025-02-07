'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'
import { getWeek } from 'date-fns'
import { type ClusterListItem, type ClusterDetail } from '../types'
import { SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table'

interface ClusterState {
  items: ClusterListItem[]
  currentCluster: ClusterDetail | null
  filters: {
    week: number
    year: number
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
  }
  pagination: PaginationState & { total: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
}

type ClusterAction =
  | { type: 'SET_ITEMS'; payload: ClusterListItem[] }
  | { type: 'SET_CURRENT_CLUSTER'; payload: ClusterDetail | null }
  | { type: 'SET_FILTERS'; payload: Partial<ClusterState['filters']> }
  | { type: 'SET_PAGINATION'; payload: Partial<ClusterState['pagination']> }
  | { type: 'SET_SORTING'; payload: SortingState }
  | { type: 'SET_COLUMN_FILTERS'; payload: ColumnFiltersState }

const initialState: ClusterState = {
  items: [],
  currentCluster: null,
  filters: {
    week: getWeek(new Date()),
    year: new Date().getFullYear(),
  },
  pagination: {
    pageIndex: 0,
    pageSize: 10,
    total: 0
  },
  sorting: [],
  columnFilters: []
}

const ClusterContext = createContext<{
  state: ClusterState
  dispatch: React.Dispatch<ClusterAction>
} | undefined>(undefined)

const clusterReducer = produce((draft: ClusterState, action: ClusterAction) => {
  switch (action.type) {
    case 'SET_ITEMS':
      draft.items = action.payload
      break
    case 'SET_CURRENT_CLUSTER':
      draft.currentCluster = action.payload
      break
    case 'SET_FILTERS':
      draft.filters = { ...draft.filters, ...action.payload }
      break
    case 'SET_PAGINATION':
      draft.pagination = { ...draft.pagination, ...action.payload }
      break
    case 'SET_SORTING':
      draft.sorting = action.payload
      break
    case 'SET_COLUMN_FILTERS':
      draft.columnFilters = action.payload
      break
  }
})

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(clusterReducer, initialState)

  return (
    <ClusterContext.Provider value={{ state, dispatch }}>
      {children}
    </ClusterContext.Provider>
  )
}

export function useCluster() {
  const context = useContext(ClusterContext)
  if (!context) {
    throw new Error('useCluster must be used within ClusterProvider')
  }

  const { state, dispatch } = context

  return {
    // State
    items: state.items,
    currentCluster: state.currentCluster,
    filters: state.filters,
    pagination: state.pagination,
    sorting: state.sorting,
    columnFilters: state.columnFilters,

    // Actions
    setItems: (items: ClusterListItem[]) => 
      dispatch({ type: 'SET_ITEMS', payload: items }),
    
    setCurrentCluster: (cluster: ClusterDetail | null) => 
      dispatch({ type: 'SET_CURRENT_CLUSTER', payload: cluster }),
    
    setFilters: (filters: Partial<ClusterState['filters']>) => 
      dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    setPagination: (pagination: Partial<ClusterState['pagination']>) => 
      dispatch({ type: 'SET_PAGINATION', payload: pagination }),
    
    setSorting: (sorting: SortingState) => 
      dispatch({ type: 'SET_SORTING', payload: sorting }),
    
    setColumnFilters: (columnFilters: ColumnFiltersState) => 
      dispatch({ type: 'SET_COLUMN_FILTERS', payload: columnFilters })
  }
} 