import React, {useState, useEffect, useCallback, useMemo} from 'react';
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
import {useSelector, useDispatch} from 'react-redux';
import {interestAccrualActions, interestAccrualSelectors} from '@store/interestAccrual';
import {AppBar, Container, ProgramBreadcrumb, FilterModal} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter} from '@assets/Icons';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {formatDateDash} from '../InvoiceList/components/InvoiceDetails/types';
import {decryptValue} from '@utils/decrypt';
import {invoiceApi} from '@services/api/invoice.api';

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
  dueDate: string;
  disburseDate: string;
  disburseAmount: string;
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
  const programName = programSelection?.programName ?? '';
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';

  const dispatch = useDispatch();
  const rawInterestData = useSelector(interestAccrualSelectors.selectInterestAccrualList);
  const loading = useSelector(interestAccrualSelectors.selectInterestAccrualLoading);
  const apiError = useSelector(interestAccrualSelectors.selectInterestAccrualError);
  
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const programIds =
    programSelection?.programScope === 'all' &&
    programSelection?.allProgramIds?.length
      ? programSelection.allProgramIds
      : programSelection?.programId
      ? [programSelection.programId]
      : undefined;
  // Stable dependency key so useEffect doesn't loop due to new array instances
  const programIdsKey = JSON.stringify(programIds ?? []);

  const [apiKpis, setApiKpis] = useState<any>(null);

  useEffect(() => {
    dispatch(interestAccrualActions.fetchInterestAccrualListRequest({programIds}));
    
    // Fetch real KPIs
    invoiceApi.getInterestAccrualKpis(programIds).then(res => {
      setApiKpis(res);
    }).catch(e => console.log('Error fetching interest kpis', e));
  }, [programIdsKey, dispatch]);

  const rows = useMemo(() => {
    return (rawInterestData || []).map((item: any) => {
      const fmtMoney = (v: any) =>
        v != null
          ? `${Number(v).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}/-`
          : '-';
      const invoiceDate = formatDateDash(item.invoice_date ?? '');
      const dueDate = formatDateDash(item.invoice_due_date ?? '');
      const disburseDate = formatDateDash(item.disbursement_date ?? '');
      const finalTotalRaw = Number(item.final_total ?? 0);
      const disbursedAmountRaw = Number(item.disbursed_amount ?? 0);
      const cumulativeInterestRaw = Number(item.cumulative_interest ?? 0);
      return {
        id: item.id,
        loanRefNo: item.loan_ref_no ?? '-',
        invoiceNo: item.invoice_ref_no ?? '-',
        bankName: item.bank_name ?? '-',
        productName: item.name ?? '-',
        programName: item.program_name ?? '-',
        primaryParty: decryptValue(item.partyName ?? '') || '-',
        counterParty: decryptValue(item.counterPartyName ?? '') || '-',
        invoiceAmount: fmtMoney(item.final_total),
        invoiceDate,
        dueDate,
        disburseDate,
        disburseAmount: fmtMoney(item.disbursed_amount),
        totalAccInterest: fmtMoney(item.cumulative_interest),
        totalInterestPaid: '-', 
        finalTotalRaw,
        disbursedAmountRaw,
        cumulativeInterestRaw,
      };
    });
  }, [rawInterestData]);

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
      !f['Primary Party']?.length ||
      f['Primary Party']!.includes(item.primaryParty);
    const passesCounter =
      !f['Counter Party']?.length ||
      f['Counter Party']!.includes(item.counterParty);
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
  // Placeholder: overdue interest = total accrual interest (until backend provides separate field)
  const overdueInterest = totalAccrualInterest;

  const renderRow = ({item: row}: {item: InterestAccrualInvoiceRow}) => (
    <View style={styles.cardWrapper}>
      <View style={styles.listCard}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{rows.indexOf(row) + 1}</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice No</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                (navigation as any).navigate('InvoiceDailyInterestScreen', {
                  invoiceId: row.id,
                  invoiceNo: row.invoiceNo,
                })
              }>
              <Text style={[styles.infoValue, styles.linkText]}>{row.invoiceNo}</Text>
            </TouchableOpacity>
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
            <Text style={styles.infoLabel}>Counter Party</Text>
            <Text style={styles.infoValue}>{row.counterParty}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{row.invoiceDate}</Text>
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
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Total Accrual Interest (₹)</Text>
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
          Products {'>'} Dealer Finance {'>'} Transactions
        </Text>
      </View>
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.content}
        data={loading ? [] : paginatedData}
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
                  value: apiKpis?.total_interest_accrued_daily 
                    ? `₹ ${Number(apiKpis.total_interest_accrued_daily).toLocaleString('en-IN', {minimumFractionDigits: 2})}` 
                    : '-' 
                },
                { 
                  label: 'Accrual vs Expected', 
                  value: apiKpis?.accrual_vs_expected != null 
                    ? `${Number(apiKpis.accrual_vs_expected).toFixed(2)}%` 
                    : '-' 
                },
                { label: 'Overdue Interest', value: '-' },
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading interest accruals...</Text>
              </View>
            ) : (error || apiError) ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>{error || apiError}</Text>
              </View>
            ) : null}
            {!loading && (
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
          !loading && !error && filteredData.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No interest accruals found</Text>
            </View>
          ) : null
        }
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
          'Primary Party': [
            ...new Set(rows.map(r => r.primaryParty).filter(Boolean)),
          ].length
            ? [...new Set(rows.map(r => r.primaryParty).filter(Boolean))]
            : ['No data'],
          'Counter Party': [
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
