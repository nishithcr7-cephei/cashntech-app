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
import {dpdActions, dpdSelectors} from '@store/dpd';
import {
  AppBar,
  Container,
  FilterModal,
  ProgramBreadcrumb,
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
import {PRODUCT_CODES, PRODUCT_DISPLAY_NAMES} from '@store/product/product.types';
import {FetchDPDListRequest} from '@store/dpd/dpd.types';
import {invoiceApi, DpdKpisResponse} from '@services/api/invoice.api';

// DPD Metrics will be dynamically populated in the component


const dpdFilterData = {
  'DPD Buckets': [
    'Bucket 1 (1 to 30 Days)',
    'Bucket 2 (31 to 60 Days)',
    'Bucket 3 (61 to 90 Days)',
    'NPA (More than 90 Days)',
  ],
  'Bank Name': ['UGRO', 'TCL'],
  'Invoice Status': ['Closed', 'Open'],
};

const BUCKET_VALUE_MAP: Record<string, string> = {
  'Bucket 1 (1 to 30 Days)': 'Bucket1',
  'Bucket 2 (31 to 60 Days)': 'Bucket2',
  'Bucket 3 (61 to 90 Days)': 'Bucket3',
  'NPA (More than 90 Days)': 'NPA',
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
};

export const DPDPenalInterestNPAScreen: React.FC = () => {
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const programSelection = useSelector(selectProgramSelection);
  const effectiveCode = useSelector(selectEffectiveProductCode);
  const activeProductId = useSelector(selectActiveProductId);
  const activeProductName = useSelector(selectActiveProductName);
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const dispatch = useDispatch();
  const dpdRows = useSelector(dpdSelectors.selectDPDList);

  const [apiKpis, setApiKpis] = useState<DpdKpisResponse | null>(null);

  /** PR5/PR7 pattern: optional productId for VF list/KPI filters; omitted for DF default. */
  const overviewProductId = useMemo(() => {
    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.productId
    ) {
      return programSelection.productId;
    }
    if (effectiveCode === PRODUCT_CODES.VENDOR_FINANCE && activeProductId) {
      return activeProductId;
    }
    return null;
  }, [
    programSelection?.programScope,
    programSelection?.productId,
    effectiveCode,
    activeProductId,
  ]);

  const productBreadcrumbLabel = useMemo(() => {
    if (activeProductName) {
      return activeProductName;
    }
    return PRODUCT_DISPLAY_NAMES[effectiveCode];
  }, [activeProductName, effectiveCode]);

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
    const payload: FetchDPDListRequest = {};

    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.programId
    ) {
      payload.programIds = [programSelection.programId];
    }

    if (overviewProductId) {
      payload.productId = overviewProductId;
    }

    const selectedBuckets = appliedFilters['DPD Buckets'] || [];
    if (selectedBuckets.length > 0) {
      payload.buckets = selectedBuckets.map(label => BUCKET_VALUE_MAP[label]);
    }

    dispatch(dpdActions.fetchDPDListRequest(payload));

    invoiceApi
      .getDpdKpis(
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
    appliedFilters,
    kpiProgramIds,
    overviewProductId,
    dispatch,
  ]);

  const getVal = (val: string | number | undefined | null) =>
    val != null && val !== ''
      ? `₹ ${Number(val).toLocaleString('en-IN', {minimumFractionDigits: 2})}`
      : '-';

  const getOverdueVal = (val: string | number | undefined | null) =>
    `₹ ${Number(val != null && val !== '' ? val : 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })}`;

  const dpdMetrics = useMemo(() => {
    const dpdRow = apiKpis?.disbursedInvoices?.[0];
    const overdueRaw = apiKpis?.overdueSum?.[0];
    const overdueRow =
      overdueRaw != null && typeof overdueRaw === 'object' ? overdueRaw : null;
    const osRow = apiKpis?.totalOsResult?.[0];
    const averageDpd = Number(
      dpdRow?.average_dpd != null && dpdRow.average_dpd !== ''
        ? dpdRow.average_dpd
        : 0,
    );

    return [
      {
        label: 'DPD Bucket Movement',
        subValues: [
          {label: '0-30 Days', value: dpdRow?.dpd_1_30 ?? '0'},
          {label: '31-60 Days', value: dpdRow?.dpd_31_60 ?? '0'},
          {label: '61-90 Days', value: dpdRow?.dpd_61_90 ?? '0'},
        ],
      },
      {
        label: 'Average DPD',
        value: averageDpd.toFixed(2),
      },
      {
        label: 'Gross NPA % (DPD > 90 D)',
        value: apiKpis?.gross_npa_percent ?? '0.00%',
      },
      {
        label: 'Total Overdue Amount',
        subValues: [
          {
            label: 'Principal Amount',
            value: getOverdueVal(overdueRow?.total_principal_outstanding),
          },
          {
            label: 'Interest Amount',
            value: getOverdueVal(overdueRow?.total_base_interest_outstanding),
          },
          {
            label: 'Penal Interest Amount',
            value: getOverdueVal(overdueRow?.total_penal_outstanding),
          },
        ],
      },
      {
        label: 'Total Outstanding Amount',
        subValues: [
          {
            label: 'Principal Amount',
            value: getVal(osRow?.totalPrincipalOutstanding),
          },
          {
            label: 'Interest Amount',
            value: getVal(osRow?.totalBaseInterestOutstanding),
          },
          {
            label: 'Penal Interest Amount',
            value: getVal(osRow?.totalPenalOutstanding),
          },
        ],
      },
    ];
  }, [apiKpis]);

  const filteredData = useMemo(() => {
    let data = dpdRows;
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          (item.partyName?.toLowerCase() || '').includes(term) ||
          (item.counterPartyName?.toLowerCase() || '').includes(term) ||
          (item.loan_ref_no?.toLowerCase() || '').includes(term) ||
          (item.invoice_ref_no?.toLowerCase() || '').includes(term) ||
          (item.program_name?.toLowerCase() || '').includes(term),
      );
    }
    return data;
  }, [searchText, dpdRows]);

  const handleInvoiceNoPress = useCallback(
    (row: (typeof dpdRows)[number]) => {
      if (!row.id) return;
      (navigation as any).navigate('InvoiceDetailView', {
        invoiceId: row.id,
        invoiceNo: row.invoice_ref_no,
        returnRoute: 'DPDPenalInterestNPAScreen',
        listInvoiceStatus: row.invoice_status,
      });
    },
    [navigation],
  );

  return (
    <Container>
      <AppBar
        title="Transactions > DPD / Penal Interest / NPA"
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
          <Text style={styles.pageTitleText}>DPD / Penal Interest / NPA</Text>
        </View>

        <View style={styles.cardGrid}>
          {dpdMetrics.map((metric, index) => {
            const hasSubValues = (metric as any).subValues;
            const isLongLabel = metric.label.startsWith('Gross NPA');
            return (
              <View key={index} style={styles.card}>
                <Text
                  style={[
                    styles.cardLabel,
                    styles.centerText,
                    isLongLabel && styles.cardLabelSmall,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {metric.label}
                </Text>
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
          {filteredData.map((row, index) => (
            <View key={row.id} style={styles.cardWrapper}>
              <View style={styles.listCard}>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Loan Ref No.</Text>
                    <Text style={styles.infoValue}>{row.loan_ref_no ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice No.</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleInvoiceNoPress(row)}
                      disabled={!row.id || !row.invoice_ref_no}>
                      <Text style={[styles.infoValue, styles.linkText]}>
                        {row.invoice_ref_no ?? '-'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Program Name</Text>
                    <Text style={styles.infoValue}>{row.program_name ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Date</Text>
                    <Text style={styles.infoValue}>{formatDate(row.invoice_date) || '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Due Date</Text>
                    <Text style={styles.infoValue}>{formatDate(row.invoice_due_date) || '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disbursement Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.disbursed_amount ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Accrued Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.interest_accrued ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disbursed Amount</Text>
                    <Text style={styles.infoValue}>{row.disbursed_amount ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>DPD Days</Text>
                    <Text style={styles.infoValue}>
                      {row.dpd_days != null ? String(row.dpd_days) : '-'}
                    </Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>O/S Principal Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.outstanding_principal ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>O/S Interest Accrued Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.interest_accrued ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>O/S Penal Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.penal_interest ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>O/S Total Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.total_outstanding ?? '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>NPA Status</Text>
                    <Text style={[styles.infoValue, {color: row.npa_status === true ? Colors.red : row.npa_status === false ? Colors.green : Colors.darkblack}]}>
                      {row.npa_status === true ? 'Yes' : row.npa_status === false ? 'No' : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => { setAppliedFilters(filters); setShowFilterModal(false); }}
        filterData={dpdFilterData}
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
  cardLabelSmall: { fontSize: scaleFont(11) },
  cardValue: { fontSize: scaleFont(18), fontFamily: Fonts.GilroyBold, color: Colors.primaryColor, textAlign: 'center' },
  cardValueBlack: { color: Colors.darkblack },
  centerText: { textAlign: 'center' },
  subValuesContainer: { marginTop: scaleHeight(8), gap: scaleHeight(4) },
  subValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: scaleHeight(2) },
  subLabel: { fontSize: scaleFont(11), color: Colors.graybase, fontFamily: Fonts.GilroyMedium },
  subValue: { fontSize: scaleFont(11), fontFamily: Fonts.GilroyBold, color: Colors.primaryColor },
  invoicesHeader: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8), marginBottom: scaleHeight(12) },
  invoicesLabel: { fontSize: scaleFont(16), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  badge: { backgroundColor: Colors.primaryColor, borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4), minWidth: scaleWidth(40), alignItems: 'center' },
  badgeText: { color: Colors.white, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold },
  searchFilterRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), marginBottom: scaleHeight(12) },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(12), gap: scaleWidth(6) },
  searchInput: { flex: 1, fontSize: scaleFont(14), color: Colors.darkblack, padding: 0 },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryColor, paddingHorizontal: scaleWidth(16), paddingVertical: scaleHeight(12), borderRadius: scaleWidth(12), gap: scaleWidth(6) },
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
  menuItemTextDanger: { color: Colors.red, fontFamily: Fonts.GilroySemiBold },
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
  statusGreen: { color: Colors.green, fontFamily: Fonts.GilroySemiBold },
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
