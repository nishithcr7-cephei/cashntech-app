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

// Summary metrics for Disbursement
const disbursementMetrics = [
  {label: 'Dealers', value: '5'},
  {label: 'Total Invoices Submitted', value: '12'},
  {label: 'Total Dis. Amount', value: '₹ 20,000,000.00'},
  {label: 'Disbursed Amount', value: '₹ 9,20,000'},
  {label: 'Pending Dis. Amount', value: '₹ 8,20,000'},
];

// Disbursement invoice rows
const disbursementRows = Array.from({length: 5}).map((_, index) => ({
  id: `disbursement-${index}`,
  primaryParty: 'Hero Finanace',
  loanRefNo: '125423',
  invoiceNo: '1234566',
  invoiceAmount: '25,000.00/-',
  invoiceDate: 'dd-mm-yyyy',
  requestDate: 'dd-mm-yyyy',
  dueDate: 'dd-mm-yyyy',
  disbursedDate: 'dd-mm-yyyy',
  invoiceStatus: 'Submitted',
}));

// Filter data
const disbursementFilterData = {
  'Primary Party': ['Hero Finanace', 'ABC Finance', 'SK Finance'],
  'Invoice Status': ['Submitted', 'Pending', 'Disbursed'],
  'Loan Ref No.': ['125423', '125424', '125425'],
};

export const DisbursementScreen: React.FC = () => {
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const programSelection = useSelector(selectProgramSelection);
  const isAnchorMaker = userRole === 'anchor_maker';
  const programName = programSelection?.programName ?? 'Sun Pharma PGM';
  
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  const filteredData = useMemo(() => {
    let data = disbursementRows;
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term),
      );
    }
    return data;
  }, [searchText]);


  return (
    <Container>
      <AppBar
        title="Transactions > Disbursement"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Program Title */}
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>{programName}</Text>
        </View>

        {/* Summary Metrics - Grid Cards Layout */}
        <View style={styles.cardGrid}>
          {disbursementMetrics.map((metric, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardLabel}>{metric.label}</Text>
              <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Invoices Section */}
        <View style={styles.invoicesHeader}>
          <Text style={styles.invoicesLabel}>Invoices</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{filteredData.length}</Text>
          </View>
        </View>

        {/* Search and Filter */}
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
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}>
            <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Invoice List */}
        <View style={styles.verticalList}>
          {filteredData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Primary Party</Text>
                      <Text style={styles.infoValue}>{row.primaryParty}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Loan Ref No.</Text>
                      <Text style={styles.infoValue}>{row.loanRefNo}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice No</Text>
                      <Text style={styles.infoValue}>{row.invoiceNo}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Amount</Text>
                      <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Date</Text>
                      <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Request Date</Text>
                      <Text style={styles.infoValue}>{row.requestDate}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Due Date</Text>
                      <Text style={styles.infoValue}>{row.dueDate}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Disbursed Date</Text>
                      <Text style={styles.infoValue}>{row.disbursedDate}</Text>
                    </View>
                    <View style={styles.infoColumn}>
                      <Text style={styles.infoLabel}>Invoice Status</Text>
                      <Text style={[styles.infoValue, styles.statusGreen]}>
                        {row.invoiceStatus}
                      </Text>
                    </View>
                  </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
        }}
        filterData={disbursementFilterData}
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
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(8),
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
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  verticalList: {
    gap: scaleHeight(12),
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
  statusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
});
