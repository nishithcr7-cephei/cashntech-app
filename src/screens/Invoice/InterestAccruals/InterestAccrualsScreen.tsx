import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {AppBar, Container, ProgramBreadcrumb, FilterModal} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter} from '@assets/Icons';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection, selectAllProgramIds} from '@store/programSelection/programSelection.selector';
import {formatDateDash} from '../InvoiceList/components/InvoiceDetails/types';
import {decryptValue} from '@utils/decrypt';
import {invoiceApi, InterestAccrualKpisResponse} from '@services/api/invoice.api';
import {
  selectActiveProductId,
  selectActiveProductName,
  selectActiveProductCode,
  selectEffectiveProductCode,
  selectIsVendorFinanceActive,
} from '@store/product/product.selectors';
import {
  getEffectiveProductCode,
  resolveWorkspaceProductId,
  usesVendorPartyLabels,
} from '@store/product/product.resolver';
import {PRODUCT_CODES, PRODUCT_DISPLAY_NAMES} from '@store/product/product.types';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import Toast from 'react-native-toast-message';

type InterestAccrualInvoiceRow = {
  id: string;
  loanRefNo: string;
  invoiceNo: string;
  bankName: string;
  productName: string;
  programName: string;
  primaryParty: string;
  counterParty: string;
  invoiceAmount: string;
  invoiceDate: string;
  grnDate: string;
  dueDate: string;
  disburseDate: string;
  disburseAmount: string;
  advanceInterest: string;
  totalAccInterest: string;
  totalInterestPaid: string;
  // raw numeric fields for summary calculations
  finalTotalRaw: number;
  disbursedAmountRaw: number;
  cumulativeInterestRaw: number;
};

export const InterestAccrualsScreen: React.FC = () => {
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const programSelection = useSelector(selectProgramSelection);
  const allProgramIds = useSelector(selectAllProgramIds);
  const activeProductName = useSelector(selectActiveProductName);
  const activeProductCode = useSelector(selectActiveProductCode);
  const activeProductId = useSelector(selectActiveProductId);
  const effectiveCode = useSelector(selectEffectiveProductCode);
  const isVendorFinance = useSelector(selectIsVendorFinanceActive);
  const vendorPartyLabels = usesVendorPartyLabels(effectiveCode);
  const canViewDailyInterest = useHasPermission(
    PERMISSIONS.INTEREST_ACCRUALS_VIEW_DAILY,
  );
  const productBreadcrumbLabel =
    activeProductName ||
    PRODUCT_DISPLAY_NAMES[getEffectiveProductCode(activeProductCode)];
  const primaryPartyLabel = vendorPartyLabels ? 'Vendor' : 'Primary Party';
  const counterPartyLabel = vendorPartyLabels ? 'Anchor' : 'Counter Party';
  const programName = programSelection?.programName ?? '';
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';

  const [searchText, setSearchText] = useState('');
  const [listError, setListError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setAppliedFilters({});
  }, [vendorPartyLabels]);
  const programIds = useMemo(
    () =>
      programSelection?.programScope === 'all' && allProgramIds?.length
        ? allProgramIds
        : programSelection?.programId
          ? [programSelection.programId]
          : undefined,
    [
      programSelection?.programScope,
      programSelection?.programId,
      allProgramIds,
    ],
  );
  /** Web parity: KPI endpoint uses [] unless a specific program is selected */
  const kpiProgramIds = useMemo(() => {
    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.programId
    ) {
      return [programSelection.programId];
    }
    return [];
  }, [programSelection?.programScope, programSelection?.programId]);
  const programIdsKey = JSON.stringify(programIds ?? []);
  const kpiProgramIdsKey = JSON.stringify(kpiProgramIds);

  /** productId for list/KPI filters — active product (DF/VF) or selected program. */
  const overviewProductId = useMemo(
    () => resolveWorkspaceProductId(programSelection, activeProductId),
    [programSelection, activeProductId],
  );

  const [apiKpis, setApiKpis] = useState<InterestAccrualKpisResponse | null>(null);
  const [interestList, setInterestList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [kpisLoading, setKpisLoading] = useState(true);
  const fetchRequestId = useRef(0);

  const getRequestErrorMessage = (error: any, fallback: string) => {
    const responseMessage = error?.response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }
    if (
      error?.message?.includes('fetch') ||
      error?.message === 'Network Error' ||
      error?.code === 'ECONNABORTED'
    ) {
      return 'Network error. Check connection.';
    }
    return error?.message || fallback;
  };

  const fetchInterestAccrualData = useCallback(async () => {
    const requestId = ++fetchRequestId.current;
    setListLoading(true);
    setKpisLoading(true);
    setListError(null);

    const listPromise = invoiceApi
      .getDisbursedList(programIds, {
        productId: overviewProductId ?? undefined,
      })
      .then(res => {
        if (requestId !== fetchRequestId.current) return;
        setInterestList(Array.isArray(res) ? res : []);
      })
      .catch(error => {
        if (requestId !== fetchRequestId.current) return;
        setInterestList([]);
        setListError(getRequestErrorMessage(error, 'Failed to load interest accruals'));
      })
      .finally(() => {
        if (requestId === fetchRequestId.current) {
          setListLoading(false);
        }
      });

    const kpisPromise = invoiceApi
      .getInterestAccrualKpis(
        kpiProgramIds,
        overviewProductId ? {productId: overviewProductId} : undefined,
      )
      .then(res => {
        if (requestId !== fetchRequestId.current) return;
        setApiKpis(res);
      })
      .catch(() => {
        if (requestId !== fetchRequestId.current) return;
        setApiKpis(null);
      })
      .finally(() => {
        if (requestId === fetchRequestId.current) {
          setKpisLoading(false);
        }
      });

    await Promise.allSettled([listPromise, kpisPromise]);
  }, [programIds, kpiProgramIds, overviewProductId]);

  useEffect(() => {
    fetchInterestAccrualData();
  }, [fetchInterestAccrualData, programIdsKey, kpiProgramIdsKey]);

  const rows = useMemo(() => {
    return (interestList || []).map((item: any) => {
      const fmtMoney = (v: any) =>
        v != null && v !== ''
          ? `${Number(v).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}/-`
          : '-';
      const invoiceDate = formatDateDash(item.invoice_date ?? '');
      const grnRaw = item.grn_date ?? item.grnDate ?? '';
      const grnDate = grnRaw
        ? formatDateDash(String(grnRaw))
        : '-';
      const dueDate = formatDateDash(item.invoice_due_date ?? '');
      const disburseDate = formatDateDash(item.disbursement_date ?? '');
      const finalTotalRaw = Number(item.final_total ?? 0);
      const disbursedAmountRaw = Number(item.disbursed_amount ?? 0);
      const upfrontInterestRaw = Number(item.upfront_interest ?? 0) || 0;
      // VF Accrued Interest uses API `interest_accrued`; DF Total Accrual uses `cumulative_interest`.
      const displayAccrualRaw = isVendorFinance
        ? Number(item.interest_accrued ?? 0) || 0
        : Number(item.cumulative_interest ?? 0) || 0;
      return {
        id: item.id,
        loanRefNo: item.loan_ref_no ?? '-',
        invoiceNo: item.invoice_ref_no ?? '-',
        bankName: item.bank_name ?? '-',
        productName: item.name ?? '-',
        programName: item.program_name ?? '-',
        primaryParty:
          decryptValue(
            (vendorPartyLabels ? item.counterPartyName : item.partyName) ?? '',
          ) || '-',
        counterParty:
          decryptValue(
            (vendorPartyLabels ? item.partyName : item.counterPartyName) ?? '',
          ) || '-',
        invoiceAmount: fmtMoney(item.final_total),
        invoiceDate:
          !invoiceDate || invoiceDate === 'dd-mm-yyyy' ? '-' : invoiceDate,
        grnDate: !grnDate || grnDate === 'dd-mm-yyyy' ? '-' : grnDate,
        dueDate: !dueDate || dueDate === 'dd-mm-yyyy' ? '-' : dueDate,
        disburseDate:
          !disburseDate || disburseDate === 'dd-mm-yyyy' ? '-' : disburseDate,
        disburseAmount: fmtMoney(item.disbursed_amount),
        advanceInterest: fmtMoney(upfrontInterestRaw),
        totalAccInterest: fmtMoney(displayAccrualRaw),
        totalInterestPaid: fmtMoney(item.total_paid_interest),
        finalTotalRaw,
        disbursedAmountRaw,
        cumulativeInterestRaw: displayAccrualRaw,
      };
    });
  }, [interestList, isVendorFinance, vendorPartyLabels]);

  // Client-side filter + search
  const filteredBySearch = !searchText.trim()
    ? rows
    : rows.filter(item => {
        const term = searchText.toLowerCase();
        return (
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.counterParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term) ||
          (item.bankName?.toLowerCase() || '').includes(term) ||
          (item.programName?.toLowerCase() || '').includes(term)
        );
      });

  const filteredData = filteredBySearch.filter(item => {
    const f = appliedFilters;
    const passesBank =
      !f['Bank']?.length || f['Bank']!.includes(item.bankName);
    const passesProduct =
      !f['Product']?.length || f['Product']!.includes(item.productName);
    const passesProgram =
      !f['Program']?.length || f['Program']!.includes(item.programName);
    const passesPrimary =
      !f[primaryPartyLabel]?.length ||
      f[primaryPartyLabel]!.includes(item.primaryParty);
    const passesCounter =
      !f[counterPartyLabel]?.length ||
      f[counterPartyLabel]!.includes(item.counterParty);
    return (
      passesBank &&
      passesProduct &&
      passesProgram &&
      passesPrimary &&
      passesCounter
    );
  });

  const [visibleCount, setVisibleCount] = useState(30);
  useEffect(() => {
    setVisibleCount(30);
  }, [searchText, appliedFilters]);
  const paginatedData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 20, filteredData.length));
  }, [filteredData.length]);

  // Summary metrics (all client-side, based on rows)
  const totalDisInvoices = rows.length;
  const totalDisAmount = rows.reduce(
    (sum, r) => sum + (r.disbursedAmountRaw || 0),
    0,
  );
  const totalAccrualInterest = rows.reduce(
    (sum, r) => sum + (r.cumulativeInterestRaw || 0),
    0,
  );
  const totalOutstandingAmount = rows.reduce(
    (sum, r) =>
      sum + Math.max(0, (r.finalTotalRaw || 0) - (r.disbursedAmountRaw || 0)),
    0,
  );

  const formatKpiCurrency = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return `₹ ${num.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  };

  const renderRow = ({item: row}: {item: InterestAccrualInvoiceRow}) => (
    <View style={styles.cardWrapper}>
      <View style={styles.listCard}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{rows.indexOf(row) + 1}</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Loan Ref No.</Text>
            <Text style={styles.infoValue}>{row.loanRefNo}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice No.</Text>
            {canViewDailyInterest ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  (navigation as any).navigate('InvoiceDailyInterestScreen', {
                    invoiceId: row.id,
                    invoiceNo: row.invoiceNo,
                  })
                }>
                <Text style={[styles.infoValue, styles.linkText]}>
                  {row.invoiceNo}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: 'Daily interest detail is not permitted for your role.',
                  })
                }>
                <Text style={[styles.infoValue, styles.invoiceNoDisabled]}>
                  {row.invoiceNo}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Bank Name</Text>
            <Text style={styles.infoValue}>{row.bankName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Product Name</Text>
            <Text style={styles.infoValue}>{row.productName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Program Name</Text>
            <Text style={styles.infoValue}>{row.programName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>{primaryPartyLabel}</Text>
            <Text style={styles.infoValue}>{row.primaryParty}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>{counterPartyLabel}</Text>
            <Text style={styles.infoValue}>{row.counterParty}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{row.invoiceDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>GRN Date</Text>
            <Text style={styles.infoValue}>{row.grnDate || '-'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{row.dueDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Disbursement Date</Text>
            <Text style={styles.infoValue}>{row.disburseDate}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
            <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Disbursed Amount (₹)</Text>
            <Text style={styles.infoValue}>{row.disburseAmount}</Text>
          </View>
          {isVendorFinance ? (
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Advance Interest (₹)</Text>
              <Text style={styles.infoValue}>{row.advanceInterest}</Text>
            </View>
          ) : null}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>
              {isVendorFinance
                ? 'Accrued Interest (₹)'
                : 'Total Accrual Interest (₹)'}
            </Text>
            <Text style={styles.infoValue}>{row.totalAccInterest}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Total Interest Paid Amount (₹)</Text>
            <Text style={styles.infoValue}>{row.totalInterestPaid}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Container>
      <AppBar
        title="Transactions > Interest Accruals"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <View style={styles.navPathContainer}>
        <Text style={styles.navPathText} numberOfLines={1} ellipsizeMode="tail">
          Products {'>'} {productBreadcrumbLabel} {'>'} Transactions
        </Text>
      </View>
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.content}
        data={listLoading ? [] : paginatedData}
        keyExtractor={row => row.id}
        ListHeaderComponent={
          <>
            {programName ? (
              <View style={styles.pageTitleBar}>
                <Text style={styles.pageTitleText}>{programName}</Text>
              </View>
            ) : null}
            <View style={styles.cardGrid}>
              {[
                { 
                  label: 'Total Interest Accrued Daily', 
                  value: kpisLoading
                    ? '...'
                    : formatKpiCurrency(apiKpis?.total_interest_accrued_daily),
                },
                { 
                  label: 'Accrual vs Expected', 
                  value: kpisLoading
                    ? '...'
                    : apiKpis?.accrual_vs_expected != null
                      ? Number(apiKpis.accrual_vs_expected).toFixed(2)
                      : '-',
                },
                {
                  label: 'Overdue Interest',
                  value: kpisLoading
                    ? '...'
                    : formatKpiCurrency(apiKpis?.overdue_interest),
                },
                { label: 'Loans Not Accruing Interest', value: '-' },
                { label: 'Days Accrued vs Days Elapsed', value: '-' },
              ].map((m, i) => (
                <View key={i} style={styles.card}>
                  <Text style={styles.cardLabel}>{m.label}</Text>
                  <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                    {m.value}
                  </Text>
                </View>
              ))}
            </View>
            {listLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading interest accruals...</Text>
              </View>
            ) : listError ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>{listError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchInterestAccrualData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {!listLoading && (
              <>
                {!(isDealerMaker || isDealerChecker) && (
                  <View style={styles.invoicesHeader}>
                    <Text style={styles.invoicesLabel}>Interest Accruals</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{filteredData.length}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.searchFilterRow}>
                  <View style={styles.searchContainer}>
                    <Search width={scaleWidth(18)} height={scaleHeight(18)} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by Program / Invoice No."
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
                </View>
                {(isDealerMaker || isDealerChecker) && (
                  <View style={[styles.invoicesHeader, {marginTop: scaleHeight(12)}]}>
                    <Text style={styles.invoicesLabel}>Interest Accruals</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{filteredData.length}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={{height: scaleHeight(12)}} />}
        renderItem={renderRow}
        ListEmptyComponent={
          !listLoading && !listError && filteredData.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No interest accruals found</Text>
            </View>
          ) : null
        }
        onEndReached={!listLoading && hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          !listLoading && hasMore ? (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
        }}
        filterData={{
          Bank: [
            ...new Set(rows.map(r => r.bankName).filter(Boolean)),
          ].length
            ? [...new Set(rows.map(r => r.bankName).filter(Boolean))]
            : ['No data'],
          Product: [
            ...new Set(rows.map(r => r.productName).filter(Boolean)),
          ].length
            ? [...new Set(rows.map(r => r.productName).filter(Boolean))]
            : ['No data'],
          Program: [
            ...new Set(rows.map(r => r.programName).filter(Boolean)),
          ].length
            ? [...new Set(rows.map(r => r.programName).filter(Boolean))]
            : ['No data'],
          [primaryPartyLabel]: [
            ...new Set(rows.map(r => r.primaryParty).filter(Boolean)),
          ].length
            ? [...new Set(rows.map(r => r.primaryParty).filter(Boolean))]
            : ['No data'],
          [counterPartyLabel]: [
            ...new Set(rows.map(r => r.counterParty).filter(Boolean)),
          ].length
            ? [...new Set(rows.map(r => r.counterParty).filter(Boolean))]
            : ['No data'],
        }}
        appliedFilters={appliedFilters}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  loadingContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    gap: scaleHeight(12),
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
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
  errorText: {
    fontSize: scaleFont(14),
    color: Colors.red,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
    marginBottom: scaleHeight(12),
  },
  retryButton: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
  },
  retryButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
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
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(16),
  },
  card: {
    flexBasis: '47%',
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: '#FFD9D9',
    minWidth: 0,
  },
  cardLabel: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
    flexWrap: 'wrap',
  },
  cardValue: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    flexShrink: 1,
    minWidth: 0,
  },
  invoicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  invoicesLabel: {
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
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
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
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  exportButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  verticalList: {
    gap: scaleHeight(12),
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
  invoiceNoDisabled: {
    color: Colors.graybase,
    opacity: 0.85,
  },
  linkText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
  },
  navPathContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  navPathText: {
    fontSize: scaleFont(12),
    color: '#666666',
    fontFamily: Fonts.GilroyMedium,
  },
});
