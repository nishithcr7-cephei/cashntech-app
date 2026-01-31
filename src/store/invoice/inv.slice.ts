import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  InvoiceState,
  initialInvoiceState,
  DealerInfoResponse,
  PartnerBank,
} from './inv.types';

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: initialInvoiceState,
  reducers: {
    fetchDealerInfoRequest: (state, _action: PayloadAction<string>) => {
      state.dealerInfoLoading = true;
      state.dealerInfoError = null;
    },
    fetchDealerInfoSuccess: (state, action: PayloadAction<DealerInfoResponse>) => {
      state.dealerInfo = action.payload;
      state.dealerInfoLoading = false;
      state.dealerInfoError = null;
    },
    fetchDealerInfoFailure: (state, action: PayloadAction<string>) => {
      state.dealerInfoLoading = false;
      state.dealerInfoError = action.payload;
    },
    fetchBankListRequest: (state) => {
      state.bankListLoading = true;
      state.bankListError = null;
    },
    fetchBankListSuccess: (state, action: PayloadAction<PartnerBank[]>) => {
      state.bankList = action.payload;
      state.bankListLoading = false;
      state.bankListError = null;
    },
    fetchBankListFailure: (state, action: PayloadAction<string>) => {
      state.bankListLoading = false;
      state.bankListError = action.payload;
    },
    createInvoiceRequest: (state, _action: PayloadAction<unknown>) => {
      state.createInvoiceLoading = true;
      state.createInvoiceError = null;
      state.createInvoiceSuccess = false;
    },
    createInvoiceSuccess: (state, action: PayloadAction<unknown>) => {
      state.createInvoiceLoading = false;
      state.createInvoiceSuccess = true;
      state.createInvoiceResponse = action.payload;
      state.createInvoiceError = null;
    },
    createInvoiceFailure: (state, action: PayloadAction<string>) => {
      state.createInvoiceLoading = false;
      state.createInvoiceError = action.payload;
      state.createInvoiceSuccess = false;
    },
    resetCreateInvoiceState: (state) => {
      state.createInvoiceSuccess = false;
      state.createInvoiceResponse = null;
      state.createInvoiceError = null;
    },
  },
});

export const {
  fetchDealerInfoRequest,
  fetchDealerInfoSuccess,
  fetchDealerInfoFailure,
  fetchBankListRequest,
  fetchBankListSuccess,
  fetchBankListFailure,
  createInvoiceRequest,
  createInvoiceSuccess,
  createInvoiceFailure,
  resetCreateInvoiceState,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
