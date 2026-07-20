import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  initialInvoiceOverviewState,
  InvoiceOverviewSummaryItem,
  InvoiceOverviewLatestItem,
  InvoiceOverviewRequest,
} from './invOverview.types';

const invoiceOverviewSlice = createSlice({
  name: 'invoiceOverview',
  initialState: initialInvoiceOverviewState,
  reducers: {
    fetchInvoiceSummaryRequest: (
      state,
      _action: PayloadAction<InvoiceOverviewRequest>,
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
      _action: PayloadAction<InvoiceOverviewRequest>,
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
      _action: PayloadAction<InvoiceOverviewRequest>,
    ) => {
      state.kpisLoading = true;
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
        principal_overdue: string;
        interest_overdue: string;
        penal_overdue: string;
        dpd_days: string;
      }>,
    ) => {
      state.kpis = action.payload;
      state.kpisLoading = false;
    },
    fetchInvoiceKpisFailure: (state, _action: PayloadAction<string>) => {
      state.kpis = {
        total_program_limit: '0',
        utilized_amount: '0',
        utilized_rate: '0',
        active_dealer_ratio: '0',
        available_limit: '0',
        overdue_amount: '0',
        principal_overdue: '0',
        interest_overdue: '0',
        penal_overdue: '0',
        dpd_days: '0',
      };
      state.kpisLoading = false;
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

