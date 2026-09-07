import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DPDRecord, initialDPDState, FetchDPDListRequest} from './dpd.types';

const dpdSlice = createSlice({
  name: 'dpd',
  initialState: initialDPDState,
  reducers: {
    fetchDPDListRequest: (state, _action: PayloadAction<FetchDPDListRequest>) => {
      state.loading = true;
      state.error = null;
    },
    fetchDPDListSuccess: (state, action: PayloadAction<DPDRecord[]>) => {
      state.dpdList = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchDPDListFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetDPDState: () => initialDPDState,
  },
});

export const {
  fetchDPDListRequest,
  fetchDPDListSuccess,
  fetchDPDListFailure,
  resetDPDState,
} = dpdSlice.actions;

export default dpdSlice.reducer;
