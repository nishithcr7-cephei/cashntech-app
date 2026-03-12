import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  InvoiceOverviewState,
  initialInvoiceOverviewState,
  InvoiceOverviewSummaryItem,
  InvoiceOverviewLatestItem,
} from './invOverview.types';

const invoiceOverviewSlice = createSlice({
  name: 'invoiceOverview',
  initialState: initialInvoiceOverviewState,
  reducers: {
    fetchInvoiceSummaryRequest: (
      state,
      _action: PayloadAction<{programIds: string[]}>,
    ) => {
      state.summaryLoading = true;
      state.summaryError = null;
    },
    fetchInvoiceSummarySuccess: (
      state,
      action: PayloadAction<InvoiceOverviewSummaryItem[]>,
    ) => {
      state.summary = action.payload;
      state.summaryLoading = false;
      state.summaryError = null;
    },
    fetchInvoiceSummaryFailure: (state, action: PayloadAction<string>) => {
      state.summaryLoading = false;
      state.summaryError = action.payload;
    },

    fetchLatestInvoicesRequest: (
      state,
      _action: PayloadAction<{programIds: string[]}>,
    ) => {
      state.latestLoading = true;
      state.latestError = null;
    },
    fetchLatestInvoicesSuccess: (
      state,
      action: PayloadAction<InvoiceOverviewLatestItem[]>,
    ) => {
      state.latest = action.payload;
      state.latestLoading = false;
      state.latestError = null;
    },
    fetchLatestInvoicesFailure: (state, action: PayloadAction<string>) => {
      state.latestLoading = false;
      state.latestError = action.payload;
    },
  },
});

export const {
  fetchInvoiceSummaryRequest,
  fetchInvoiceSummarySuccess,
  fetchInvoiceSummaryFailure,
  fetchLatestInvoicesRequest,
  fetchLatestInvoicesSuccess,
  fetchLatestInvoicesFailure,
} = invoiceOverviewSlice.actions;

export default invoiceOverviewSlice.reducer;

