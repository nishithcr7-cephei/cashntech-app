import {useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {
  selectActiveProductCode,
  selectAvailableProducts,
} from '@store/product/product.selectors';
import {
  getProductFullDisplayName,
  getProductNavLabel,
  uniqueProductsByCode,
} from '@store/product/product.resolver';
import {ProductCode} from '@store/product/product.types';
import {
  selectScopeData,
  selectScopeLoading,
} from '@store/programSelection/programSelection.selector';
import {fetchUserScopeRequest} from '@store/programSelection/programSelection.slice';
import {
  clearConsolidatedSearch,
  fetchConsolidatedRequest,
  loadMoreConsolidatedRequest,
  searchConsolidatedRequest,
  setConsolidatedFilters,
  setConsolidatedSearchField,
} from '@store/consolidatedInvoice/consolidatedInvoice.slice';
import {
  selectConsolidatedError,
  selectConsolidatedFilters,
  selectConsolidatedHasLoaded,
  selectConsolidatedLoading,
  selectConsolidatedLoadingMore,
  selectConsolidatedRefreshing,
  selectConsolidatedSearchField,
  selectConsolidatedSearchStatus,
  selectConsolidatedTotal,
  selectConsolidatedVisibleRows,
} from '@store/consolidatedInvoice/consolidatedInvoice.selector';
import {
  initialConsolidatedFilters,
  type ConsolidatedInvoiceFilters,
  type ConsolidatedInvoiceRow,
  type ConsolidatedSearchField,
} from '@store/consolidatedInvoice/consolidatedInvoice.types';
import {
  buildConsolidatedProgramGroups,
  collectProgramIds,
} from '@utils/consolidatedProgramOptions';
import {resolveDefaultConsolidatedFilters} from '@utils/consolidatedDefaultFilters';

export type ConsolidatedProductOption = {
  code: ProductCode;
  label: string;
  productIds: string[];
};

export type ConsolidatedStatusFilterDraft = {
  productCodes: ProductCode[];
  invoiceStatuses: string[];
  adminStatuses: string[];
};

export const SEARCH_FIELD_OPTIONS: {
  value: ConsolidatedSearchField;
  label: string;
  shortLabel: string;
  placeholder: string;
}[] = [
  {
    value: 'invoiceNo',
    label: 'Invoice No',
    shortLabel: 'Invoice No',
    placeholder: 'Search by invoice no',
  },
  {
    value: 'loanRefNo',
    label: 'Loan Ref No',
    shortLabel: 'Loan Ref',
    placeholder: 'Search by loan ref no',
  },
  {
    value: 'programName',
    label: 'Program Name',
    shortLabel: 'Program',
    placeholder: 'Search by program name',
  },
];

export const useConsolidatedInvoices = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const activeProductCode = useSelector(selectActiveProductCode);
  const availableProducts = useSelector(selectAvailableProducts);
  const scopeData = useSelector(selectScopeData);
  const scopeLoading = useSelector(selectScopeLoading);
  const rows = useSelector(selectConsolidatedVisibleRows);
  const total = useSelector(selectConsolidatedTotal);
  const fetching = useSelector(selectConsolidatedLoading);
  const hasLoaded = useSelector(selectConsolidatedHasLoaded);
  const loadingMore = useSelector(selectConsolidatedLoadingMore);
  const refreshing = useSelector(selectConsolidatedRefreshing);
  const error = useSelector(selectConsolidatedError);
  const filters = useSelector(selectConsolidatedFilters);
  const searchStatus = useSelector(selectConsolidatedSearchStatus);
  const searchField = useSelector(selectConsolidatedSearchField);

  /** Full-list loader: first open (before any response) and every filter/program change. */
  const loading = fetching || (!hasLoaded && !error);

  const [searchText, setSearchText] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showProgramSheet, setShowProgramSheet] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ConsolidatedInvoiceRow | null>(
    null,
  );

  useEffect(() => {
    if (!scopeData && !scopeLoading) {
      dispatch(fetchUserScopeRequest());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A product can appear once per bank in scope; collect every id for its code.
  const productOptions = useMemo<ConsolidatedProductOption[]>(
    () =>
      uniqueProductsByCode(availableProducts).map(product => ({
        code: product.code,
        label: getProductFullDisplayName(product),
        productIds: [
          ...new Set(
            availableProducts
              .filter(p => p.code === product.code && p.id)
              .map(p => p.id),
          ),
        ],
      })),
    [availableProducts],
  );

  const codesToIds = useCallback(
    (codes: ProductCode[]) =>
      productOptions
        .filter(option => codes.includes(option.code))
        .flatMap(option => option.productIds),
    [productOptions],
  );

  const selectedProductCodes = useMemo<ProductCode[]>(
    () =>
      productOptions
        .filter(
          option =>
            option.productIds.length > 0 &&
            option.productIds.every(id => filters.productIds.includes(id)),
        )
        .map(option => option.code),
    [filters.productIds, productOptions],
  );

  const programGroups = useMemo(
    () =>
      buildConsolidatedProgramGroups(
        scopeData,
        filters.productIds,
        selectedProductCodes,
      ),
    [scopeData, filters.productIds, selectedProductCodes],
  );

  /** Drops picked programs that no longer belong to the selected products. */
  const applyFilters = useCallback(
    (next: Omit<ConsolidatedInvoiceFilters, 'programIds'>, programIds: string[]) => {
      const nextCodes = productOptions
        .filter(option => option.productIds.some(id => next.productIds.includes(id)))
        .map(option => option.code);
      const allowed = collectProgramIds(
        buildConsolidatedProgramGroups(scopeData, next.productIds, nextCodes),
      );
      dispatch(
        setConsolidatedFilters({
          ...next,
          programIds: programIds.filter(id => allowed.has(id)),
        }),
      );
    },
    [dispatch, productOptions, scopeData],
  );

  // First open in a workspace defaults to the active product. Product switch and
  // logout reset the slice (hasLoaded=false), so the new active product applies;
  // returning to the screen keeps whatever the user picked.
  const productsReady = productOptions.length > 0 || !activeProductCode;
  useEffect(() => {
    if (hasLoaded || fetching || error || !productsReady) {
      return;
    }
    dispatch(
      setConsolidatedFilters(
        resolveDefaultConsolidatedFilters(activeProductCode, productOptions),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, productsReady, activeProductCode]);

  const onChangeSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      if (text.trim()) {
        dispatch(searchConsolidatedRequest(text));
      } else {
        dispatch(clearConsolidatedSearch());
      }
    },
    [dispatch],
  );

  const onClearSearch = useCallback(() => {
    setSearchText('');
    dispatch(clearConsolidatedSearch());
  }, [dispatch]);

  const onChangeSearchField = useCallback(
    (field: ConsolidatedSearchField) => {
      dispatch(setConsolidatedSearchField(field));
    },
    [dispatch],
  );

  const onRefresh = useCallback(() => {
    dispatch(fetchConsolidatedRequest({refresh: true}));
  }, [dispatch]);

  const onRetry = useCallback(() => {
    dispatch(fetchConsolidatedRequest());
  }, [dispatch]);

  const onEndReached = useCallback(() => {
    if (!searchStatus.active) {
      dispatch(loadMoreConsolidatedRequest());
    }
  }, [dispatch, searchStatus.active]);

  const onApplyFilters = useCallback(
    (draft: ConsolidatedStatusFilterDraft) => {
      setShowFilterSheet(false);
      applyFilters(
        {
          productIds: codesToIds(draft.productCodes),
          invoiceStatuses: draft.invoiceStatuses,
          adminStatuses: draft.adminStatuses,
        },
        filters.programIds,
      );
    },
    [applyFilters, codesToIds, filters.programIds],
  );

  const onShowAllProducts = useCallback(() => {
    applyFilters({...filters, productIds: []}, filters.programIds);
  }, [applyFilters, filters]);

  const onClearAllFilters = useCallback(() => {
    setShowFilterSheet(false);
    dispatch(setConsolidatedFilters(initialConsolidatedFilters));
  }, [dispatch]);

  const onApplyPrograms = useCallback(
    (programIds: string[]) => {
      setShowProgramSheet(false);
      dispatch(setConsolidatedFilters({...filters, programIds}));
    },
    [dispatch, filters],
  );

  const activeFilterCount =
    (filters.productIds.length ? 1 : 0) +
    (filters.invoiceStatuses.length ? 1 : 0) +
    (filters.adminStatuses.length ? 1 : 0);

  const programPillLabel = useMemo(() => {
    if (!filters.programIds.length) {
      return 'All Programs';
    }
    if (filters.programIds.length > 1) {
      return `${filters.programIds.length} Programs`;
    }
    const id = filters.programIds[0];
    for (const group of programGroups) {
      const match = group.programs.find(program => program.id === id);
      if (match) {
        return match.name;
      }
    }
    return '1 Program';
  }, [filters.programIds, programGroups]);

  const productScopeLabel = useMemo(() => {
    if (!selectedProductCodes.length) {
      return 'All Products';
    }
    return selectedProductCodes.map(code => getProductNavLabel(code)).join(', ');
  }, [selectedProductCodes]);

  const searchFieldOption =
    SEARCH_FIELD_OPTIONS.find(option => option.value === searchField) ??
    SEARCH_FIELD_OPTIONS[0];

  return {
    navigation,
    rows,
    total,
    loading,
    loadingMore,
    refreshing,
    error,
    filters,
    searchStatus,
    searchText,
    searchFieldOption,
    productOptions,
    selectedProductCodes,
    programGroups,
    scopeLoading,
    programPillLabel,
    productScopeLabel,
    activeFilterCount,
    showFilterSheet,
    setShowFilterSheet,
    showProgramSheet,
    setShowProgramSheet,
    selectedRow,
    setSelectedRow,
    onChangeSearch,
    onClearSearch,
    onChangeSearchField,
    onRefresh,
    onRetry,
    onEndReached,
    onApplyFilters,
    onShowAllProducts,
    onClearAllFilters,
    onApplyPrograms,
  };
};
