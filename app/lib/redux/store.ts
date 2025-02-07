import { configureStore } from '@reduxjs/toolkit'
import { uiReducer } from './features/ui/uiSlice'
import { clusteringReducer } from './features/clustering/clusteringSlice'
import { blogReducer } from './features/blog/blogSlice'
import { billsReducer } from './features/bills/billsSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    clustering: clusteringReducer,
    blog: blogReducer,
    bills: billsReducer,
  },
  devTools: true
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 