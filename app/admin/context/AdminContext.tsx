'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'

// Define the state interface
interface AdminState {
  sidebarExpanded: boolean
  activeSection: string | null
  loading: boolean
  error: string | null
}

// Define action types
type AdminAction =
  | { type: 'TOGGLE_SIDEBAR'; payload: boolean }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// Initial state
const initialState: AdminState = {
  sidebarExpanded: false,
  activeSection: null,
  loading: false,
  error: null
}

// Create reducer with Immer
const adminReducer = produce((draft: AdminState, action: AdminAction) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      draft.sidebarExpanded = action.payload
      break
      
    case 'SET_ACTIVE_SECTION':
      draft.activeSection = action.payload
      break
      
    case 'SET_LOADING':
      draft.loading = action.payload
      break
      
    case 'SET_ERROR':
      draft.error = action.payload
      break
  }
})

// Create context with dispatch
interface AdminContextType {
  state: AdminState
  dispatch: React.Dispatch<AdminAction>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

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
    
    // Actions
    setSidebarExpanded: (expanded: boolean) => 
      dispatch({ type: 'TOGGLE_SIDEBAR', payload: expanded }),
      
    setActiveSection: (section: string) => 
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: section }),
      
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
      
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error })
  }
} 