import React, {useCallback} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {AppBar, Container, SafeText as Text} from '@components/index';
import {Colors} from '@constants/index';
import {scaleFont} from '@utils/Scale';
import type {ConsolidatedInvoiceRow} from '@store/consolidatedInvoice/consolidatedInvoice.types';
import {CONSOLIDATED_SEARCH_MAX_ROWS} from '@store/consolidatedInvoice/consolidatedInvoice.types';
import {
  SEARCH_FIELD_OPTIONS,
  useConsolidatedInvoices,
} from './useConsolidatedInvoices';
import {ConsolidatedInvoiceCard} from './components/ConsolidatedInvoiceCard';
import {ConsolidatedFilterSheet} from './components/ConsolidatedFilterSheet';
import {ConsolidatedProgramSheet} from './components/ConsolidatedProgramSheet';
import {ConsolidatedInvoiceDetailSheet} from './components/ConsolidatedInvoiceDetailSheet';
import {SearchFieldPicker} from './components/SearchFieldPicker';
import {styles} from './ConsolidatedInvoiceScreen.styles';

export const ConsolidatedInvoiceScreen: React.FC = () => {
  const {
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
    onClearAllFilters,
    onApplyPrograms,
  } = useConsolidatedInvoices();

  const renderItem = useCallback(
    ({item}: {item: ConsolidatedInvoiceRow}) => (
      <ConsolidatedInvoiceCard row={item} onPress={setSelectedRow} />
    ),
    [setSelectedRow],
  );

  const renderSearchBanner = () => {
    if (!searchStatus.active || loading) {
      return null;
    }
    if (searchStatus.error) {
      return (
        <TouchableOpacity
          style={[styles.banner, styles.bannerError]}
          onPress={() => onChangeSearch(searchText)}>
          <Text style={styles.bannerErrorText}>
            Search stopped after {searchStatus.checkedCount} of {total} invoices.
            Tap to retry.
          </Text>
        </TouchableOpacity>
      );
    }
    if (!searchStatus.fullyChecked) {
      return (
        <View style={styles.banner}>
          <ActivityIndicator size="small" color={Colors.primaryColor} />
          <Text style={styles.bannerText}>
            Searching… {searchStatus.checkedCount} of {total} invoices checked
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          {searchStatus.capped
            ? `${rows.length} result${rows.length === 1 ? '' : 's'} in the first ${CONSOLIDATED_SEARCH_MAX_ROWS} of ${total} invoices. Use Program or Filters to narrow down.`
            : `${rows.length} result${rows.length === 1 ? '' : 's'} (all ${total} invoices searched)`}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.loadingText}>Loading invoices…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Could not load invoices</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (searchStatus.active) {
      if (!searchStatus.fullyChecked) {
        return null;
      }
      return (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>No invoice found</Text>
          <Text style={styles.emptyText}>
            {searchStatus.capped
              ? `Searched the first ${CONSOLIDATED_SEARCH_MAX_ROWS} of ${total} invoices.`
              : `Searched all ${total} invoices.`}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onClearSearch}>
            <Text style={styles.primaryButtonText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>No invoices</Text>
        <Text style={styles.emptyText}>
          {activeFilterCount || filters.programIds.length
            ? 'No invoices match the selected filters.'
            : 'There are no invoices to show yet.'}
        </Text>
        {activeFilterCount || filters.programIds.length ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClearAllFilters}>
            <Text style={styles.primaryButtonText}>Clear filters</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <Container>
      <AppBar
        title="Products"
        titleTextStyle={styles.appBarTitle}
        rightContent={
          <View style={styles.appBarTag}>
            <Text style={styles.appBarTagText} numberOfLines={1}>
              Loan Management System
            </Text>
          </View>
        }
        navigation={navigation as any}
      />

      <View style={styles.header}>
        <Text style={styles.pageTitle}>Consolidated Invoice View</Text>
        <View style={styles.countRow}>
          <Text style={styles.headerTitle}>Invoices</Text>
          <View style={styles.countBadge}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primaryColor} />
            ) : (
              <Text style={styles.countText}>{total}</Text>
            )}
          </View>
        </View>
        <View style={styles.scopeRow}>
          <Text style={styles.scopeLabel}>Showing:</Text>
          <TouchableOpacity
            style={styles.scopeChip}
            activeOpacity={0.7}
            onPress={() => setShowFilterSheet(true)}
            accessibilityRole="button"
            accessibilityLabel={`Product: ${productScopeLabel}. Tap to change.`}>
            <Text style={styles.scopeChipText} numberOfLines={1}>
              {productScopeLabel}
            </Text>
          </TouchableOpacity>
          <Text style={styles.scopeDot}>·</Text>
          <TouchableOpacity
            style={styles.scopeChip}
            activeOpacity={0.7}
            onPress={() => setShowProgramSheet(true)}
            accessibilityRole="button"
            accessibilityLabel={`Program: ${programPillLabel}. Tap to change.`}>
            <Text style={styles.scopeChipText} numberOfLines={1}>
              {programPillLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBox}>
        <SearchFieldPicker
          options={SEARCH_FIELD_OPTIONS}
          value={searchFieldOption}
          onChange={onChangeSearchField}
        />
        <FontAwesome6
          name="magnifying-glass"
          iconStyle="solid"
          size={scaleFont(12)}
          color={Colors.graybase}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={onChangeSearch}
          placeholder={searchFieldOption.placeholder}
          placeholderTextColor={Colors.graybase}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchText ? (
          <TouchableOpacity
            onPress={onClearSearch}
            hitSlop={10}
            style={styles.clearIcon}>
            <FontAwesome6
              name="xmark"
              iconStyle="solid"
              size={scaleFont(14)}
              color={Colors.graybase}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.programPill,
            filters.programIds.length > 0 && styles.programPillOn,
          ]}
          activeOpacity={0.7}
          onPress={() => setShowProgramSheet(true)}
          accessibilityRole="button"
          accessibilityLabel={`Program: ${programPillLabel}. Tap to change.`}>
          <FontAwesome6
            name="building-columns"
            iconStyle="solid"
            size={scaleFont(11)}
            color={Colors.primaryColor}
          />
          <Text style={styles.programPillText} numberOfLines={1}>
            {programPillLabel}
          </Text>
          <FontAwesome6
            name="caret-down"
            iconStyle="solid"
            size={scaleFont(11)}
            color={Colors.primaryColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() => setShowFilterSheet(true)}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilterCount ? `, ${activeFilterCount} applied` : ''}`}>
          <FontAwesome6
            name="filter"
            iconStyle="solid"
            size={scaleFont(12)}
            color={Colors.white}
          />
          <Text style={styles.filterButtonText}>Filters</Text>
          {activeFilterCount ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {renderSearchBanner()}

      <FlatList
        data={loading ? EMPTY_ROWS : rows}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primaryColor]}
            tintColor={Colors.primaryColor}
          />
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        windowSize={7}
      />

      <ConsolidatedFilterSheet
        visible={showFilterSheet}
        productOptions={productOptions}
        productCodes={selectedProductCodes}
        invoiceStatuses={filters.invoiceStatuses}
        adminStatuses={filters.adminStatuses}
        onClose={() => setShowFilterSheet(false)}
        onApply={onApplyFilters}
        onClearAll={onClearAllFilters}
      />

      <ConsolidatedProgramSheet
        visible={showProgramSheet}
        groups={programGroups}
        loading={scopeLoading}
        selectedIds={filters.programIds}
        onClose={() => setShowProgramSheet(false)}
        onApply={onApplyPrograms}
      />

      <ConsolidatedInvoiceDetailSheet
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </Container>
  );
};

const EMPTY_ROWS: ConsolidatedInvoiceRow[] = [];

const ListSeparator = () => <View style={styles.separator} />;
