import {configureStore} from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import reducer, {
  clearConsolidatedSearch,
  fetchConsolidatedRequest,
  loadMoreConsolidatedRequest,
  searchConsolidatedRequest,
  setConsolidatedFilters,
  setConsolidatedSearchField,
} from '../consolidatedInvoice.slice';
import {consolidatedInvoiceSaga} from '../consolidatedInvoice.saga';
import {
  selectConsolidatedSearchStatus,
  selectConsolidatedVisibleRows,
} from '../consolidatedInvoice.selector';
import type {ConsolidatedInvoiceListRequest} from '../consolidatedInvoice.types';

jest.mock('@utils/decrypt', () => ({
  decryptValue: (value: string) => value,
}));

const mockGetList = jest.fn();
jest.mock('@services/api/invoice.api', () => ({
  invoiceApi: {
    getConsolidatedInvoiceList: (req: unknown) => mockGetList(req),
  },
}));

/** Fake backend: `total` invoices, newest first, offset = (page − 1) × limit. */
function fakeBackend(total: number) {
  return (req: ConsolidatedInvoiceListRequest) => {
    const offset = (req.page - 1) * req.limit;
    const count = Math.max(0, Math.min(req.limit, total - offset));
    const rows = Array.from({length: count}, (_, i) => {
      const n = offset + i + 1;
      return {
        id: `inv-${n}`,
        invoice_ref_no: `INV/${String(n).padStart(4, '0')}`,
        product: {id: 'df-id', name: 'Dealer Finance'},
      };
    });
    return Promise.resolve({rows, total, page: req.page, limit: req.limit});
  };
}

function setupStore() {
  const sagaMiddleware = createSagaMiddleware();
  const store = configureStore({
    reducer: {consolidatedInvoice: reducer},
    middleware: getDefault =>
      getDefault({thunk: false, serializableCheck: false}).concat(sagaMiddleware),
  });
  sagaMiddleware.run(consolidatedInvoiceSaga);
  return store;
}

const flush = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(check: () => boolean, timeoutMs = 3000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor timed out');
    }
    await flush(10);
  }
}

describe('consolidatedInvoice saga', () => {
  beforeEach(() => {
    mockGetList.mockReset();
  });

  it('loads page 1 with limit 20 and no productId / programIds', async () => {
    mockGetList.mockImplementation(fakeBackend(23));
    const store = setupStore();

    store.dispatch(fetchConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loading);

    const s = store.getState().consolidatedInvoice;
    expect(s.rows).toHaveLength(20);
    expect(s.total).toBe(23);
    expect(s.hasMore).toBe(true);
    expect(mockGetList).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      productId: undefined,
      programIds: undefined,
      byInvoiceStatus: undefined,
      byAdminStatus: undefined,
    });
  });

  it('load more appends the next page and stops at total', async () => {
    mockGetList.mockImplementation(fakeBackend(23));
    const store = setupStore();
    store.dispatch(fetchConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loading);

    store.dispatch(loadMoreConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loadingMore);

    const s = store.getState().consolidatedInvoice;
    expect(s.rows).toHaveLength(23);
    expect(s.hasMore).toBe(false);
    expect(mockGetList).toHaveBeenLastCalledWith(
      expect.objectContaining({page: 2, limit: 20}),
    );
  });

  it('finds invoice #80 when only 40 rows were loaded, and never reports "not found" early', async () => {
    mockGetList.mockImplementation(fakeBackend(230));
    const store = setupStore();
    store.dispatch(fetchConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loading);
    store.dispatch(loadMoreConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loadingMore);
    expect(store.getState().consolidatedInvoice.rows).toHaveLength(40);

    store.dispatch(searchConsolidatedRequest('INV/0080'));
    const early = selectConsolidatedSearchStatus(store.getState());
    expect(early.active).toBe(true);
    expect(early.fullyChecked).toBe(false);

    await waitFor(() => selectConsolidatedSearchStatus(store.getState()).fullyChecked);

    const status = selectConsolidatedSearchStatus(store.getState());
    expect(status.isScanning).toBe(false);
    expect(status.checkedCount).toBe(230);
    expect(status.capped).toBe(false);
    expect(selectConsolidatedVisibleRows(store.getState()).map(r => r.id)).toEqual([
      'inv-80',
    ]);

    const limits = mockGetList.mock.calls.slice(2).map(([req]) => [req.page, req.limit]);
    // 40 → 60 → 80 → 100 with 20-row pages, then 100-row batches.
    expect(limits).toEqual([
      [3, 20],
      [4, 20],
      [5, 20],
      [2, 100],
      [3, 100],
    ]);
  });

  it('caps the scan at 1000 rows and flags it', async () => {
    mockGetList.mockImplementation(fakeBackend(1500));
    const store = setupStore();
    store.dispatch(fetchConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loading);

    store.dispatch(searchConsolidatedRequest('nothing-matches'));
    await waitFor(() => selectConsolidatedSearchStatus(store.getState()).fullyChecked);
    await waitFor(() => !store.getState().consolidatedInvoice.search.isScanning);

    const status = selectConsolidatedSearchStatus(store.getState());
    expect(store.getState().consolidatedInvoice.rows).toHaveLength(1000);
    expect(status.capped).toBe(true);
    expect(selectConsolidatedVisibleRows(store.getState())).toHaveLength(0);
  });

  it('short queries do not scan; clearing search trims back to the first page', async () => {
    mockGetList.mockImplementation(fakeBackend(230));
    const store = setupStore();
    store.dispatch(fetchConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loading);

    store.dispatch(searchConsolidatedRequest('IN'));
    await flush(500);
    expect(mockGetList).toHaveBeenCalledTimes(1);
    expect(selectConsolidatedVisibleRows(store.getState())).toHaveLength(20);

    store.dispatch(searchConsolidatedRequest('INV/0200'));
    await waitFor(() => selectConsolidatedSearchStatus(store.getState()).fullyChecked);
    expect(store.getState().consolidatedInvoice.rows.length).toBe(230);

    store.dispatch(clearConsolidatedSearch());
    const s = store.getState().consolidatedInvoice;
    expect(s.rows).toHaveLength(20);
    expect(s.hasMore).toBe(true);
    expect(s.search.query).toBe('');
  });

  it('changing filters refetches page 1 with productId, programIds and status filters', async () => {
    mockGetList.mockImplementation(fakeBackend(5));
    const store = setupStore();

    store.dispatch(
      setConsolidatedFilters({
        productIds: ['pid-id', 'df-id'],
        programIds: ['prog-1'],
        invoiceStatuses: ['IN_PROGRESS'],
        adminStatuses: ['VERIFIED'],
      }),
    );
    await waitFor(() => mockGetList.mock.calls.length === 1);
    await waitFor(() => !store.getState().consolidatedInvoice.loading);

    expect(mockGetList).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      productId: ['pid-id', 'df-id'],
      programIds: ['prog-1'],
      byInvoiceStatus: ['IN_PROGRESS'],
      byAdminStatus: ['VERIFIED'],
    });
  });

  it('switching the search field re-filters loaded rows without new requests; clear keeps the field', async () => {
    mockGetList.mockImplementation(fakeBackend(5));
    const store = setupStore();
    store.dispatch(fetchConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loading);

    store.dispatch(searchConsolidatedRequest('INV/0003'));
    await waitFor(() => selectConsolidatedSearchStatus(store.getState()).fullyChecked);
    expect(selectConsolidatedVisibleRows(store.getState()).map(r => r.id)).toEqual([
      'inv-3',
    ]);

    store.dispatch(setConsolidatedSearchField('loanRefNo'));
    expect(selectConsolidatedVisibleRows(store.getState())).toHaveLength(0);
    expect(mockGetList).toHaveBeenCalledTimes(1);

    store.dispatch(clearConsolidatedSearch());
    expect(store.getState().consolidatedInvoice.search.field).toBe('loanRefNo');
  });

  it('keeps loaded rows and stores the error when a fetch fails', async () => {
    mockGetList.mockRejectedValueOnce(new Error('Permission denied'));
    const store = setupStore();

    store.dispatch(fetchConsolidatedRequest());
    await waitFor(() => !store.getState().consolidatedInvoice.loading);

    expect(store.getState().consolidatedInvoice.error).toBe('Permission denied');
    expect(store.getState().consolidatedInvoice.rows).toEqual([]);
  });
});
