import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  CONSOLIDATED_PAGE_SIZE,
  CONSOLIDATED_SEARCH_MIN_CHARS,
  ConsolidatedInvoiceFilters,
  ConsolidatedInvoiceRow,
  ConsolidatedSearchField,
  initialConsolidatedInvoiceState,
  initialConsolidatedSearch,
} from './consolidatedInvoice.types';

type RowsPayload = {rows: ConsolidatedInvoiceRow[]; total: number};

const consolidatedInvoiceSlice = createSlice({
  name: 'consolidatedInvoice',
  initialState: initialConsolidatedInvoiceState,
  reducers: {
    /** Page 1, replaces the list. `refresh` drives the pull-to-refresh spinner. */
    fetchConsolidatedRequest: (
      state,
      action: PayloadAction<{refresh?: boolean} | undefined>,
    ) => {
      const refresh = !!action.payload?.refresh;
      state.loading = !refresh;
      state.refreshing = refresh;
      state.error = null;
      state.search.isScanning = false;
      state.search.error = null;
    },
    fetchConsolidatedSuccess: (state, action: PayloadAction<RowsPayload>) => {
      state.rows = action.payload.rows;
      state.total = action.payload.total;
      state.page = 1;
      state.hasMore = state.rows.length < state.total;
      state.loading = false;
      state.refreshing = false;
    },
    fetchConsolidatedFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.refreshing = false;
      state.error = action.payload;
    },

    /** Ignored unless another page exists and nothing else is loading. */
    loadMoreConsolidatedRequest: state => {
      if (
        state.hasMore &&
        !state.loading &&
        !state.refreshing &&
        !state.loadingMore &&
        !state.search.isScanning
      ) {
        state.loadingMore = true;
      }
    },
    loadMoreConsolidatedFinished: state => {
      state.loadingMore = false;
    },

    /** Appends a page; drops ids already in the list (rows can shift between pages). */
    appendConsolidatedRows: (state, action: PayloadAction<RowsPayload>) => {
      const seen = new Set(state.rows.map(row => row.id));
      for (const row of action.payload.rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          state.rows.push(row);
        }
      }
      state.total = action.payload.total;
      state.page = Math.ceil(state.rows.length / CONSOLIDATED_PAGE_SIZE);
      state.hasMore = state.rows.length < state.total;
    },

    setConsolidatedFilters: (
      state,
      action: PayloadAction<ConsolidatedInvoiceFilters>,
    ) => {
      state.filters = action.payload;
      state.search.isScanning = false;
      // Saga refetches page 1 right after; show the loader without waiting a tick.
      state.loading = true;
      state.error = null;
    },

    searchConsolidatedRequest: (state, action: PayloadAction<string>) => {
      state.search.query = action.payload;
      state.search.error = null;
      state.search.capped = false;
      if (action.payload.trim().length < CONSOLIDATED_SEARCH_MIN_CHARS) {
        state.search.isScanning = false;
      }
    },
    consolidatedSearchProgress: (
      state,
      action: PayloadAction<{
        isScanning: boolean;
        checkedCount: number;
        capped: boolean;
      }>,
    ) => {
      state.search.isScanning = action.payload.isScanning;
      state.search.checkedCount = action.payload.checkedCount;
      state.search.capped = action.payload.capped;
    },
    consolidatedSearchFailure: (state, action: PayloadAction<string>) => {
      state.search.isScanning = false;
      state.search.error = action.payload;
    },
    /** Only changes which loaded field is matched; the scan covers every field. */
    setConsolidatedSearchField: (
      state,
      action: PayloadAction<ConsolidatedSearchField>,
    ) => {
      state.search.field = action.payload;
    },
    /** Back to the first page in memory — no refetch needed, rows are already ordered. */
    clearConsolidatedSearch: state => {
      state.search = {...initialConsolidatedSearch, field: state.search.field};
      if (state.rows.length > CONSOLIDATED_PAGE_SIZE) {
        state.rows = state.rows.slice(0, CONSOLIDATED_PAGE_SIZE);
        state.page = 1;
      }
      state.hasMore = state.rows.length < state.total;
    },

    resetConsolidatedState: () => initialConsolidatedInvoiceState,
  },
});

export const {
  fetchConsolidatedRequest,
  fetchConsolidatedSuccess,
  fetchConsolidatedFailure,
  loadMoreConsolidatedRequest,
  loadMoreConsolidatedFinished,
  appendConsolidatedRows,
  setConsolidatedFilters,
  searchConsolidatedRequest,
  consolidatedSearchProgress,
  consolidatedSearchFailure,
  setConsolidatedSearchField,
  clearConsolidatedSearch,
  resetConsolidatedState,
} = consolidatedInvoiceSlice.actions;

export default consolidatedInvoiceSlice.reducer;
