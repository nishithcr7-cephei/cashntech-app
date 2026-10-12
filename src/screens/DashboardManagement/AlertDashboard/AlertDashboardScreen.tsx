import React, {useCallback} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {FilterSheet} from '@components/FilterSheet/FilterSheet';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import type {AlertDispatchRow} from '@store/riskDashboard/riskDashboard.types';
import {DashboardShell} from '../components/DashboardShell';
import {RiskSearchBox} from '../components/RiskSearchBox';
import {AlertCard} from './AlertCard';
import {useAlertDashboard} from './useAlertDashboard';

const keyExtractor = (row: AlertDispatchRow) => row.id;

export const AlertDashboardScreen: React.FC = () => {
  const {
    navigation,
    rows,
    totalCount,
    search,
    setSearch,
    activeFilterCount,
    filterGroups,
    sheetValue,
    filterChips,
    sheetVisible,
    loading,
    refreshing,
    updating,
    error,
    openFilters,
    closeFilters,
    onApplyFilters,
    onClearFilters,
    onRemoveFilter,
    onRefresh,
    onRetry,
  } = useAlertDashboard();

  const renderItem = useCallback(
    ({item}: {item: AlertDispatchRow}) => <AlertCard row={item} />,
    [],
  );

  const hasFilters = activeFilterCount > 0;
  const emptyText = search
    ? 'No alerts match your search'
    : hasFilters
      ? 'No alerts match the selected filters'
      : 'No alerts raised yet';

  const toolbar = (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <RiskSearchBox
            value={search}
            onChangeText={setSearch}
            placeholder="Search party, program or trigger"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={openFilters}
          accessibilityRole="button"
          accessibilityLabel={`Filters${hasFilters ? `, ${activeFilterCount} applied` : ''}`}>
          <FontAwesome6
            name="filter"
            iconStyle="solid"
            size={scaleFont(12)}
            color={Colors.white}
          />
          <Text style={styles.filterButtonText}>Filters</Text>
          {hasFilters ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
      {filterChips.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled">
          {filterChips.map(chip => (
            <TouchableOpacity
              key={chip.key}
              style={styles.chip}
              activeOpacity={0.7}
              onPress={() => onRemoveFilter(chip.key)}
              accessibilityRole="button"
              accessibilityLabel={`Remove filter ${chip.label}`}>
              <Text style={styles.chipText} numberOfLines={1}>
                {chip.label}
              </Text>
              <FontAwesome6
                name="xmark"
                iconStyle="solid"
                size={scaleFont(10)}
                color={Colors.darkblack}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </>
  );

  return (
    <>
      <DashboardShell
        navigation={navigation}
        title="Alert Dashboard"
        count={search ? rows.length : totalCount}
        loading={loading}
        refreshing={refreshing}
        updating={updating}
        error={error}
        isEmpty={!rows.length}
        emptyText={emptyText}
        emptyAction={
          hasFilters && !search
            ? {label: 'Clear filters', onPress: onClearFilters}
            : undefined
        }
        onRefresh={onRefresh}
        onRetry={onRetry}
        toolbar={toolbar}
        list={{data: rows, renderItem, keyExtractor}}
      />
      <FilterSheet
        visible={sheetVisible}
        title="Alert filters"
        groups={filterGroups}
        value={sheetValue}
        onClose={closeFilters}
        onApply={onApplyFilters}
        onClearAll={onClearFilters}
      />
    </>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  searchBox: {
    flex: 1,
    marginRight: scaleWidth(8),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    height: scaleHeight(36),
    paddingHorizontal: scaleWidth(14),
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.primaryColor,
  },
  filterButtonText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  filterCount: {
    position: 'absolute',
    top: -scaleHeight(5),
    right: -scaleWidth(5),
    minWidth: scaleWidth(18),
    height: scaleWidth(18),
    borderRadius: scaleWidth(9),
    paddingHorizontal: scaleWidth(4),
    backgroundColor: Colors.darkblack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyBold,
    color: Colors.white,
  },
  chipRow: {
    paddingBottom: scaleHeight(10),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    maxWidth: scaleWidth(220),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(5),
    marginRight: scaleWidth(8),
    borderRadius: scaleWidth(14),
    borderWidth: 1,
    borderColor: '#DDE1E6',
    backgroundColor: '#F1F3F5',
  },
  chipText: {
    flexShrink: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
});
