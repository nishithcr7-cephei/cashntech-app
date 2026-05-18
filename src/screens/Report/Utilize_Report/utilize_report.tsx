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
import Toast from 'react-native-toast-message';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {AppBar, Container, ReportFilterModal} from '@components/index';
import {useReportApiFilter} from '@hooks/useReportApiFilter';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter} from '@assets/Icons';
import {matchesReportSearch} from '@utils/reportSearch';
import {fetchUtilizationReportRequest} from '@store/report';
import {
  selectIsUtilizationLoading,
  selectUtilizationError,
  selectUtilizationReportData,
} from '@store/report/report.selector';
import type {UtilizationReportItem} from '@store/report/report.types';

type FieldDef = {
  label: string;
  value: string;
  valueStyle?: object;
};

const INITIAL_PAGE_SIZE = 20;
const LOAD_MORE_SIZE = 20;
const INITIAL_VISIBLE_FIELD_COUNT = 6;

const formatAmount = (val: number | undefined | null): string => {
  if (val == null || Number.isNaN(Number(val))) {
    return '-';
  }
  return `₹ ${Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatText = (val: string | number | undefined | null): string => {
  if (val == null || val === '') {
    return '-';
  }
  return String(val);
};

const formatLoanTenure = (tenure: number): string => {
  if (!tenure || Number.isNaN(tenure)) {
    return '-';
  }
  return `${tenure} Months`;
};

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

const buildAllListFields = (item: UtilizationReportItem): FieldDef[] => [
  {label: 'Anchor Name', value: formatText(item.anchorName)},
  {label: 'Anchor PAN', value: formatText(item.anchorPan)},
  {label: 'Borrower Name', value: formatText(item.borrowerName)},
  {label: 'Borrower PAN', value: formatText(item.borrowerPan)},
  {label: 'LAN', value: formatText(item.lan)},
  {label: 'Program Name', value: formatText(item.programName)},
  {label: 'Program Type', value: formatText(item.programTypeName)},
  {label: 'Master Program Name', value: formatText(item.masterProgramName)},
  {label: 'Finagg LOS ID', value: formatText(item.losid)},
  {label: 'Scheme Type', value: formatText(item.schemetype)},
  {label: 'Loan Account ROI', value: formatText(item.loanaccountroi)},
  {label: 'Loan Tenure', value: formatLoanTenure(item.loanTenure)},
  {label: 'Limit Creation Date', value: formatText(item.limitCreationDate)},
  {label: 'Limit Expiry Date', value: formatText(item.limitExpiryDate)},
  {label: 'Sanctioned Limit', value: formatAmount(item.sanctionedLimit)},
  {label: 'Total Utilized Limit', value: formatAmount(item.totalUtilizedLimit)},
  {label: 'Net Available Limit', value: formatAmount(item.netAvailableLimit)},
  {
    label: 'Total Principal O/S',
    value: formatAmount(item.totalPrincipalOS),
  },
  {label: 'Principal Due', value: formatAmount(item.principalDue)},
  {label: 'Interest O/S', value: formatAmount(item.interestOS)},
  {label: 'Late Payment Due', value: formatAmount(item.latePaymentDue)},
  {label: 'Total Charges Due', value: formatAmount(item.totalChargesDue)},
  {label: 'Total Amount Due', value: formatAmount(item.totalAmountDue)},
  {
    label: 'DPD',
    value: formatText(item.dpd),
    valueStyle:
      item.dpd > 90
        ? {color: Colors.primaryColor, fontFamily: Fonts.GilroySemiBold}
        : undefined,
  },
  {label: 'Generation Date', value: formatText(item.generationDate)},
  {label: 'EOD Date', value: formatText(item.eodDate)},
];

const buildInitialFields = (item: UtilizationReportItem): FieldDef[] =>
  buildAllListFields(item).slice(0, INITIAL_VISIBLE_FIELD_COUNT);

const buildExpandedFields = (item: UtilizationReportItem): FieldDef[] =>
  buildAllListFields(item).slice(INITIAL_VISIBLE_FIELD_COUNT);

function utilizationRowKey(item: UtilizationReportItem, index: number): string {
  return `${item.lan}-${item.losid}-${index}`;
}

export const UtilizationReportScreen: React.FC = () => {
  const navigation = useNavigation<
    CompositeNavigationProp<
      DrawerNavigationProp<HomeNavigatorType>,
      NativeStackNavigationProp<Record<string, object | undefined>>
    >
  >();
  const rows = useSelector(selectUtilizationReportData);
  const loading = useSelector(selectIsUtilizationLoading);
  const error = useSelector(selectUtilizationError);

  const {
    appliedFilters,
    showFilterModal,
    setShowFilterModal,
    handleApplyFilters,
    handleClearAllFilters,
    refetch,
  } = useReportApiFilter(fetchUtilizationReportRequest);

  const [searchText, setSearchText] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  const filteredData = useMemo(() => {
    let data = rows;

    if (searchText.trim()) {
      data = data.filter(item =>
        matchesReportSearch(
          searchText,
          item.lan,
          item.borrowerName,
          item.programName,
          item.losid,
          item.anchorName,
          item.masterProgramName,
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

  const handleExport = () => {
    Toast.show({
      type: 'info',
      text1: 'Export',
      text2: 'Excel export will be available in a future update.',
      visibilityTime: 2500,
    });
  };

  const renderItem: ListRenderItem<UtilizationReportItem> = useCallback(
    ({item, index}) => {
      const rowKey = utilizationRowKey(item, index);
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
    [expandedIds],
  );

  const listHeader = (
    <>
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Utilization Report</Text>
      </View>

      <View style={styles.listToolbar}>
        <View style={styles.searchContainer}>
          <Search width={scaleWidth(18)} height={scaleHeight(18)} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by LAN"
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
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
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
        title="Reporting > Utilization Report"
        navigation={navigation as never}
      />
      <FlatList
        data={paginatedData}
        keyExtractor={(item, index) => utilizationRowKey(item, index)}
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
            <ActivityIndicator
              size="large"
              color={Colors.primaryColor}
              style={styles.loader}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {error
                  ? 'No data to display.'
                  : 'No utilization records found.'}
              </Text>
            </View>
          )
        }
        refreshing={loading}
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
