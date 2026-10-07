import {call, delay, put, race, select, take, takeLatest, takeLeading} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {invoiceApi} from '@services/api/invoice.api';
import {normalizeConsolidatedInvoiceRow} from '@utils/normalizeConsolidatedInvoice';
import {
  appendConsolidatedRows,
  clearConsolidatedSearch,
  consolidatedSearchFailure,
  consolidatedSearchProgress,
  fetchConsolidatedFailure,
  fetchConsolidatedRequest,
  fetchConsolidatedSuccess,
  loadMoreConsolidatedFinished,
  loadMoreConsolidatedRequest,
  resetConsolidatedState,
  searchConsolidatedRequest,
  setConsolidatedFilters,
} from './consolidatedInvoice.slice';
import {selectConsolidatedState} from './consolidatedInvoice.selector';
import {
  CONSOLIDATED_PAGE_SIZE,
  CONSOLIDATED_SEARCH_BATCH_SIZE,
  CONSOLIDATED_SEARCH_MAX_ROWS,
  CONSOLIDATED_SEARCH_MIN_CHARS,
  ConsolidatedInvoiceFilters,
  ConsolidatedInvoiceListRequest,
  ConsolidatedInvoiceListResponse,
  ConsolidatedInvoiceState,
} from './consolidatedInvoice.types';

const SEARCH_DEBOUNCE_MS = 400;

function buildRequest(
  filters: ConsolidatedInvoiceFilters,
  page: number,
  limit: number,
): ConsolidatedInvoiceListRequest {
  return {
    page,
    limit,
    productId: filters.productIds.length ? filters.productIds : undefined,
    programIds: filters.programIds.length ? filters.programIds : undefined,
    byInvoiceStatus: filters.invoiceStatuses.length
      ? filters.invoiceStatuses
      : undefined,
    byAdminStatus: filters.adminStatuses.length
      ? filters.adminStatuses
      : undefined,
  };
}

function* fetchPage(page: number, limit: number): Generator<any, {rows: any[]; total: number}, any> {
  const state: ConsolidatedInvoiceState = yield select(selectConsolidatedState);
  const res: ConsolidatedInvoiceListResponse = yield call(
    invoiceApi.getConsolidatedInvoiceList,
    buildRequest(state.filters, page, limit),
  );
  return {
    rows: res.rows.map(normalizeConsolidatedInvoiceRow),
    total: res.total,
  };
}

function* fetchWorker(): Generator<any, void, any> {
  try {
    const result = yield call(fetchPage, 1, CONSOLIDATED_PAGE_SIZE);
    yield put(fetchConsolidatedSuccess(result));

    const state: ConsolidatedInvoiceState = yield select(selectConsolidatedState);
    if (state.search.query.trim().length >= CONSOLIDATED_SEARCH_MIN_CHARS) {
      yield put(searchConsolidatedRequest(state.search.query));
    }
  } catch (error: any) {
    yield put(
      fetchConsolidatedFailure(error?.message || 'Failed to fetch invoices'),
    );
  }
}

function* loadMoreWorker(): Generator<any, void, any> {
  const state: ConsolidatedInvoiceState = yield select(selectConsolidatedState);
  if (!state.loadingMore) {
    return;
  }
  try {
    // floor() can overlap the previous page after a dedupe; overlap is dropped, never skipped.
    const page = Math.floor(state.rows.length / CONSOLIDATED_PAGE_SIZE) + 1;
    const result = yield call(fetchPage, page, CONSOLIDATED_PAGE_SIZE);
    yield put(appendConsolidatedRows(result));
  } catch {
    // Axios interceptor already toasts 403 / network errors; keep loaded rows.
  } finally {
    yield put(loadMoreConsolidatedFinished());
  }
}

/** Loads the remaining pages (up to the search cap) so the search covers every row. */
function* scanRemainingWorker(): Generator<any, void, any> {
  let state: ConsolidatedInvoiceState = yield select(selectConsolidatedState);
  const target = Math.min(state.total, CONSOLIDATED_SEARCH_MAX_ROWS);

  yield put(
    consolidatedSearchProgress({
      isScanning: state.hasMore && state.rows.length < target,
      checkedCount: state.rows.length,
      capped: false,
    }),
  );

  try {
    while (state.hasMore && state.rows.length < target) {
      const loaded = state.rows.length;
      // Use 100-row batches once aligned; until then 20-row pages keep offsets exact.
      const limit =
        loaded % CONSOLIDATED_SEARCH_BATCH_SIZE === 0
          ? CONSOLIDATED_SEARCH_BATCH_SIZE
          : CONSOLIDATED_PAGE_SIZE;
      const page = Math.floor(loaded / limit) + 1;

      const result = yield call(fetchPage, page, limit);
      yield put(appendConsolidatedRows(result));

      state = yield select(selectConsolidatedState);
      yield put(
        consolidatedSearchProgress({
          isScanning: true,
          checkedCount: state.rows.length,
          capped: false,
        }),
      );
      if (state.rows.length === loaded) {
        break;
      }
    }

    state = yield select(selectConsolidatedState);
    yield put(
      consolidatedSearchProgress({
        isScanning: false,
        checkedCount: state.rows.length,
        capped:
          state.total > CONSOLIDATED_SEARCH_MAX_ROWS &&
          state.rows.length >= CONSOLIDATED_SEARCH_MAX_ROWS,
      }),
    );
  } catch (error: any) {
    yield put(
      consolidatedSearchFailure(error?.message || 'Search could not finish'),
    );
  }
}

function* searchWorker(action: PayloadAction<string>): Generator<any, void, any> {
  if (action.payload.trim().length < CONSOLIDATED_SEARCH_MIN_CHARS) {
    return;
  }
  yield delay(SEARCH_DEBOUNCE_MS);
  yield race({
    scan: call(scanRemainingWorker),
    cancel: take([
      clearConsolidatedSearch.type,
      setConsolidatedFilters.type,
      fetchConsolidatedRequest.type,
      resetConsolidatedState.type,
    ]),
  });
}

function* filtersWorker(): Generator<any, void, any> {
  yield put(fetchConsolidatedRequest());
}

export function* consolidatedInvoiceSaga() {
  yield takeLatest(fetchConsolidatedRequest.type, fetchWorker);
  yield takeLeading(loadMoreConsolidatedRequest.type, loadMoreWorker);
  yield takeLatest(searchConsolidatedRequest.type, searchWorker);
  yield takeLatest(setConsolidatedFilters.type, filtersWorker);
}
