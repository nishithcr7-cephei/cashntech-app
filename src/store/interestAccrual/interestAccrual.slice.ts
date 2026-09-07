import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DailyInterestRecord, InterestAccrualRecord, initialInterestAccrualState, FetchDailyInterestRequest, FetchInterestAccrualListRequest} from './interestAccrual.types';

const interestAccrualSlice = createSlice({
  name: 'interestAccrual',
  initialState: initialInterestAccrualState,
  reducers: {
    fetchDailyInterestRequest: (state, _action: PayloadAction<FetchDailyInterestRequest>) => {
      state.loading = true;
      state.error = null;
    },
    fetchDailyInterestSuccess: (state, action: PayloadAction<DailyInterestRecord[]>) => {
      state.dailyInterestList = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchDailyInterestFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchInterestAccrualListRequest: (state, _action: PayloadAction<FetchInterestAccrualListRequest>) => {
      state.loading = true;
      state.error = null;
    },
    fetchInterestAccrualListSuccess: (state, action: PayloadAction<InterestAccrualRecord[]>) => {
      state.interestAccrualList = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchInterestAccrualListFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetInterestAccrualState: () => initialInterestAccrualState,
  },
});

export const {
  fetchDailyInterestRequest,
  fetchDailyInterestSuccess,
  fetchDailyInterestFailure,
  fetchInterestAccrualListRequest,
  fetchInterestAccrualListSuccess,
  fetchInterestAccrualListFailure,
  resetInterestAccrualState,
} = interestAccrualSlice.actions;

export default interestAccrualSlice.reducer;
