'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { produce } from 'immer'

interface BlogPost {
  id: string
  title: string
  status: 'draft' | 'review' | 'published' | 'archived'
  author: string
  publishedAt?: Date
  updatedAt: Date
}

interface BlogState {
  posts: BlogPost[]
  filters: {
    status?: 'draft' | 'review' | 'published' | 'archived'
    author?: string
    dateRange?: {
      start: Date
      end: Date
    }
  }
  selectedPosts: string[]
  loading: boolean
  error: string | null
}

type BlogAction =
  | { type: 'SET_POSTS'; payload: BlogPost[] }
  | { type: 'SET_FILTERS'; payload: BlogState['filters'] }
  | { type: 'SET_SELECTED_POSTS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: BlogState = {
  posts: [],
  filters: {},
  selectedPosts: [],
  loading: false,
  error: null
}

const blogReducer = produce((draft: BlogState, action: BlogAction) => {
  switch (action.type) {
    case 'SET_POSTS':
      draft.posts = action.payload
      break
    case 'SET_FILTERS':
      draft.filters = action.payload
      break
    case 'SET_SELECTED_POSTS':
      draft.selectedPosts = action.payload
      break
    case 'SET_LOADING':
      draft.loading = action.payload
      break
    case 'SET_ERROR':
      draft.error = action.payload
      break
  }
})

const BlogContext = createContext<{
  state: BlogState
  dispatch: React.Dispatch<BlogAction>
} | undefined>(undefined)

export function BlogProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(blogReducer, initialState)

  return (
    <BlogContext.Provider value={{ state, dispatch }}>
      {children}
    </BlogContext.Provider>
  )
}

export function useBlog() {
  const context = useContext(BlogContext)
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider')
  }

  const { state, dispatch } = context

  return {
    // State
    state,

    // Actions
    setPosts: (posts: BlogPost[]) => 
      dispatch({ type: 'SET_POSTS', payload: posts }),
    
    setFilters: (filters: BlogState['filters']) => 
      dispatch({ type: 'SET_FILTERS', payload: filters }),
    
    setSelectedPosts: (postIds: string[]) => 
      dispatch({ type: 'SET_SELECTED_POSTS', payload: postIds }),
    
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error })
  }
} 