'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'

interface Cluster {
  id: string
  name: string
  billCount: number
  stateCount: number
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
  createdAt: Date
  updatedAt: Date
}

interface ClusterState {
  clusters: Cluster[]
  filters: {
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
    dateRange?: {
      start: Date
      end: Date
    }
    minBills?: number
    minStates?: number
  }
  selectedClusters: string[]
  loading: boolean
  error: string | null
}

type ClusterAction =
  | { type: 'SET_CLUSTERS'; payload: Cluster[] }
  | { type: 'SET_FILTERS'; payload: ClusterState['filters'] }
  | { type: 'SET_SELECTED_CLUSTERS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: ClusterState = {
  clusters: [],
  filters: {},
  selectedClusters: [],
  loading: false,
  error: null
}

const clusterReducer = produce((draft: ClusterState, action: ClusterAction) => {
  switch (action.type) {
    case 'SET_CLUSTERS':
      draft.clusters = action.payload
      break
    case 'SET_FILTERS':
      draft.filters = action.payload
      break
    case 'SET_SELECTED_CLUSTERS':
      draft.selectedClusters = action.payload
      break
    case 'SET_LOADING':
      draft.loading = action.payload
      break
    case 'SET_ERROR':
      draft.error = action.payload
      break
  }
})

const ClusterContext = createContext<{
  state: ClusterState
  dispatch: React.Dispatch<ClusterAction>
} | undefined>(undefined)

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
  if (context === undefined) {
    throw new Error('useCluster must be used within a ClusterProvider')
  }

  const { state, dispatch } = context

  return {
    // State
    state,

    // Actions
    setClusters: (clusters: Cluster[]) => 
      dispatch({ type: 'SET_CLUSTERS', payload: clusters }),
    
    setFilters: (filters: ClusterState['filters']) => 
      dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    setSelectedClusters: (clusterIds: string[]) => 
      dispatch({ type: 'SET_SELECTED_CLUSTERS', payload: clusterIds }),
    
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error })
  }
} 