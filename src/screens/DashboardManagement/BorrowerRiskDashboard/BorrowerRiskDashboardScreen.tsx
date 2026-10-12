import React, {useCallback} from 'react';
import type {BorrowerRiskRow} from '@store/riskDashboard/riskDashboard.types';
import {DashboardShell} from '../components/DashboardShell';
import {FilterChips} from '../components/FilterChips';
import {RiskSearchBox} from '../components/RiskSearchBox';
import {BorrowerRiskCard} from './BorrowerRiskCard';
import {useBorrowerRisk} from './useBorrowerRisk';

const keyExtractor = (row: BorrowerRiskRow) => row.distributorId;

export const BorrowerRiskDashboardScreen: React.FC = () => {
  const {
    navigation,
    rows,
    totalCount,
    search,
    setSearch,
    category,
    setCategory,
    categoryChips,
    isFiltered,
    loading,
    refreshing,
    updating,
    error,
    onRefresh,
    onRetry,
  } = useBorrowerRisk();

  const renderItem = useCallback(
    ({item}: {item: BorrowerRiskRow}) => <BorrowerRiskCard row={item} />,
    [],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategory('');
  }, [setSearch, setCategory]);

  return (
    <DashboardShell
      navigation={navigation}
      title="Borrower Risk Dashboard"
      count={isFiltered ? rows.length : totalCount}
      loading={loading}
      refreshing={refreshing}
      updating={updating}
      error={error}
      isEmpty={!rows.length}
      emptyText={
        isFiltered ? 'No distributors match your search' : 'No distributors with exposure'
      }
      emptyAction={isFiltered ? {label: 'Clear filters', onPress: clearFilters} : undefined}
      onRefresh={onRefresh}
      onRetry={onRetry}
      toolbar={
        totalCount ? (
          <>
            <RiskSearchBox
              value={search}
              onChangeText={setSearch}
              placeholder="Search distributor name"
            />
            <FilterChips options={categoryChips} value={category} onChange={setCategory} />
          </>
        ) : null
      }
      list={{data: rows, renderItem, keyExtractor}}
    />
  );
};
