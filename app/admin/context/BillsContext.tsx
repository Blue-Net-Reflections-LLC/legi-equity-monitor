'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'

interface Bill {
  id: string
  title: string
  state: string
  status: string
  clusterId?: string
  clusterStatus?: 'pending' | 'processed' | 'failed'
  introducedDate: Date
  lastActionDate: Date
}

interface BillsState {
  bills: Bill[]
  filters: {
    state?: string
    status?: string
    dateRange?: {
      start: Date
      end: Date
    }
    clusterStatus?: 'pending' | 'processed' | 'failed'
  }
  selectedBills: string[]
  loading: boolean
  error: string | null
}

type BillsAction =
  | { type: 'SET_BILLS'; payload: Bill[] }
  | { type: 'SET_FILTERS'; payload: BillsState['filters'] }
  | { type: 'SET_SELECTED_BILLS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: BillsState = {
  bills: [],
  filters: {},
  selectedBills: [],
  loading: false,
  error: null
}

const billsReducer = produce((draft: BillsState, action: BillsAction) => {
  switch (action.type) {
    case 'SET_BILLS':
      draft.bills = action.payload
      break
    case 'SET_FILTERS':
      draft.filters = action.payload
      break
    case 'SET_SELECTED_BILLS':
      draft.selectedBills = action.payload
      break
    case 'SET_LOADING':
      draft.loading = action.payload
      break
    case 'SET_ERROR':
      draft.error = action.payload
      break
  }
})

const BillsContext = createContext<{
  state: BillsState
  dispatch: React.Dispatch<BillsAction>
} | undefined>(undefined)

export function BillsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(billsReducer, initialState)

  return (
    <BillsContext.Provider value={{ state, dispatch }}>
      {children}
    </BillsContext.Provider>
  )
}

export function useBills() {
  const context = useContext(BillsContext)
  if (context === undefined) {
    throw new Error('useBills must be used within a BillsProvider')
  }

  const { state, dispatch } = context

  return {
    // State
    state,

    // Actions
    setBills: (bills: Bill[]) => 
      dispatch({ type: 'SET_BILLS', payload: bills }),
    
    setFilters: (filters: BillsState['filters']) => 
      dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    setSelectedBills: (billIds: string[]) => 
      dispatch({ type: 'SET_SELECTED_BILLS', payload: billIds }),
    
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error })
  }
} 