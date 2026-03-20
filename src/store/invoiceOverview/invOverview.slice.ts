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

    fetchInvoiceKpisRequest: (
      state,
      _action: PayloadAction<{programIds: string[]}>,
    ) => {
      // keep existing summary/latest loading state; KPIs are lightweight
    },
    fetchInvoiceKpisSuccess: (
      state,
      action: PayloadAction<{
        total_program_limit: string;
        utilized_amount: string;
        utilized_rate: string;
        active_dealer_ratio: string;
        available_limit: string;
        overdue_amount: string;
        dpd_days: string;
      }>,
    ) => {
      state.kpis = action.payload;
    },
    fetchInvoiceKpisFailure: (state, _action: PayloadAction<string>) => {
      state.kpis = {
        total_program_limit: '0',
        utilized_amount: '0',
        utilized_rate: '0',
        active_dealer_ratio: '0',
        available_limit: '0',
        overdue_amount: '0',
        dpd_days: '0',
      };
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
  fetchInvoiceKpisRequest,
  fetchInvoiceKpisSuccess,
  fetchInvoiceKpisFailure,
} = invoiceOverviewSlice.actions;

export default invoiceOverviewSlice.reducer;

