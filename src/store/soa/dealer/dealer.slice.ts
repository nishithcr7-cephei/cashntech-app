import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  DealerState,
  DealerListItem,
  FetchDealerListRequest,
  FetchProgramSummaryRequest,
  ProgramCounterPartySummary,
} from './dealer.types';

const initialState: DealerState = {
  dealerList: [],
  loading: false,
  error: null,
  totalDealers: 0,
  programSummary: null,
  summaryLoading: false,
  summaryError: null,
};

const dealerSlice = createSlice({
  name: 'dealer',
  initialState,
  reducers: {
    fetchDealerListRequest: (state, action: PayloadAction<FetchDealerListRequest>) => {
      state.loading = true;
      state.error = null;
      if (action.payload.isInitialLoad) {
        state.dealerList = [];
      }
    },
    fetchDealerListSuccess: (
      state,
      action: PayloadAction<{data: DealerListItem[]; total: number}>,
    ) => {
      state.loading = false;
      const {data, total} = action.payload;
      state.dealerList = data;
      state.totalDealers = total;
    },
    fetchDealerListFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchProgramSummaryRequest: (
      state,
      _action: PayloadAction<FetchProgramSummaryRequest>,
    ) => {
      state.summaryLoading = true;
      state.summaryError = null;
    },
    fetchProgramSummarySuccess: (
      state,
      action: PayloadAction<ProgramCounterPartySummary>,
    ) => {
      state.summaryLoading = false;
      state.programSummary = action.payload;
    },
    fetchProgramSummaryFailure: (state, action: PayloadAction<string>) => {
      state.summaryLoading = false;
      state.summaryError = action.payload;
    },
    resetDealerState: () => {
      return initialState;
    },
  },
});

export const {
  fetchDealerListRequest,
  fetchDealerListSuccess,
  fetchDealerListFailure,
  fetchProgramSummaryRequest,
  fetchProgramSummarySuccess,
  fetchProgramSummaryFailure,
  resetDealerState,
} = dealerSlice.actions;

export default dealerSlice.reducer;
