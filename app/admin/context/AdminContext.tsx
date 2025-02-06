'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'
import { getWeek } from 'date-fns'
import { type AdminState } from './types'
import { type AdminAction, clusteringActions, blogActions, billsActions } from './actions'

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

    case 'clustering/SET_ITEMS':
      draft.clustering.items = action.payload
      break
    case 'clustering/SET_CURRENT_CLUSTER':
      draft.clustering.currentCluster = action.payload
      break
    case 'clustering/SET_FILTERS':
      draft.clustering.filters = { ...draft.clustering.filters, ...action.payload }
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
      ...Object.keys(clusteringActions).reduce((acc, key) => ({
        ...acc,
        [key]: (...args: any[]) => dispatch(clusteringActions[key as keyof typeof clusteringActions](...args))
      }), {})
    },

    // Blog State & Actions
    blog: {
      ...state.blog,
      ...Object.keys(blogActions).reduce((acc, key) => ({
        ...acc,
        [key]: (...args: any[]) => dispatch(blogActions[key as keyof typeof blogActions](...args))
      }), {})
    },

    // Bills State & Actions
    bills: {
      ...state.bills,
      ...Object.keys(billsActions).reduce((acc, key) => ({
        ...acc,
        [key]: (...args: any[]) => dispatch(billsActions[key as keyof typeof billsActions](...args))
      }), {})
    }
  }
} 