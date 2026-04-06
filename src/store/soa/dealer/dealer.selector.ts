import {RootState} from '@store/app/store';

export const dealerListSelector = (state: RootState) => state.soaDealer.dealerList;
export const dealerLoadingSelector = (state: RootState) => state.soaDealer.loading;
export const totalDealersSelector = (state: RootState) => state.soaDealer.totalDealers;
export const dealerErrorSelector = (state: RootState) => state.soaDealer.error;
