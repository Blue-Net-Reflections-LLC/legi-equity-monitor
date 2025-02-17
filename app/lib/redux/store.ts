import { configureStore } from '@reduxjs/toolkit'
import { uiReducer } from './features/ui/uiSlice'
import { clusteringReducer } from './features/clustering/clusteringSlice'
import { clusterDetailReducer } from './features/clustering/clusterDetailSlice'
import { blogReducer } from './features/blog/blogSlice'
import { billsReducer } from './features/bills/billsSlice'
import { stateSliderReducer } from './features/stateSlider/stateSliderSlice'
import { embeddingReducer } from './features/embedding/embeddingSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    clustering: clusteringReducer,
    clusterDetail: clusterDetailReducer,
    blog: blogReducer,
    bills: billsReducer,
    stateSlider: stateSliderReducer,
    embedding: embeddingReducer,
  },
  devTools: true
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 