import React, {useMemo, useState} from 'react';
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
import {Search, Filter} from '@assets/Icons';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';

// Summary metrics for Repayment & Settlement
const repaymentMetrics = [
  {label: 'Total Dis. Amount', value: '₹20,000,000.00'},
  {label: 'Total Recovered Amount', value: '₹1,20,000'},
  {label: 'Total Outstanding Amount', value: '₹1,20,000'},
  {label: 'Overdue Amount', value: '₹8,20,000'},
  {label: 'Total Closed Invoices', value: '12'},
];

const repaymentRows = Array.from({length: 5}).map((_, index) => ({
  id: `repayment-${index}`,
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
}));

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
  const programName = programSelection?.programName ?? 'Sun Pharma PGM';
  const isDealerMaker = userRole === 'dealer_maker';

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const filteredData = useMemo(() => {
    let data = repaymentRows;
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

  return (
    <Container>
      <AppBar
        title="Transactions > Repayment & Settlement"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>Repayment and Settlement</Text>
        </View>

        <View style={styles.cardGrid}>
          {repaymentMetrics.map((metric, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardLabel}>{metric.label}</Text>
              <Text style={[styles.cardValue, index === 4 && styles.cardValueBlack]} numberOfLines={1} adjustsFontSizeToFit>
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
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {filteredData.map(row => (
            <View key={row.id} style={styles.cardWrapper}>
              <View style={styles.listCard}>
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
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(8),
  },
  searchInput: { flex: 1, fontSize: scaleFont(14), color: Colors.darkblack, padding: 0 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterButtonText: { color: Colors.white, fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold },
  exportButton: { paddingHorizontal: scaleWidth(16), paddingVertical: scaleHeight(12), borderRadius: scaleWidth(12), backgroundColor: '#E0E0E0', justifyContent: 'center' },
  exportButtonText: { fontSize: scaleFont(14), fontFamily: Fonts.GilroySemiBold, color: Colors.darkblack },
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
});
