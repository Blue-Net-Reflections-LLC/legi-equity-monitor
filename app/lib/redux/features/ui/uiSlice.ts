import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarExpanded: boolean
  activeSection: string | null
  loading: {
    clusters: boolean
    bills: boolean
    users: boolean
    blog: boolean
    [key: string]: boolean
  }
  error: string | null
}

const initialState: UIState = {
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

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidebarExpanded = action.payload
    },
    setActiveSection: (state, action: PayloadAction<string | null>) => {
      state.activeSection = action.payload
    },
    setLoading: (state, action: PayloadAction<{ feature: string; value: boolean }>) => {
      state.loading[action.payload.feature] = action.payload.value
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    }
  }
})

export const { setSidebarExpanded, setActiveSection, setLoading, setError } = uiSlice.actions
export const uiReducer = uiSlice.reducer 