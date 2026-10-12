import {useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {fetchBorrowerRiskRequest} from '@store/riskDashboard/riskDashboard.slice';
import {selectBorrowerRisk} from '@store/riskDashboard/riskDashboard.selector';
import type {FetchMode} from '@store/riskDashboard/riskDashboard.types';
import {useRefetchOnFocus} from '../useRefetchOnFocus';
import {
  buildRiskCategoryChips,
  filterBorrowers,
  RiskCategoryChip,
} from './borrowerFilters';

export const useBorrowerRisk = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const slot = useSelector(selectBorrowerRisk);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RiskCategoryChip>('');

  const fetchData = useCallback(
    (mode?: FetchMode) => dispatch(fetchBorrowerRiskRequest(mode)),
    [dispatch],
  );
  useRefetchOnFocus(slot, fetchData);

  const allRows = useMemo(() => slot.data ?? [], [slot.data]);
  const categoryChips = useMemo(() => buildRiskCategoryChips(allRows), [allRows]);

  // A refresh can empty the selected category; fall back to "All".
  useEffect(() => {
    if (category && !categoryChips.some(chip => chip.value === category)) {
      setCategory('');
    }
  }, [category, categoryChips]);

  const rows = useMemo(
    () => filterBorrowers(allRows, search, category),
    [allRows, search, category],
  );

  const onRefresh = useCallback(() => {
    dispatch(fetchBorrowerRiskRequest({refresh: true}));
  }, [dispatch]);

  const onRetry = useCallback(() => {
    dispatch(fetchBorrowerRiskRequest());
  }, [dispatch]);

  return {
    navigation,
    rows,
    totalCount: allRows.length,
    search,
    setSearch,
    category,
    setCategory,
    categoryChips,
    isFiltered: !!search.trim() || !!category,
    loading: slot.loading || (!slot.data && !slot.error),
    refreshing: slot.refreshing,
    updating: slot.updating,
    error: slot.error,
    onRefresh,
    onRetry,
  };
};
