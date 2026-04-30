import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {
  fetchInvoiceSummaryRequest,
  fetchInvoiceSummarySuccess,
  fetchInvoiceSummaryFailure,
  fetchLatestInvoicesRequest,
  fetchLatestInvoicesSuccess,
  fetchLatestInvoicesFailure,
} from './invOverview.slice';
import {invoiceApi} from '@services/api/invoice.api';
import {
  InvoiceOverviewSummaryItem,
  InvoiceOverviewLatestItem,
} from './invOverview.types';
import {
  fetchInvoiceKpisRequest,
  fetchInvoiceKpisSuccess,
  fetchInvoiceKpisFailure,
} from './invOverview.slice';

function* fetchInvoiceSummarySaga(
  action: PayloadAction<{programIds: string[]}>,
) {
  try {
    const response: any = yield call(
      invoiceApi.getInvoiceSummary,
      action.payload.programIds,
    );
    const data = Array.isArray(response?.data) ? response.data : [];
    yield put(
      fetchInvoiceSummarySuccess(data as InvoiceOverviewSummaryItem[]),
    );
  } catch (error: any) {
    // Summary API may not be available on all environments — fail silently
    // eslint-disable-next-line no-console
    console.warn('[fetchInvoiceSummarySaga] Summary API unavailable:', error?.message);
    yield put(fetchInvoiceSummarySuccess([] as InvoiceOverviewSummaryItem[]));
  }
}

function* fetchLatestInvoicesSaga(
  action: PayloadAction<{programIds: string[]}>,
) {
  try {
    const response: any = yield call(
      invoiceApi.getLatestInvoices,
      action.payload.programIds,
    );
    const data = Array.isArray(response?.data) ? response.data : [];
    yield put(fetchLatestInvoicesSuccess(data as InvoiceOverviewLatestItem[]));
  } catch (error: any) {
    const msg =
      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : error?.message || 'Failed to fetch latest invoices';
    yield put(fetchLatestInvoicesFailure(msg));
  }
}

function* fetchInvoiceKpisSaga(
  action: PayloadAction<{programIds: string[]}>,
) {
  try {
    const kpis = yield call(
      invoiceApi.getInvoiceKpis,
      action.payload.programIds,
    );
    // eslint-disable-next-line no-console
    console.log('[fetchInvoiceKpisSaga] Final KPI Data for Store:', kpis);
    yield put(fetchInvoiceKpisSuccess(kpis));
  } catch (error: any) {
    const msg =
      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : error?.message || 'Failed to fetch invoice KPIs';
    yield put(fetchInvoiceKpisFailure(msg));
  }
}

export default function* invoiceOverviewSaga() {
  yield takeLatest(fetchInvoiceSummaryRequest.type, fetchInvoiceSummarySaga);
  yield takeLatest(fetchLatestInvoicesRequest.type, fetchLatestInvoicesSaga);
  yield takeLatest(fetchInvoiceKpisRequest.type, fetchInvoiceKpisSaga);
}

