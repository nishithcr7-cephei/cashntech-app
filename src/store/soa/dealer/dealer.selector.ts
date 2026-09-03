import {RootState} from '@store/app/store';

export const dealerListSelector = (state: RootState) => state.soaDealer.dealerList;
export const dealerLoadingSelector = (state: RootState) => state.soaDealer.loading;
export const totalDealersSelector = (state: RootState) => state.soaDealer.totalDealers;
export const dealerErrorSelector = (state: RootState) => state.soaDealer.error;
export const programSummarySelector = (state: RootState) =>
  state.soaDealer.programSummary;
export const programSummaryLoadingSelector = (state: RootState) =>
  state.soaDealer.summaryLoading;
export const programSummaryErrorSelector = (state: RootState) =>
  state.soaDealer.summaryError;
