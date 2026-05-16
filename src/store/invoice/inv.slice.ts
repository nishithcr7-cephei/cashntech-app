import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  InvoiceState,
  initialInvoiceState,
  DealerInfoResponse,
  PartnerBank,
  InvoiceListItemApi,
  UpdateInvoiceStatusRequest,
  UpdateInvoiceVerificationRequest,
  UpdateInvoicePayload,
  BulkUpdateInvoiceRequest,
  BulkDisbursementRequest,
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
      console.log('[inv.slice] createInvoiceRequest reducer');
      state.createInvoiceLoading = true;
      state.createInvoiceError = null;
      state.createInvoiceSuccess = false;
    },
    createInvoiceSuccess: (state, action: PayloadAction<unknown>) => {
      console.log('[inv.slice] createInvoiceSuccess reducer');
      state.createInvoiceLoading = false;
      state.createInvoiceSuccess = true;
      state.createInvoiceResponse = action.payload;
      state.createInvoiceError = null;
    },
    createInvoiceFailure: (state, action: PayloadAction<string>) => {
      console.log('[inv.slice] createInvoiceFailure reducer, error:', action.payload);
      state.createInvoiceLoading = false;
      state.createInvoiceError = action.payload;
      state.createInvoiceSuccess = false;
    },
    resetCreateInvoiceState: (state) => {
      state.createInvoiceLoading = false;
      state.createInvoiceSuccess = false;
      state.createInvoiceResponse = null;
      state.createInvoiceError = null;
    },
    updateInvoiceRequest: (state, _action: PayloadAction<UpdateInvoicePayload>) => {
      state.createInvoiceLoading = true; // Use same loading flag as create for simplicity in UI
      state.createInvoiceError = null;
      state.createInvoiceSuccess = false;
    },
    updateInvoiceSuccess: (state, action: PayloadAction<unknown>) => {
      state.createInvoiceLoading = false;
      state.createInvoiceSuccess = true;
      state.createInvoiceResponse = action.payload;
      state.createInvoiceError = null;
    },
    updateInvoiceFailure: (state, action: PayloadAction<string>) => {
      state.createInvoiceLoading = false;
      state.createInvoiceError = action.payload;
      state.createInvoiceSuccess = false;
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
    updateInvoiceStatusRequest: (
      _state,
      _action: PayloadAction<UpdateInvoiceStatusRequest>,
    ) => {},
    updateInvoiceStatusSuccess: state => {
      // no-op reducer; side-effects handled in saga, list refreshed separately
      state.invoiceListError = null;
    },
    updateInvoiceStatusFailure: (state, _action: PayloadAction<string>) => {
      // Action-level failures are surfaced via toast; keep list screen intact.
      state.invoiceListError = null;
    },
    updateInvoiceVerificationRequest: (
      _state,
      _action: PayloadAction<UpdateInvoiceVerificationRequest>,
    ) => {},
    updateInvoiceVerificationSuccess: state => {
      state.invoiceListError = null;
    },
    updateInvoiceVerificationFailure: (state, _action: PayloadAction<string>) => {
      // Action-level failures are surfaced via toast; keep list screen intact.
      state.invoiceListError = null;
    },
    bulkUpdateInvoiceRequest: (
      _state,
      _action: PayloadAction<BulkUpdateInvoiceRequest>,
    ) => {},
    bulkUpdateInvoiceSuccess: state => {
      state.invoiceListError = null;
    },
    bulkUpdateInvoiceFailure: (state, _action: PayloadAction<string>) => {
      state.invoiceListError = null;
    },
    bulkDisbursementRequest: (state, _action: PayloadAction<BulkDisbursementRequest>) => {
      state.bulkDisbursementLoading = true;
      state.bulkDisbursementSuccess = false;
      state.invoiceListError = null;
    },
    bulkDisbursementSuccess: state => {
      state.bulkDisbursementLoading = false;
      state.bulkDisbursementSuccess = true;
      state.invoiceListError = null;
    },
    bulkDisbursementFailure: (state, action: PayloadAction<string>) => {
      state.bulkDisbursementLoading = false;
      state.bulkDisbursementSuccess = false;
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
  updateInvoiceRequest,
  updateInvoiceSuccess,
  updateInvoiceFailure,
  fetchInvoiceListRequest,
  fetchInvoiceListSuccess,
  fetchInvoiceListFailure,
  updateInvoiceStatusRequest,
  updateInvoiceStatusSuccess,
  updateInvoiceStatusFailure,
  updateInvoiceVerificationRequest,
  updateInvoiceVerificationSuccess,
  updateInvoiceVerificationFailure,
  bulkUpdateInvoiceRequest,
  bulkUpdateInvoiceSuccess,
  bulkUpdateInvoiceFailure,
  bulkDisbursementRequest,
  bulkDisbursementSuccess,
  bulkDisbursementFailure,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
