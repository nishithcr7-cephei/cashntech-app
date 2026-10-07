import {createSelector} from '@reduxjs/toolkit';
import {matchesConsolidatedSearch} from '@utils/normalizeConsolidatedInvoice';
import {
  CONSOLIDATED_SEARCH_MAX_ROWS,
  CONSOLIDATED_SEARCH_MIN_CHARS,
  ConsolidatedInvoiceState,
} from './consolidatedInvoice.types';

export const selectConsolidatedState = (state: any): ConsolidatedInvoiceState =>
  state.consolidatedInvoice;

export const selectConsolidatedRows = createSelector(
  [selectConsolidatedState],
  s => s.rows,
);
export const selectConsolidatedTotal = createSelector(
  [selectConsolidatedState],
  s => s.total,
);
export const selectConsolidatedLoading = createSelector(
  [selectConsolidatedState],
  s => s.loading,
);
export const selectConsolidatedLoadingMore = createSelector(
  [selectConsolidatedState],
  s => s.loadingMore,
);
export const selectConsolidatedRefreshing = createSelector(
  [selectConsolidatedState],
  s => s.refreshing,
);
export const selectConsolidatedHasMore = createSelector(
  [selectConsolidatedState],
  s => s.hasMore,
);
/** False until page 1 has arrived at least once (page resets to 0 on reset/logout). */
export const selectConsolidatedHasLoaded = createSelector(
  [selectConsolidatedState],
  s => s.page > 0,
);
export const selectConsolidatedError = createSelector(
  [selectConsolidatedState],
  s => s.error,
);
export const selectConsolidatedFilters = createSelector(
  [selectConsolidatedState],
  s => s.filters,
);
export const selectConsolidatedSearch = createSelector(
  [selectConsolidatedState],
  s => s.search,
);

const selectActiveQuery = createSelector([selectConsolidatedSearch], search => {
  const q = search.query.trim();
  return q.length >= CONSOLIDATED_SEARCH_MIN_CHARS ? q : '';
});

export const selectConsolidatedSearchField = createSelector(
  [selectConsolidatedSearch],
  search => search.field,
);

/** Rows to render: all loaded rows, or the search matches among them. */
export const selectConsolidatedVisibleRows = createSelector(
  [selectConsolidatedRows, selectActiveQuery, selectConsolidatedSearchField],
  (rows, query, field) =>
    query
      ? rows.filter(row => matchesConsolidatedSearch(row, query, field))
      : rows,
);

/**
 * `fullyChecked` is derived from data, not timing: "No invoice found" may only
 * be shown once every row the search can reach has been loaded.
 */
export const selectConsolidatedSearchStatus = createSelector(
  [selectConsolidatedState, selectActiveQuery],
  (s, query) => {
    const reachable = Math.min(s.total, CONSOLIDATED_SEARCH_MAX_ROWS);
    const fullyChecked = !s.hasMore || s.rows.length >= reachable;
    return {
      active: !!query,
      isScanning: s.search.isScanning,
      fullyChecked,
      checkedCount: Math.min(s.rows.length, s.total),
      total: s.total,
      capped: s.total > CONSOLIDATED_SEARCH_MAX_ROWS && s.rows.length >= reachable,
      error: s.search.error,
    };
  },
);
