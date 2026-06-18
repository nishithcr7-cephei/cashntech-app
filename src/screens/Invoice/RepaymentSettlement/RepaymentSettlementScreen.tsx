import React, {useMemo, useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
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
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter, Dots} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {decryptValue} from '@utils/decrypt';
import Endpoints from '@constants/ApiEndPoints';
import {formatDateDash} from '../InvoiceList/components/InvoiceDetails/types';
import {PaymentHistoryModal} from '../DPDPenalInterest/components/PaymentHistoryModal';
import {RequestWaiverModal} from '../DPDPenalInterest/components/RequestWaiverModal';
import {invoiceApi, RepaymentKpisResponse} from '@services/api/invoice.api';

// Summary metrics for Repayment & Settlement will be dynamically built inside the component

const repaymentFilterData = {
  'Primary Party': ['Sun Pharma', 'Hero Finanace', 'ABC Finance'],
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
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  
  const dispatch = useDispatch();
  const repaymentData = useSelector(repaymentSelectors.selectRepaymentList);
  const loading = useSelector(repaymentSelectors.selectRepaymentLoading);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = React.useRef<Record<string, any>>({});
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [showRequestWaiverModal, setShowRequestWaiverModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const handleMenuToggle = (rowId: string) => {
    if (openMenuId === rowId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }
    const ref = menuButtonRefs.current[rowId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(rowId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(rowId);
    }
  };

  const handleMenuAction = (action: string, rowId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);
    const row = filteredData.find(r => r.id === rowId) ?? null;
    setSelectedRow(row);
    switch (action) {
      case 'paymentHistory':
        setShowPaymentHistoryModal(true);
        break;
      case 'requestWaiver':
        setShowRequestWaiverModal(true);
        break;
    }
  };

  const getMenuPosition = (anchor: {x: number; y: number; width: number; height: number} | null) => {
    const screen = Dimensions.get('window');
    const menuWidth = scaleWidth(200);
    const horizontalPadding = scaleWidth(12);
    const topPadding = scaleHeight(8);
    if (!anchor) {
      return {position: 'absolute' as const, top: topPadding + scaleHeight(60), right: horizontalPadding};
    }
    const desiredLeft = anchor.x + anchor.width - menuWidth;
    const left = Math.max(horizontalPadding, Math.min(desiredLeft, screen.width - menuWidth - horizontalPadding));
    return {position: 'absolute' as const, top: anchor.y + anchor.height + topPadding, left};
  };

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
    const listPayload =
      programSelection?.programScope === 'selected' && programSelection?.programId
        ? {programIds: [programSelection.programId]}
        : {};

    dispatch(repaymentActions.fetchRepaymentListRequest(listPayload));

    invoiceApi
      .getRepaymentKpis(kpiProgramIds)
      .then(res => {
        setApiKpis(res);
      })
      .catch(() => {
        setApiKpis(null);
      });
  }, [programSelection?.programScope, programSelection?.programId, kpiProgramIds, dispatch]);

  const getVal = (val: string | number | undefined | null) =>
    val != null && val !== ''
      ? `₹ ${Number(val).toLocaleString('en-IN', {minimumFractionDigits: 2})}`
      : '-';

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
          value: getVal(apiKpis?.overDueSum?.total_principal_outstanding),
        },
        {
          label: 'Interest Amount',
          value: getVal(apiKpis?.overDueSum?.total_base_interest_outstanding),
        },
        {
          label: 'Penal Interest Amount',
          value: getVal(apiKpis?.overDueSum?.total_penal_outstanding),
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
    let data = repaymentData.map((item: any) => ({
      id: item.id,
      loanRefNo: item.loan_ref_no || '-',
      invoiceNo: item.invoice_ref_no || '-',
      bankName: item.bank_name || '-',
      productName: item.name || '-',
      programName: item.program_name || '-',
      primaryParty: item.partyName ? decryptValue(item.partyName) : '-',
      counterParty: item.counterPartyName ? decryptValue(item.counterPartyName) : '-',
      invoiceAmount: item.final_total ? `₹${Number(item.final_total).toLocaleString('en-IN')}` : '-',
      invoiceDate: item.invoice_date ? formatDateDash(item.invoice_date) : '-',
      disbursedAmount: item.disbursed_amount ? `₹${Number(item.disbursed_amount).toLocaleString('en-IN')}` : '-',
      totalOutstandingAmount: item.total_outstanding ? `₹${Number(item.total_outstanding).toLocaleString('en-IN')}` : '-',
      outstandingPrinciple: item.outstanding_principal ? `₹${Number(item.outstanding_principal).toLocaleString('en-IN')}` : '-',
      dueDate: item.invoice_due_date ? formatDateDash(item.invoice_due_date) : '-',
      invoiceStatus: item.invoice_status || '-'
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
          (item.programName?.toLowerCase() || '').includes(term)
      );
    }
    return data;
  }, [searchText, repaymentData]);

  return (
    <Container>
      <AppBar
        title="Transactions > Repayment & Settlement"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <View style={styles.navPathContainer}>
        <Text style={styles.navPathText} numberOfLines={1} ellipsizeMode="tail">
          Products {'>'} Dealer Finance {'>'} Transactions
        </Text>
      </View>
      <ScrollView 
        contentContainerStyle={styles.content}
        onScrollBeginDrag={() => { setOpenMenuId(null); setMenuAnchor(null); }}>
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
            <ActivityIndicator size="large" color={Colors.primaryColor} style={{ marginTop: scaleHeight(20) }} />
          ) : (
            filteredData.map(row => (
                <View key={row.id} style={styles.cardWrapper}>
                  <View style={styles.listCard}>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexText}>{filteredData.indexOf(row) + 1}</Text>
                    </View>
                    <TouchableOpacity
                    ref={r => { if (r) menuButtonRefs.current[row.id] = r; }}
                    style={styles.threeDotsButton}
                    onPress={() => handleMenuToggle(row.id)}
                    activeOpacity={0.7}>
                    <Dots width={scaleWidth(20)} height={scaleHeight(20)} style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}} />
                  </TouchableOpacity>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Loan Ref No.</Text>
                      <Text style={styles.infoValue}>{row.loanRefNo}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice No</Text>
                      <Text style={styles.infoValue}>{row.invoiceNo}</Text>
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
                      <Text style={styles.infoLabel}>Primary Party</Text>
                      <Text style={styles.infoValue}>{row.primaryParty}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Counter Party</Text>
                      <Text style={styles.infoValue}>{row.counterParty}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                      <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Date</Text>
                      <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Disbursed Amount (₹)</Text>
                      <Text style={styles.infoValue}>{row.disbursedAmount}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Total Outstanding Amount (₹)</Text>
                      <Text style={styles.infoValue}>{row.totalOutstandingAmount}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Outstanding Principle (₹)</Text>
                      <Text style={styles.infoValue}>{row.outstandingPrinciple}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Due Date</Text>
                      <Text style={styles.infoValue}>{row.dueDate}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Status</Text>
                      <Text style={[styles.infoValue, { color: Colors.green, fontFamily: Fonts.GilroySemiBold }]}>{row.invoiceStatus}</Text>
                    </View>
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

      <Modal transparent visible={!!openMenuId} animationType="fade" onRequestClose={() => { setOpenMenuId(null); setMenuAnchor(null); }}>
        <Pressable style={styles.menuOverlay} onPress={() => { setOpenMenuId(null); setMenuAnchor(null); }}>
          <Pressable style={[styles.actionMenu, getMenuPosition(menuAnchor)]} onPress={e => e.stopPropagation()}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('paymentHistory', openMenuId as string)}>
              <FontAwesome6 name="calendar-check" iconStyle="solid" color={Colors.darkblack} size={16} />
              <Text style={styles.menuItemText}>Payment History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('requestWaiver', openMenuId as string)}>
              <FontAwesome6 name="calendar-check" iconStyle="solid" color={Colors.darkblack} size={16} />
              <Text style={styles.menuItemText}>Request Waiver</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <PaymentHistoryModal
        visible={showPaymentHistoryModal}
        onClose={() => { setShowPaymentHistoryModal(false); setSelectedRow(null); }}
        accountNo={selectedRow?.loanRefNo}
      />

      <RequestWaiverModal
        visible={showRequestWaiverModal}
        onClose={() => { setShowRequestWaiverModal(false); setSelectedRow(null); }}
        loanRefNo={selectedRow?.loanRefNo ?? ''}
        outstandingAmount={selectedRow?.totalOutstandingAmount?.replace('/-', '') ?? '15,556'}
        onSubmit={data => {
          void selectedRow?.id;
          void data;
          setShowRequestWaiverModal(false);
          setSelectedRow(null);
        }}
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
    paddingRight: scaleWidth(50),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  threeDotsButton: { position: 'absolute', top: scaleHeight(12), right: scaleWidth(12), width: scaleWidth(32), height: scaleWidth(32), borderRadius: scaleWidth(16), backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)' },
  actionMenu: { backgroundColor: Colors.white, borderRadius: scaleWidth(8), paddingVertical: scaleHeight(8), paddingHorizontal: scaleWidth(12), minWidth: scaleWidth(180), elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), paddingVertical: scaleHeight(8) },
  menuItemText: { fontSize: scaleFont(14), fontFamily: Fonts.GilroyMedium, color: Colors.darkblack },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(12) },
  infoColumn: { width: '47%', backgroundColor: '#F7F8FB', borderRadius: scaleWidth(10), padding: scaleWidth(12) },
  infoLabel: { fontSize: scaleFont(12), color: Colors.graybase, marginBottom: scaleHeight(4) },
  infoValue: { fontSize: scaleFont(14), color: Colors.darkblack, fontFamily: Fonts.GilroyMedium },
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
