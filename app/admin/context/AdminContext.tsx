'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'

// Define the state interface
interface AdminState {
  sidebarExpanded: boolean
  activeSection: string | null
  loading: Record<string, boolean>
  error: string | null
}

// Define action types
type AdminAction =
  | { type: 'SET_SIDEBAR_EXPANDED'; payload: boolean }
  | { type: 'SET_ACTIVE_SECTION'; payload: string | null }
  | { type: 'SET_LOADING'; payload: { feature: string; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }

// Initial state
const initialState: AdminState = {
  sidebarExpanded: false,
  activeSection: null,
  loading: {
    clusters: false,
    bills: false,
    users: false,
    blog: false
  },
  error: null
}

// Create reducer with Immer
const adminReducer = produce((draft: AdminState, action: AdminAction) => {
  switch (action.type) {
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
  }
})

// Create context with dispatch
const AdminContext = createContext<{
  state: AdminState
  dispatch: React.Dispatch<AdminAction>
} | undefined>(undefined)

// Create provider
export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState)

  return (
    <AdminContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminContext.Provider>
  )
}

// Custom hook with action creators
export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  
  const { state, dispatch } = context

  return {
    // State
    state,
    loading: state.loading,
    error: state.error,
    
    // Actions
    setSidebarExpanded: (expanded: boolean) => 
      dispatch({ type: 'SET_SIDEBAR_EXPANDED', payload: expanded }),
      
    setActiveSection: (section: string | null) => 
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: section }),
      
    setLoading: (feature: string, value: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: { feature, value } }),
      
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error })
  }
} 