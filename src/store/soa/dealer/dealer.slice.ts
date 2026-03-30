import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DealerState, DealerListItem, FetchDealerListRequest} from './dealer.types';

const initialState: DealerState = {
  dealerList: [],
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
  totalDealers: 0,
};

const dealerSlice = createSlice({
  name: 'dealer',
  initialState,
  reducers: {
    fetchDealerListRequest: (state, _action: PayloadAction<FetchDealerListRequest>) => {
      state.loading = true;
      state.error = null;
    },
    fetchDealerListSuccess: (
      state,
      action: PayloadAction<{data: DealerListItem[]; total: number; page: number}>
    ) => {
      state.loading = false;
      const {data, total, page} = action.payload;
      
      if (page === 1) {
        state.dealerList = data;
      } else {
        state.dealerList = [...state.dealerList, ...data];
      }
      
      state.page = page;
      state.totalDealers = total;
      state.hasMore = state.dealerList.length < total;
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
