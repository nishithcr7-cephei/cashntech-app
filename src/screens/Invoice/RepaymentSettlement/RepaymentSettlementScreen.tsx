import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {repaymentActions, repaymentSelectors} from '@store/repayment';
import {
  AppBar,
  Container,
  FilterModal,
  ProgramBreadcrumb,
  SkeletonList,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter} from '@assets/Icons';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {
  selectActiveProductId,
  selectActiveProductName,
  selectEffectiveProductCode,
} from '@store/product/product.selectors';
import {PRODUCT_DISPLAY_NAMES} from '@store/product/product.types';
import {
  getPartyLabels,
  resolveWorkspaceProductId,
  usesVendorPartyLayout,
} from '@store/product/product.resolver';
import {FetchRepaymentListRequest} from '@store/repayment/repayment.types';
import {decryptValue} from '@utils/decrypt';
import {formatDateDash, formatStatus} from '../InvoiceList/components/InvoiceDetails/types';
import {invoiceApi, RepaymentKpisResponse} from '@services/api/invoice.api';
import {formatKpiCurrency} from '@utils/formatKpiCurrency';

// Summary metrics for Repayment & Settlement will be dynamically built inside the component

const repaymentPartyFilterOptions = ['Sun Pharma', 'Hero Finanace', 'ABC Finance'];

const repaymentFilterDataCommon = {
  'Bank Name': ['UGRO', 'TCL'],
  'Loan Ref No.': ['125423', '125424', '125425'],
};

export const RepaymentSettlementScreen: React.FC = () => {
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const programSelection = useSelector(selectProgramSelection);
  const effectiveCode = useSelector(selectEffectiveProductCode);
  const activeProductId = useSelector(selectActiveProductId);
  const activeProductName = useSelector(selectActiveProductName);
  const vendorPartyLabels = usesVendorPartyLayout(effectiveCode);
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';
  const primaryPartyLabel = vendorPartyLabels
    ? getPartyLabels(effectiveCode).singular
    : 'Primary Party';
  const counterPartyLabel = vendorPartyLabels ? 'Anchor' : 'Counter Party';
  const repaymentFilterData = useMemo(
    () => ({
      [primaryPartyLabel]: repaymentPartyFilterOptions,
      ...repaymentFilterDataCommon,
    }),
    [primaryPartyLabel],
  );

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setAppliedFilters({});
  }, [primaryPartyLabel]);
  
  const dispatch = useDispatch();
  const repaymentData = useSelector(repaymentSelectors.selectRepaymentList);
  const loading = useSelector(repaymentSelectors.selectRepaymentLoading);

  /** productId for list/KPI filters — active product (DF/VF) or selected program. */
  const overviewProductId = useMemo(
    () => resolveWorkspaceProductId(programSelection, activeProductId),
    [programSelection, activeProductId],
  );

  const productBreadcrumbLabel = useMemo(() => {
    if (activeProductName) {
      return activeProductName;
    }
    return PRODUCT_DISPLAY_NAMES[effectiveCode];
  }, [activeProductName, effectiveCode]);

  const [apiKpis, setApiKpis] = useState<RepaymentKpisResponse | null>(null);

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

  useEffect(() => {
    const listPayload: FetchRepaymentListRequest = {};
    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.programId
    ) {
      listPayload.programIds = [programSelection.programId];
    }
    if (overviewProductId) {
      listPayload.productId = overviewProductId;
    }

    dispatch(repaymentActions.fetchRepaymentListRequest(listPayload));

    invoiceApi
      .getRepaymentKpis(
        kpiProgramIds,
        overviewProductId ? {productId: overviewProductId} : undefined,
      )
      .then(res => {
        setApiKpis(res);
      })
      .catch(() => {
        setApiKpis(null);
      });
  }, [
    programSelection?.programScope,
    programSelection?.programId,
    kpiProgramIds,
    overviewProductId,
    dispatch,
  ]);

  const getVal = (val: string | number | undefined | null) => formatKpiCurrency(val);

  const repaymentMetrics = useMemo(() => [
    {
      label: 'Total Disbursed Amount',
      value: getVal(apiKpis?.total_dsibursed_amount),
    },
    {
      label: 'Total Collections',
      subValues: [
        { label: 'Principal Amount', value: getVal(apiKpis?.principal_repaid) },
        { label: 'Interest Amount', value: getVal(apiKpis?.interest_repaid) },
        { label: 'Penal Interest Amount', value: getVal(apiKpis?.penal_repaid) },
      ],
    },
    {
      label: 'Total Outstanding Amount',
      subValues: [
        {
          label: 'Principal Amount',
          value: getVal(apiKpis?.totalOs?.totalPrincipalOutstanding),
        },
        {
          label: 'Interest Amount',
          value: getVal(apiKpis?.totalOs?.totalBaseInterestOutstanding),
        },
        {
          label: 'Penal Interest Amount',
          value: getVal(apiKpis?.totalOs?.totalPenalOutstanding),
        },
      ],
    },
    {
      label: 'Collection Efficiency(%)',
      value: '-',
    },
    {
      label: 'Overdue Amount',
      subValues: [
        {
          label: 'Principal Amount',
          value: getVal(
            apiKpis?.overDueSum?.total_principal_outstanding ?? 0,
          ),
        },
        {
          label: 'Interest Amount',
          value: getVal(
            apiKpis?.overDueSum?.total_base_interest_outstanding ?? 0,
          ),
        },
        {
          label: 'Penal Interest Amount',
          value: getVal(apiKpis?.overDueSum?.total_penal_outstanding ?? 0),
        },
      ],
    },
    {
      label: 'Allocation Completeness',
      value: '-',
    },
    {
      label: 'Total Closed Invoices',
      value:
        apiKpis?.totalClosedInvoices != null && apiKpis.totalClosedInvoices !== ''
          ? String(apiKpis.totalClosedInvoices)
          : '-',
    },
    {
      label: 'Average Settlement TAT',
      value: '-',
    },
  ], [apiKpis]);

  const filteredData = useMemo(() => {
    const fmtMoney = (v: any) =>
      v != null && v !== ''
        ? `₹${Number(v).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : '-';
    const fmtDate = (v: any) => {
      if (!v) return '-';
      const d = formatDateDash(String(v));
      return !d || d === 'dd-mm-yyyy' ? '-' : d;
    };

    let data = repaymentData.map((item: any) => ({
      id: item.id,
      loanRefNo: item.loan_ref_no || '-',
      invoiceNo: item.invoice_ref_no || '-',
      bankName: item.bank_name || '-',
      productName: item.name || '-',
      programName: item.program_name || '-',
      primaryParty: decryptValue(
        (vendorPartyLabels ? item.counterPartyName : item.partyName) ?? '',
      ) || '-',
      counterParty: decryptValue(
        (vendorPartyLabels ? item.partyName : item.counterPartyName) ?? '',
      ) || '-',
      invoiceAmount: fmtMoney(item.final_total),
      invoiceDate: fmtDate(item.invoice_date),
      grnDate: fmtDate(item.grn_date ?? item.grnDate),
      dueDate: fmtDate(item.invoice_due_date),
      disbursementDate: fmtDate(item.disbursement_date),
      disbursedAmount: fmtMoney(item.disbursed_amount),
      totalOutstandingAmount: fmtMoney(item.total_outstanding),
      outstandingPrinciple: fmtMoney(item.outstanding_principal),
      advanceInterestPaid: fmtMoney(item.upfront_interest),
      // Repayment API aliases overdue accrued as cumulative_interest; prefer interest_accrued when present.
      interestAccrued: fmtMoney(
        item.interest_accrued ?? item.cumulative_interest,
      ),
      penalAmount: fmtMoney(item.penal_interest),
      invoiceStatus: formatStatus(item.invoice_status || '') || '-',
    }));

    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        (item: any) =>
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.counterParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term) ||
          (item.bankName?.toLowerCase() || '').includes(term) ||
          (item.programName?.toLowerCase() || '').includes(term),
      );
    }
    return data;
  }, [searchText, repaymentData, vendorPartyLabels]);

  const handleInvoiceNoPress = useCallback(
    (row: any) => {
      (navigation as any).navigate('InvoiceDetailView', {
        invoiceId: row.id,
        invoiceNo: row.invoiceNo,
        returnRoute: 'RepaymentSettlementScreen',
        listInvoiceStatus: row.invoiceStatus,
      });
    },
    [navigation],
  );

  return (
    <Container>
      <AppBar
        title="Transactions > Repayment & Settlement"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <View style={styles.navPathContainer}>
        <Text style={styles.navPathText} numberOfLines={1} ellipsizeMode="tail">
          Products {'>'} {productBreadcrumbLabel} {'>'} Transactions
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>Repayment and Settlement</Text>
        </View>

        <View style={styles.cardGrid}>
          {repaymentMetrics.map((metric, index) => {
            const hasSubValues = (metric as any).subValues;
            return (
              <View key={index} style={styles.card}>
                <Text style={[styles.cardLabel, styles.centerText]}>{metric.label}</Text>
                {metric.value ? (
                  <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </Text>
                ) : null}
                {hasSubValues ? (
                  <View style={styles.subValuesContainer}>
                    {(metric as any).subValues.map((sub: any, sIdx: number) => (
                      <View key={sIdx} style={styles.subValueRow}>
                        <Text style={styles.subLabel} numberOfLines={1}>{sub.label.replace(' Amount', '')}</Text>
                        <Text style={styles.subValue} numberOfLines={1} adjustsFontSizeToFit>
                          {sub.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {!(isDealerMaker || isDealerChecker) && (
          <View style={styles.invoicesHeader}>
            <Text style={styles.invoicesLabel}>Invoices</Text>
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
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {(isDealerMaker || isDealerChecker) && (
          <View style={[styles.invoicesHeader, {marginTop: scaleHeight(12)}]}>
            <Text style={styles.invoicesLabel}>Invoices</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filteredData.length}</Text>
            </View>
          </View>
        )}

        <View style={styles.verticalList}>
          {loading ? (
            <SkeletonList variant="grid" count={4} />
          ) : (
            filteredData.map(row => (
                <View key={row.id} style={styles.cardWrapper}>
                  <View style={styles.listCard}>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexText}>{filteredData.indexOf(row) + 1}</Text>
                    </View>
                  <View style={styles.infoGrid}>
                    {vendorPartyLabels ? (
                      <>
                        {/* VF/PID web parity: Loan Ref → Invoice No → Bank & Product → Parties → Invoice Date → GRN Date → Due Date → Disbursement Date → Invoice Amount → Disbursed Amount → O/S Principal → Advance Interest Paid → O/S Interest Accrued → O/S Penal → O/S Total → Invoice Status */}
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Loan Ref No.</Text>
                          <Text style={styles.infoValue}>{row.loanRefNo}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Invoice No</Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleInvoiceNoPress(row)}>
                            <Text style={[styles.infoValue, styles.linkText]}>
                              {row.invoiceNo}
                            </Text>
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
                          <Text style={styles.infoValue}>{row.grnDate}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Due Date</Text>
                          <Text style={styles.infoValue}>{row.dueDate}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Disbursement Date</Text>
                          <Text style={styles.infoValue}>
                            {row.disbursementDate}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                          <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            Disbursed Amount (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.disbursedAmount}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            O/S Principal Amount (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.outstandingPrinciple}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            Advance Interest Paid (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.advanceInterestPaid}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            O/S Interest Accrued Amount (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.interestAccrued}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>O/S Penal Amount (₹)</Text>
                          <Text style={styles.infoValue}>{row.penalAmount}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>O/S Total Amount (₹)</Text>
                          <Text style={styles.infoValue}>
                            {row.totalOutstandingAmount}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Invoice Status</Text>
                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color: Colors.green,
                                fontFamily: Fonts.GilroySemiBold,
                              },
                            ]}>
                            {row.invoiceStatus}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* DF web parity: Loan Ref → Invoice No → Bank → Product → Program → Parties → Invoice Date → GRN Date → Due Date → Disbursement Date → Invoice Amount → Disbursed Amount → O/S Principal → Advance Interest Paid → O/S Interest Accrued → O/S Penal → O/S Total → Invoice Status */}
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Loan Ref No.</Text>
                          <Text style={styles.infoValue}>{row.loanRefNo}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Invoice No</Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleInvoiceNoPress(row)}>
                            <Text style={[styles.infoValue, styles.linkText]}>
                              {row.invoiceNo}
                            </Text>
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
                          <Text style={styles.infoValue}>
                            {row.disbursementDate || '-'}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                          <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            Disbursed Amount (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.disbursedAmount}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            O/S Principal Amount (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.outstandingPrinciple}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            Advance Interest Paid (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.advanceInterestPaid}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>
                            O/S Interest Accrued Amount (₹)
                          </Text>
                          <Text style={styles.infoValue}>
                            {row.interestAccrued}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>O/S Penal Amount (₹)</Text>
                          <Text style={styles.infoValue}>{row.penalAmount}</Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>O/S Total Amount (₹)</Text>
                          <Text style={styles.infoValue}>
                            {row.totalOutstandingAmount}
                          </Text>
                        </View>
                        <View style={styles.infoColumn}>
                          <Text style={styles.infoLabel}>Invoice Status</Text>
                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color: Colors.green,
                                fontFamily: Fonts.GilroySemiBold,
                              },
                            ]}>
                            {row.invoiceStatus}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
        }}
        filterData={repaymentFilterData}
        appliedFilters={appliedFilters}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: scaleWidth(16), paddingBottom: scaleHeight(24) },
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    marginBottom: scaleHeight(8),
    marginHorizontal: -scaleWidth(16),
  },
  pageTitleText: { fontSize: scaleFont(16), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: scaleWidth(10), marginTop: scaleHeight(8), marginBottom: scaleHeight(16) },
  card: {
    width: '48%',
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#FFD9D9',
    minHeight: scaleHeight(100),
    justifyContent: 'center',
  },
  cardLabel: { fontSize: scaleFont(14), color: Colors.graybase, marginBottom: scaleHeight(8), textAlign: 'center', fontFamily: Fonts.GilroyMedium },
  cardValue: { fontSize: scaleFont(18), fontFamily: Fonts.GilroyBold, color: Colors.primaryColor, textAlign: 'center' },
  cardValueBlack: { color: Colors.darkblack },
  centerText: { textAlign: 'center' },
  subValuesContainer: { marginTop: scaleHeight(8), gap: scaleHeight(4) },
  subValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: scaleHeight(2) },
  subLabel: { fontSize: scaleFont(11), color: Colors.graybase, fontFamily: Fonts.GilroyMedium },
  subValue: { fontSize: scaleFont(11), fontFamily: Fonts.GilroyBold, color: Colors.primaryColor },
  invoicesHeader: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8), marginBottom: scaleHeight(12) },
  invoicesLabel: { fontSize: scaleFont(16), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  badge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  badgeText: { color: Colors.white, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold },
  searchFilterRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), marginBottom: scaleHeight(12) },
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
  searchInput: { flex: 1, fontSize: scaleFont(14), color: Colors.darkblack, padding: 0 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterButtonText: { color: Colors.white, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold },
  verticalList: { gap: scaleHeight(12) },
  cardWrapper: { position: 'relative' },
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
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(12) },
  infoColumn: { width: '47%', backgroundColor: '#F7F8FB', borderRadius: scaleWidth(10), padding: scaleWidth(12) },
  infoLabel: { fontSize: scaleFont(12), color: Colors.graybase, marginBottom: scaleHeight(4) },
  infoValue: { fontSize: scaleFont(14), color: Colors.darkblack, fontFamily: Fonts.GilroyMedium },
  linkText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
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
