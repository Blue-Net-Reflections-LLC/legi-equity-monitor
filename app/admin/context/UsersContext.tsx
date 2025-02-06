'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'

interface User {
  id: string
  email: string
  name: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastLoginAt?: Date
  createdAt: Date
}

interface UsersState {
  users: User[]
  filters: {
    role?: string
    status?: 'active' | 'inactive' | 'pending'
    dateRange?: {
      start: Date
      end: Date
    }
  }
  selectedUsers: string[]
  loading: boolean
  error: string | null
}

type UsersAction =
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_FILTERS'; payload: UsersState['filters'] }
  | { type: 'SET_SELECTED_USERS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: UsersState = {
  users: [],
  filters: {},
  selectedUsers: [],
  loading: false,
  error: null
}

const usersReducer = produce((draft: UsersState, action: UsersAction) => {
  switch (action.type) {
    case 'SET_USERS':
      draft.users = action.payload
      break
    case 'SET_FILTERS':
      draft.filters = action.payload
      break
    case 'SET_SELECTED_USERS':
      draft.selectedUsers = action.payload
      break
    case 'SET_LOADING':
      draft.loading = action.payload
      break
    case 'SET_ERROR':
      draft.error = action.payload
      break
  }
})

const UsersContext = createContext<{
  state: UsersState
  dispatch: React.Dispatch<UsersAction>
} | undefined>(undefined)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(usersReducer, initialState)

  return (
    <UsersContext.Provider value={{ state, dispatch }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider')
  }

  const { state, dispatch } = context

  return {
    // State
    state,

    // Actions
    setUsers: (users: User[]) => 
      dispatch({ type: 'SET_USERS', payload: users }),
    
    setFilters: (filters: UsersState['filters']) => 
      dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    setSelectedUsers: (userIds: string[]) => 
      dispatch({ type: 'SET_SELECTED_USERS', payload: userIds }),
    
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error })
  }
} 