import React, {useMemo, useState, useRef, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {dpdActions, dpdSelectors, DPDRecord} from '@store/dpd';
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
import Endpoints from '@constants/ApiEndPoints';
import {RecordRepaymentModal} from './DPDPenalInterestNPAScreen/RecordRepaymentModal';
import {PaymentHistoryModal} from './DPDPenalInterestNPAScreen/PaymentHistoryModal';
import {RequestWaiverModal} from './DPDPenalInterestNPAScreen/RequestWaiverModal';

const dpdMetrics = [
  {
    label: 'DPD Bucket Movement',
    subValues: [
      { label: '0-30 Days', value: '₹ 9,86,452.35' },
      { label: '31-60 Days', value: '₹ 4,72,190.80' },
      { label: '61-90 Days', value: '₹ 2,18,764.55' },
    ],
  },
  {
    label: 'Top 10 Overdue Accounts',
    subValues: [
      { label: 'By Amount', value: '₹ 6,84,920.25' },
      { label: 'By DPD', value: '87 Days' },
    ],
  },
  {
    label: 'Gross NPA % (DPD > 90 D)',
    value: '4.38%',
  },
  {
    label: 'Total Outstanding Amount',
    value: '₹ 22,64,718.40',
  },
  {
    label: 'Total Overdue Amount',
    value: '₹ 6,77,407.70',
  },
];



const dpdFilterData = {
  'Primary Party': ['Sun Pharma', 'Hero Finanace', 'ABC Finance'],
  'Bank Name': ['UGRO', 'TCL'],
  'Invoice Status': ['Closed', 'Open'],
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
  const programName = programSelection?.programName ?? 'Sun Pharma PGM';
  const isDealerMaker = userRole === 'dealer_maker';

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [selectedRow, setSelectedRow] = useState<DPDRecord | null>(null);

  const dispatch = useDispatch();
  const dpdRows = useSelector(dpdSelectors.selectDPDList);
  const loading = useSelector(dpdSelectors.selectDPDLoading);

  useEffect(() => {
    let payload = {};
    if (programSelection?.programScope === 'all') {
      payload = {};
    } else if (programSelection?.programId) {
      payload = {programIds: [programSelection.programId]};
    }
    dispatch(dpdActions.fetchDPDListRequest(payload));
  }, [programSelection, dispatch]);

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

  return (
    <Container>
      <AppBar
        title="Transactions > DPD / Penal Interest / NPA"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>DPD / Penal Interest / NPA</Text>
        </View>

        <View style={styles.cardGrid}>
          {dpdMetrics.map((metric, index) => {
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

        <View style={styles.invoicesHeader}>
          <Text style={styles.invoicesLabel}>Invoices</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{filteredData.length}</Text>
          </View>
        </View>

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
                    <Text style={styles.infoValue}>{row.loan_ref_no}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice No</Text>
                    <Text style={styles.infoValue}>{row.invoice_ref_no}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Program Name</Text>
                    <Text style={styles.infoValue}>{row.program_name}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.disbursed_amount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Date</Text>
                    <Text style={styles.infoValue}>{formatDate(row.invoice_date)}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disburse Amount</Text>
                    <Text style={styles.infoValue}>{row.disbursed_amount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>DPD Days</Text>
                    <Text style={styles.infoValue}>{row.dpd_days}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Due Date</Text>
                    <Text style={styles.infoValue}>{formatDate(row.invoice_due_date)}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Outstanding Principal</Text>
                    <Text style={styles.infoValue}>{row.outstanding_principal}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Cumulative Interest</Text>
                    <Text style={styles.infoValue}>{row.interest_accrued}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Penal Interest</Text>
                    <Text style={styles.infoValue}>{row.penal_interest}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Total Outstanding</Text>
                    <Text style={styles.infoValue}>{row.total_outstanding}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>NPA Status</Text>
                    <Text style={[styles.infoValue, {color: row.npa_status ? Colors.red : Colors.green}]}>
                      {row.npa_status !== undefined ? String(row.npa_status) : ''}
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
});
