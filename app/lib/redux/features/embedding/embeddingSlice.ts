import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EmbeddingState {
  status: 'idle' | 'initializing' | 'ready' | 'error';
  message: string;
  error: string | null;
}

const initialState: EmbeddingState = {
  status: 'idle',
  message: '',
  error: null
};

export const embeddingSlice = createSlice({
  name: 'embedding',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<{ status: EmbeddingState['status'], message?: string }>) => {
      state.status = action.payload.status;
      if (action.payload.message) {
        state.message = action.payload.message;
      }
      if (state.status !== 'error') {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    reset: (state) => {
      state.status = 'idle';
      state.message = '';
      state.error = null;
    }
  }
});

export const { setStatus, setError, reset } = embeddingSlice.actions;
export const embeddingReducer = embeddingSlice.reducer; 