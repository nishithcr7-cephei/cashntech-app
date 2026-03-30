import {createSelector} from '@reduxjs/toolkit';
import {RepaymentState} from './repayment.types';

const selectRepaymentState = (state: any): RepaymentState => state.repayment;

export const selectRepaymentList = createSelector(
  [selectRepaymentState],
  repaymentState => repaymentState.repaymentList,
);

export const selectRepaymentLoading = createSelector(
  [selectRepaymentState],
  repaymentState => repaymentState.loading,
);

export const selectRepaymentError = createSelector(
  [selectRepaymentState],
  repaymentState => repaymentState.error,
);
