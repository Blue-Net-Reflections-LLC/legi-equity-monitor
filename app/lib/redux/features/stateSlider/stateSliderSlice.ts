import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface StateScrollPosition {
  stateCode: string;
  position: number;
}

interface StateSliderState {
  stateScrollPositions: Record<string, number>;
  currentPosition: number;
}

const initialState: StateSliderState = {
  stateScrollPositions: {},
  currentPosition: 0
}

export const stateSliderSlice = createSlice({
  name: 'stateSlider',
  initialState,
  reducers: {
    setScrollPosition: (state, action: PayloadAction<StateScrollPosition>) => {
      const { stateCode, position } = action.payload;
      state.stateScrollPositions[stateCode] = position;
      state.currentPosition = position;
    },
    setCurrentPosition: (state, action: PayloadAction<number>) => {
      state.currentPosition = action.payload;
    }
  }
})

export const { setScrollPosition, setCurrentPosition } = stateSliderSlice.actions
export const stateSliderReducer = stateSliderSlice.reducer 