import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {AppBar, Container, ReportFilterModal, SkeletonList} from '@components/index';
import {useReportApiFilter} from '@hooks/useReportApiFilter';
import {useReportColumns} from '@hooks/useReportColumns';
import {useReportExport} from '@hooks/useReportExport';
import {buildReportFields} from '@products/shared/schemas/reports/reportFieldBuilder';
import {loanStatusFieldAccessor} from '@products/shared/schemas/reports/accessors/loanStatusFieldAccessor';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter} from '@assets/Icons';
import {matchesReportSearch} from '@utils/reportSearch';
import {fetchLoanStatusReportRequest} from '@store/report';
import {
  selectIsLoanStatusLoading,
  selectLoanStatusError,
  selectLoanStatusReportData,
} from '@store/report/report.selector';
import type {LoanStatusReportItem} from '@store/report/report.types';

type FieldDef = {
  label: string;
  value: string;
  valueStyle?: object;
};

const INITIAL_PAGE_SIZE = 20;
const LOAD_MORE_SIZE = 20;
const INITIAL_VISIBLE_FIELD_COUNT = 6;

const InfoFieldGrid: React.FC<{fields: FieldDef[]}> = ({fields}) => (
  <View style={styles.infoGrid}>
    {fields.map(field => (
      <View key={field.label} style={styles.infoColumn}>
        <Text style={styles.infoLabel}>{field.label}</Text>
        <Text style={[styles.infoValue, field.valueStyle]} numberOfLines={3}>
          {field.value}
        </Text>
      </View>
    ))}
  </View>
);

function loanStatusRowKey(item: LoanStatusReportItem, index: number): string {
  return `${item.loanAccNo}-${item.borrowerCifNo}-${index}`;
}

export const LoanStatusReportScreen: React.FC = () => {
  const navigation = useNavigation<
    CompositeNavigationProp<
      DrawerNavigationProp<HomeNavigatorType>,
      NativeStackNavigationProp<Record<string, object | undefined>>
    >
  >();
  const rows = useSelector(selectLoanStatusReportData);
  const loading = useSelector(selectIsLoanStatusLoading);
  const error = useSelector(selectLoanStatusError);

  const {
    appliedFilters,
    showFilterModal,
    setShowFilterModal,
    handleApplyFilters,
    handleClearAllFilters,
    refetch,
  } = useReportApiFilter(fetchLoanStatusReportRequest);

  const [searchText, setSearchText] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const {screenColumns, exportColumns} = useReportColumns('loanStatus');

  const buildAllListFields = useCallback(
    (item: LoanStatusReportItem) =>
      buildReportFields(item, screenColumns, loanStatusFieldAccessor),
    [screenColumns],
  );

  const buildInitialFields = useCallback(
    (item: LoanStatusReportItem) =>
      buildAllListFields(item).slice(0, INITIAL_VISIBLE_FIELD_COUNT),
    [buildAllListFields],
  );

  const buildExpandedFields = useCallback(
    (item: LoanStatusReportItem) =>
      buildAllListFields(item).slice(INITIAL_VISIBLE_FIELD_COUNT),
    [buildAllListFields],
  );

  const filteredData = useMemo(() => {
    let data = rows;

    if (searchText.trim()) {
      data = data.filter(item =>
        matchesReportSearch(
          searchText,
          item.loanAccNo,
          item.borrowerName,
          item.programName,
          item.anchorName,
          item.borrowerCifNo,
        ),
      );
    }

    return data;
  }, [rows, searchText]);

  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [searchText, rows]);

  const paginatedData = useMemo(
    () => filteredData.slice(0, visibleCount),
    [filteredData, visibleCount],
  );

  const hasMore = visibleCount < filteredData.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev =>
      Math.min(prev + LOAD_MORE_SIZE, filteredData.length),
    );
  }, [filteredData.length]);

  const toggleExpanded = (rowKey: string) => {
    setExpandedIds(prev => ({...prev, [rowKey]: !prev[rowKey]}));
  };

  const {handleExport, exporting} = useReportExport({
    reportTitle: 'Loan Status Report',
    filename: 'loan-status-report',
    columns: exportColumns,
    getExportRows: () => filteredData,
    appliedFilters,
  });

  const renderItem: ListRenderItem<LoanStatusReportItem> = useCallback(
    ({item, index}) => {
      const rowKey = loanStatusRowKey(item, index);
      const isExpanded = !!expandedIds[rowKey];

      return (
        <View style={styles.cardWrapper}>
          <View style={styles.listCard}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <InfoFieldGrid fields={buildInitialFields(item)} />
            {isExpanded ? (
              <View style={styles.expandedSection}>
                <InfoFieldGrid fields={buildExpandedFields(item)} />
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpanded(rowKey)}
              activeOpacity={0.7}>
              <Text style={styles.expandButtonText}>
                {isExpanded ? 'View Less' : 'View More'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [buildExpandedFields, buildInitialFields, expandedIds],
  );

  const listHeader = (
    <>
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Loan Status Report</Text>
      </View>

      <View style={styles.listToolbar}>
        <View style={styles.searchContainer}>
          <Search width={scaleWidth(18)} height={scaleHeight(18)} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by loan account no."
            placeholderTextColor={Colors.graybase}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}>
          <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportButton, exporting && {opacity: 0.6}]}
          onPress={handleExport}
          disabled={exporting}>
          <FontAwesome6
            name="file-excel"
            iconStyle="solid"
            color={Colors.white}
            size={scaleFont(16)}
          />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recordsHeader}>
        <Text style={styles.recordsLabel}>Report</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{filteredData.length}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );

  return (
    <Container>
      <AppBar
        title="Reporting > Loan Status Report"
        navigation={navigation as never}
      />
      <FlatList
        data={paginatedData}
        keyExtractor={(item, index) => loanStatusRowKey(item, index)}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{height: scaleHeight(12)}} />}
        initialNumToRender={INITIAL_PAGE_SIZE}
        maxToRenderPerBatch={LOAD_MORE_SIZE}
        windowSize={5}
        onEndReached={!loading && hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          !loading && hasMore ? (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonList variant="grid" count={4} style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {error
                  ? 'No data to display.'
                  : 'No loan status records found.'}
              </Text>
            </View>
          )
        }
        refreshing={loading && filteredData.length > 0}
        onRefresh={refetch}
      />

      <ReportFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        onClearAll={handleClearAllFilters}
        appliedFilters={appliedFilters}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    marginBottom: scaleHeight(8),
    marginHorizontal: -scaleWidth(16),
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(6),
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(13),
    color: Colors.darkblack,
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(4),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#217346',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(4),
  },
  exportButtonText: {
    color: Colors.white,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  recordsLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  badge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  errorText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.primaryColor,
    marginBottom: scaleHeight(8),
  },
  cardWrapper: {
    position: 'relative',
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  indexBadge: {
    backgroundColor: '#F7F8FB',
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  indexText: {
    color: Colors.graybase,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
  },
  loadMoreFooter: {
    paddingVertical: scaleHeight(16),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  loadMoreText: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  infoColumn: {
    width: '47%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(12),
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  expandedSection: {
    marginTop: scaleHeight(12),
  },
  expandButton: {
    marginTop: scaleHeight(12),
    alignItems: 'center',
    paddingVertical: scaleHeight(4),
  },
  expandButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  loader: {
    marginTop: scaleHeight(24),
  },
  emptyState: {
    paddingVertical: scaleHeight(32),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
