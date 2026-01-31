import {RootState} from '@store/app/store';

export const selectInvoiceState = (state: RootState) => state.invoice;
export const selectDealerInfo = (state: RootState) => state.invoice.dealerInfo;
export const selectDealerInfoLoading = (state: RootState) =>
  state.invoice.dealerInfoLoading;
export const selectDealerInfoError = (state: RootState) =>
  state.invoice.dealerInfoError;
export const selectBankList = (state: RootState) => state.invoice.bankList;
export const selectBankListLoading = (state: RootState) =>
  state.invoice.bankListLoading;
export const selectBankListError = (state: RootState) =>
  state.invoice.bankListError;
export const selectCreateInvoiceLoading = (state: RootState) =>
  state.invoice.createInvoiceLoading;
export const selectCreateInvoiceError = (state: RootState) =>
  state.invoice.createInvoiceError;
export const selectCreateInvoiceSuccess = (state: RootState) =>
  state.invoice.createInvoiceSuccess;
export const selectCreateInvoiceResponse = (state: RootState) =>
  state.invoice.createInvoiceResponse;
