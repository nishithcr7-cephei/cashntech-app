import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RepaymentRecord, initialRepaymentState, FetchRepaymentListRequest} from './repayment.types';

const repaymentSlice = createSlice({
  name: 'repayment',
  initialState: initialRepaymentState,
  reducers: {
    fetchRepaymentListRequest: (state, _action: PayloadAction<FetchRepaymentListRequest>) => {
      state.loading = true;
      state.error = null;
    },
    fetchRepaymentListSuccess: (state, action: PayloadAction<RepaymentRecord[]>) => {
      state.repaymentList = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchRepaymentListFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetRepaymentState: () => initialRepaymentState,
  },
});

export const {
  fetchRepaymentListRequest,
  fetchRepaymentListSuccess,
  fetchRepaymentListFailure,
  resetRepaymentState,
} = repaymentSlice.actions;

export default repaymentSlice.reducer;
