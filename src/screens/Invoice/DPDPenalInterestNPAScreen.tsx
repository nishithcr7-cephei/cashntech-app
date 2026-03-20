import React, {useMemo, useState, useRef} from 'react';
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
import {useSelector} from 'react-redux';
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
import {RecordRepaymentModal} from './DPDPenalInterestNPAScreen/RecordRepaymentModal';
import {PaymentHistoryModal} from './DPDPenalInterestNPAScreen/PaymentHistoryModal';
import {RequestWaiverModal} from './DPDPenalInterestNPAScreen/RequestWaiverModal';

const dpdMetrics = [
  {label: 'Total DPD Records', value: '₹20,000,000.00'},
  {label: 'Total Outstanding Amount', value: '₹1,20,000'},
  {label: 'Total Penal Interest', value: '₹1,20,000'},
  {label: '90+ DPD', value: '₹8,20,000'},
  {label: '', value: '12'},
];

const dpdRows = Array.from({length: 5}).map((_, index) => ({
  id: `dpd-${index}`,
  loanRefNo: '125423',
  invoiceNo: '1234566',
  bankName: 'UGRO',
  productName: 'Dealer Finance',
  programName: 'Sun Pharma PGM',
  primaryParty: 'Sun Pharma',
  counterParty: 'Hero Finanace',
  invoiceAmount: '25,000.00/-',
  invoiceDate: 'dd-mm-yyyy',
  disbursedAmount: '25,000/-',
  totalOutstandingAmount: '25,000/-',
  outstandingPrincipleAmt: '25,000/-',
  dueDate: 'dd-mm-yyyy',
  invoiceStatus: 'Closed',
}));

const dpdFilterData = {
  'Primary Party': ['Sun Pharma', 'Hero Finanace', 'ABC Finance'],
  'Bank Name': ['UGRO', 'TCL'],
  'Invoice Status': ['Closed', 'Open'],
  'Loan Ref No.': ['125423', '125424', '125425'],
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = useRef<Record<string, any>>({});
  const [showRecordRepaymentModal, setShowRecordRepaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [showRequestWaiverModal, setShowRequestWaiverModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<typeof dpdRows[0] | null>(null);

  const filteredData = useMemo(() => {
    let data = dpdRows;
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.counterParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term) ||
          (item.bankName?.toLowerCase() || '').includes(term),
      );
    }
    return data;
  }, [searchText]);

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
      case 'recordRepayment':
        setShowRecordRepaymentModal(true);
        break;
      case 'paymentHistory':
        setShowPaymentHistoryModal(true);
        break;
      case 'requestWaiver':
        setShowRequestWaiverModal(true);
        break;
      case 'delete':
        if (row) {
          Alert.alert(
            'Delete',
            'Are you sure you want to delete this entry?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setSelectedRow(null) },
              { text: 'Delete', style: 'destructive', onPress: () => {
                void row.id;
                void row.loanRefNo;
                setSelectedRow(null);
              }},
            ]
          );
        }
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

  return (
    <Container>
      <AppBar
        title="Transactions > DPD / Penal Interest / NPA"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView
        contentContainerStyle={styles.content}
        onScrollBeginDrag={() => { setOpenMenuId(null); setMenuAnchor(null); }}>
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>DPD / Penal Interest / NPA</Text>
        </View>

        <View style={styles.cardGrid}>
          {dpdMetrics.map((metric, index) => (
            <View key={index} style={styles.card}>
              {metric.label ? <Text style={styles.cardLabel}>{metric.label}</Text> : null}
              <Text style={[styles.cardValue, !metric.label && styles.cardValueBlack]} numberOfLines={1} adjustsFontSizeToFit>
                {metric.value}
              </Text>
            </View>
          ))}
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
              placeholder="Search Entity"
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
          {filteredData.map(row => (
            <View key={row.id} style={styles.cardWrapper}>
              <View style={styles.listCard}>
                <TouchableOpacity
                  ref={r => { if (r) menuButtonRefs.current[row.id] = r; }}
                  style={styles.threeDotsButton}
                  onPress={() => handleMenuToggle(row.id)}
                  activeOpacity={0.7}>
                  <Dots width={scaleWidth(20)} height={scaleHeight(20)} style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}} />
                </TouchableOpacity>
                <View style={styles.infoGrid}>
                  {isDealerMaker ? (
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Counter Party</Text>
                      <Text style={styles.infoValue}>{row.counterParty}</Text>
                    </View>
                  ) : (
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Primary Party</Text>
                      <Text style={styles.infoValue}>{row.primaryParty}</Text>
                    </View>
                  )}
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
                    <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Date</Text>
                    <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disbursed Amount</Text>
                    <Text style={styles.infoValue}>{row.disbursedAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Total Outstanding Amount</Text>
                    <Text style={styles.infoValue}>{row.totalOutstandingAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Outstanding Principle Amo.</Text>
                    <Text style={styles.infoValue}>{row.outstandingPrincipleAmt}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Due Date</Text>
                    <Text style={styles.infoValue}>{row.dueDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Status</Text>
                    <Text style={[styles.infoValue, styles.statusGreen]}>{row.invoiceStatus}</Text>
                  </View>
                  {isDealerMaker ? (
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Primary Party</Text>
                      <Text style={styles.infoValue}>{row.primaryParty}</Text>
                    </View>
                  ) : (
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Counter Party</Text>
                      <Text style={styles.infoValue}>{row.counterParty}</Text>
                    </View>
                  )}
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

      <Modal transparent visible={!!openMenuId} animationType="fade" onRequestClose={() => { setOpenMenuId(null); setMenuAnchor(null); }}>
        <Pressable style={styles.menuOverlay} onPress={() => { setOpenMenuId(null); setMenuAnchor(null); }}>
          <Pressable style={[styles.actionMenu, getMenuPosition(menuAnchor)]} onPress={e => e.stopPropagation()}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('recordRepayment', openMenuId as string)}>
              <FontAwesome6 name="calendar-check" iconStyle="solid" color={Colors.darkblack} size={16} />
              <Text style={styles.menuItemText}>Record Repayment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('paymentHistory', openMenuId as string)}>
              <FontAwesome6 name="clock-rotate-left" iconStyle="solid" color={Colors.darkblack} size={16} />
              <Text style={styles.menuItemText}>Payment History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('requestWaiver', openMenuId as string)}>
              <FontAwesome6 name="file-circle-question" iconStyle="solid" color={Colors.darkblack} size={16} />
              <Text style={styles.menuItemText}>Request Waiver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('delete', openMenuId as string)}>
              <FontAwesome6 name="trash" iconStyle="solid" color={Colors.red} size={16} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <RecordRepaymentModal
        visible={showRecordRepaymentModal}
        onClose={() => { setShowRecordRepaymentModal(false); setSelectedRow(null); }}
        accountNo={selectedRow?.loanRefNo ?? '(Account No.)'}
        totalOutstanding={selectedRow?.totalOutstandingAmount?.replace('/-', '') ?? '25,10,556'}
        onSubmit={data => {
          void selectedRow?.id;
          void data;
          setShowRecordRepaymentModal(false);
          setSelectedRow(null);
        }}
      />

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
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleWidth(12), marginTop: scaleHeight(8), marginBottom: scaleHeight(16) },
  card: {
    flexBasis: '47%',
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: '#FFD9D9',
    minWidth: 0,
  },
  cardLabel: { fontSize: scaleFont(13), color: Colors.graybase, marginBottom: scaleHeight(6) },
  cardValue: { fontSize: scaleFont(16), fontFamily: Fonts.GilroySemiBold, color: Colors.primaryColor, flexShrink: 1, minWidth: 0 },
  cardValueBlack: { color: Colors.darkblack },
  invoicesHeader: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(8), marginBottom: scaleHeight(12) },
  invoicesLabel: { fontSize: scaleFont(16), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
  badge: { backgroundColor: Colors.primaryColor, borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(4), minWidth: scaleWidth(40), alignItems: 'center' },
  badgeText: { color: Colors.white, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold },
  searchFilterRow: { flexDirection: 'row', alignItems: 'center', gap: scaleWidth(12), marginBottom: scaleHeight(12) },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: scaleWidth(12), paddingHorizontal: scaleWidth(14), paddingVertical: scaleHeight(12), gap: scaleWidth(8) },
  searchInput: { flex: 1, fontSize: scaleFont(14), color: Colors.darkblack, padding: 0 },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryColor, paddingHorizontal: scaleWidth(18), paddingVertical: scaleHeight(12), borderRadius: scaleWidth(12), gap: scaleWidth(6) },
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
  statusGreen: { color: Colors.green, fontFamily: Fonts.GilroySemiBold },
});
