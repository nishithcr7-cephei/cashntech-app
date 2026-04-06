import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DealerState, DealerListItem, FetchDealerListRequest} from './dealer.types';

const initialState: DealerState = {
  dealerList: [],
  loading: false,
  error: null,
  totalDealers: 0,
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
      action: PayloadAction<{data: DealerListItem[]; total: number}>
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
    resetDealerState: (state) => {
      return initialState;
    },
  },
});

export const {
  fetchDealerListRequest,
  fetchDealerListSuccess,
  fetchDealerListFailure,
  resetDealerState,
} = dealerSlice.actions;

export default dealerSlice.reducer;
