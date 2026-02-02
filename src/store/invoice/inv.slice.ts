import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  InvoiceState,
  initialInvoiceState,
  DealerInfoResponse,
  PartnerBank,
  InvoiceListItemApi,
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
    fetchInvoiceListRequest: (
      state,
      _action: PayloadAction<{programId: string; filters?: {byInvoiceStatus?: string[]; byApprovalStatus?: string[]}}>,
    ) => {
      state.invoiceListLoading = true;
      state.invoiceListError = null;
    },
    fetchInvoiceListSuccess: (state, action: PayloadAction<InvoiceListItemApi[]>) => {
      state.invoiceList = action.payload;
      state.invoiceListLoading = false;
      state.invoiceListError = null;
    },
    fetchInvoiceListFailure: (state, action: PayloadAction<string>) => {
      state.invoiceListLoading = false;
      state.invoiceListError = action.payload;
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
  fetchInvoiceListRequest,
  fetchInvoiceListSuccess,
  fetchInvoiceListFailure,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
