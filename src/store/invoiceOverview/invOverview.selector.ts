import {RootState} from '@store/app/store';

export const selectInvoiceOverviewState = (state: RootState) =>
  state.invoiceOverview;

export const selectInvoiceOverviewSummary = (state: RootState) =>
  state.invoiceOverview.summary;

export const selectInvoiceOverviewSummaryLoading = (state: RootState) =>
  state.invoiceOverview.summaryLoading;

export const selectInvoiceOverviewSummaryError = (state: RootState) =>
  state.invoiceOverview.summaryError;

export const selectInvoiceOverviewLatest = (state: RootState) =>
  state.invoiceOverview.latest;

export const selectInvoiceOverviewLatestLoading = (state: RootState) =>
  state.invoiceOverview.latestLoading;

export const selectInvoiceOverviewLatestError = (state: RootState) =>
  state.invoiceOverview.latestError;

