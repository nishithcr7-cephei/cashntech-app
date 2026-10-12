import {useCallback, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import type {FilterSheetValue} from '@components/FilterSheet/filterSheet.utils';
import {
  applyAlertFilters,
  clearAlertFilters,
  fetchAlertDispatchesRequest,
  fetchAlertFilterOptionsRequest,
} from '@store/riskDashboard/riskDashboard.slice';
import {
  selectActiveAlertFilterCount,
  selectAlertDispatches,
  selectAlertFilterOptions,
} from '@store/riskDashboard/riskDashboard.selector';
import type {FetchMode} from '@store/riskDashboard/riskDashboard.types';
import {getIsBankUserType} from '@store/user/user.selector';
import {useRefetchOnFocus} from '../useRefetchOnFocus';
import {
  AlertFilterKey,
  alertFiltersToSheetValue,
  buildAlertFilterChips,
  buildAlertFilterGroups,
  filterAlertRows,
  removeAlertFilter,
  sheetValueToAlertFilters,
} from './alertFilters';

export const useAlertDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const slot = useSelector(selectAlertDispatches);
  const filterOptions = useSelector(selectAlertFilterOptions);
  const activeFilterCount = useSelector(selectActiveAlertFilterCount);
  const isBankUser = useSelector(getIsBankUserType);

  const [search, setSearch] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchData = useCallback(
    (mode?: FetchMode) => dispatch(fetchAlertDispatchesRequest(mode)),
    [dispatch],
  );
  useRefetchOnFocus(slot, fetchData);

  const allRows = useMemo(() => slot.data ?? [], [slot.data]);
  const rows = useMemo(() => filterAlertRows(allRows, search), [allRows, search]);

  const filterGroups = useMemo(
    () =>
      buildAlertFilterGroups({
        banks: filterOptions.banks,
        programs: filterOptions.programs,
        loading: filterOptions.loading,
        isBankUser,
      }),
    [filterOptions.banks, filterOptions.programs, filterOptions.loading, isBankUser],
  );

  const sheetValue = useMemo(
    () => alertFiltersToSheetValue(slot.filters),
    [slot.filters],
  );

  const filterChips = useMemo(
    () =>
      buildAlertFilterChips(slot.filters, filterOptions.banks, filterOptions.programs),
    [slot.filters, filterOptions.banks, filterOptions.programs],
  );

  /** Dropdown data is fetched once per session (on first filter-sheet open). */
  const openFilters = useCallback(() => {
    if (!filterOptions.loaded && !filterOptions.loading) {
      dispatch(fetchAlertFilterOptionsRequest());
    }
    setSheetVisible(true);
  }, [dispatch, filterOptions.loaded, filterOptions.loading]);

  const closeFilters = useCallback(() => setSheetVisible(false), []);

  const onApplyFilters = useCallback(
    (draft: FilterSheetValue) => {
      setSheetVisible(false);
      dispatch(applyAlertFilters(sheetValueToAlertFilters(draft, isBankUser)));
    },
    [dispatch, isBankUser],
  );

  const onClearFilters = useCallback(() => {
    setSheetVisible(false);
    dispatch(clearAlertFilters());
  }, [dispatch]);

  const onRemoveFilter = useCallback(
    (key: AlertFilterKey) => {
      dispatch(applyAlertFilters(removeAlertFilter(slot.filters, key)));
    },
    [dispatch, slot.filters],
  );

  const onRefresh = useCallback(() => {
    dispatch(fetchAlertDispatchesRequest({refresh: true}));
  }, [dispatch]);

  const onRetry = useCallback(() => {
    dispatch(fetchAlertDispatchesRequest());
  }, [dispatch]);

  return {
    navigation,
    rows,
    totalCount: allRows.length,
    search,
    setSearch,
    activeFilterCount,
    filterGroups,
    sheetValue,
    filterChips,
    sheetVisible,
    loading: slot.loading || (!slot.data && !slot.error),
    refreshing: slot.refreshing,
    updating: slot.updating,
    error: slot.error,
    openFilters,
    closeFilters,
    onApplyFilters,
    onClearFilters,
    onRemoveFilter,
    onRefresh,
    onRetry,
  };
};
