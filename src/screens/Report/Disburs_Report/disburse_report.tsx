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
import {useReportExport} from '@hooks/useReportExport';
import {DISBURSEMENT_EXPORT_COLUMNS} from '@utils/reportExportColumns';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter} from '@assets/Icons';
import {matchesReportSearch} from '@utils/reportSearch';
import {fetchDisbursementReportRequest} from '@store/report';
import {
  selectDisbursementReportData,
  selectDisbursementError,
  selectIsDisbursementLoading,
} from '@store/report/report.selector';
import type {DisbursementReportItem} from '@store/report/report.types';

type FieldDef = {
  label: string;
  value: string;
  valueStyle?: object;
};

const INITIAL_PAGE_SIZE = 20;
const LOAD_MORE_SIZE = 20;

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

/** List view field order (Sr No. shown in top-left badge, not in grid) */
const INITIAL_VISIBLE_FIELD_COUNT = 6;

const buildAllListFields = (item: DisbursementReportItem): FieldDef[] => [
  {label: 'Invoice Number', value: formatText(item.invoiceNumber)},
  {label: 'Anchor Name', value: formatText(item.anchorName)},
  {label: 'Anchor Pan', value: formatText(item.anchorPan)},
  {label: 'Borrower Name', value: formatText(item.borrowerName)},
  {label: 'Borrower Pan', value: formatText(item.borrowerPan)},
  {label: 'Master Program Name', value: formatText(item.masterProgramName)},
  {label: 'Program Name', value: formatText(item.programName)},
  {label: 'Program Type Name', value: formatText(item.programTypeName)},
  {label: 'Loan Account Number', value: formatText(item.loanAccountNumber)},
  {label: 'Los Id', value: formatText(item.losId)},
  {label: 'Tranch Number', value: formatText(item.tranchNumber)},
  {label: 'Invoice Date', value: formatText(item.invoiceDate)},
  {label: 'Disbursement Date', value: formatText(item.disbursementDate)},
  {label: 'Maturity Date', value: formatText(item.maturityDate)},
  {label: 'Invoice Value', value: formatAmount(item.invoiceValue)},
  {
    label: 'Disbursement Amount',
    value: formatAmount(item.disbursementAmount),
  },
  {label: 'Roi', value: formatText(item.roi)},
  {label: 'Margin', value: formatAmount(item.margin)},
  {label: 'Bank Name', value: formatText(item.bankName)},
  {label: 'Bank Account Number', value: formatText(item.bankAccountNumber)},
  {label: 'Ifsc Code', value: formatText(item.ifscCode)},
  {
    label: 'Status',
    value: formatText(item.status),
    valueStyle:
      item.status === 'Disbursed'
        ? {color: Colors.green, fontFamily: Fonts.GilroySemiBold}
        : undefined,
  },
  {label: 'Utr No', value: formatText(item.utrNo)},
  {label: 'Message', value: formatText(item.message)},
  {label: 'Generated Date', value: formatText(item.generatedDate)},
];

const buildInitialFields = (item: DisbursementReportItem): FieldDef[] =>
  buildAllListFields(item).slice(0, INITIAL_VISIBLE_FIELD_COUNT);

const buildExpandedFields = (item: DisbursementReportItem): FieldDef[] =>
  buildAllListFields(item).slice(INITIAL_VISIBLE_FIELD_COUNT);

function disbursementRowKey(item: DisbursementReportItem, index: number): string {
  return `${item.invoiceNumber}-${item.loanAccountNumber}-${String(index)}`;
}

export const DisbursementReportScreen: React.FC = () => {
  const navigation = useNavigation<
    CompositeNavigationProp<
      DrawerNavigationProp<HomeNavigatorType>,
      NativeStackNavigationProp<Record<string, object | undefined>>
    >
  >();
  const rows = useSelector(selectDisbursementReportData);
  const loading = useSelector(selectIsDisbursementLoading);
  const apiError = useSelector(selectDisbursementError);

  const {
    appliedFilters,
    showFilterModal,
    setShowFilterModal,
    handleApplyFilters,
    handleClearAllFilters,
    refetch,
  } = useReportApiFilter(fetchDisbursementReportRequest);

  const [searchText, setSearchText] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  const filteredData = useMemo(() => {
    let data = rows;

    if (searchText.trim()) {
      data = data.filter(row =>
        matchesReportSearch(
          searchText,
          row.loanAccountNumber,
          row.invoiceNumber,
          row.losId,
          row.borrowerName,
          row.anchorName,
          row.programName,
          row.utrNo,
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
    reportTitle: 'Disbursement Report',
    filename: 'disbursement-report',
    columns: DISBURSEMENT_EXPORT_COLUMNS,
    getExportRows: () => filteredData,
    appliedFilters,
  });

  const renderItem: ListRenderItem<DisbursementReportItem> = useCallback(
    ({item, index}) => {
      const rowKey = disbursementRowKey(item, index);
      const isExpanded = !!expandedIds[rowKey];
      const displayNo = index + 1;

      return (
        <View style={styles.cardWrapper}>
          <View style={styles.listCard}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{displayNo}</Text>
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
        <Text style={styles.pageTitleText}>Disbursment Report</Text>
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

      {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
    </>
  );

  return (
    <Container>
      <AppBar
        title="Reporting > Disbursment Report"
        navigation={navigation as never}
      />
      <FlatList
        data={paginatedData}
        keyExtractor={(item, index) => disbursementRowKey(item, index)}
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
                {apiError ? 'No data to display.' : 'No disbursement records found.'}
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
  loader: {
    marginTop: scaleHeight(24),
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
