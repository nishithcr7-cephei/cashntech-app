import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AppBar, Container, FilterModal, ProgramBreadcrumb} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Dots} from '@assets/Icons';

// Sample data matching the web screenshot
const rejectedFinancesData = [
  {
    id: '1',
    dealerName: 'Hero Finance',
    invoiceRefNo: '123101010',
    amount: '₹20,000',
    piAmount: '₹2,000',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Regular',
    financeStatus: '₹19,998,900.00',
    disbursementDate: 'dd-mm-yyyy',
    disbAmount: '₹0.00',
    utrNo: '30',
  },
  {
    id: '2',
    dealerName: 'Hero Finance',
    invoiceRefNo: '123101010',
    amount: '₹20,000',
    piAmount: '₹2,000',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Regular',
    financeStatus: '₹19,998,900.00',
    disbursementDate: 'dd-mm-yyyy',
    disbAmount: '₹0.00',
    utrNo: '30',
  },
  {
    id: '3',
    dealerName: 'Hero Finance',
    invoiceRefNo: '123101010',
    amount: '₹20,000',
    piAmount: '₹2,000',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Regular',
    financeStatus: '₹19,998,900.00',
    disbursementDate: 'dd-mm-yyyy',
    disbAmount: '₹0.00',
    utrNo: '30',
  },
  {
    id: '4',
    dealerName: 'Hero Finance',
    invoiceRefNo: '123101010',
    amount: '₹20,000',
    piAmount: '₹2,000',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Regular',
    financeStatus: '₹19,998,900.00',
    disbursementDate: 'dd-mm-yyyy',
    disbAmount: '₹0.00',
    utrNo: '30',
  },
  {
    id: '5',
    dealerName: 'Hero Finance',
    invoiceRefNo: '123101010',
    amount: '₹20,000',
    piAmount: '₹2,000',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Regular',
    financeStatus: '₹19,998,900.00',
    disbursementDate: 'dd-mm-yyyy',
    disbAmount: '₹0.00',
    utrNo: '30',
  },
];

// Dummy filter data for Rejected Finances
const rejectedFinancesFilterData = {
  'Dealer Name': ['Hero Finance', 'ABC Finance', 'SK Finance', 'Seven Pharma'],
  'Invoice Status': ['Regular', 'Rejected', 'Pending'],
  'Invoice Ref No': ['123101010', '123101011', '123101012'],
};

export const RejectedFinances: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return rejectedFinancesData;
    const term = searchText.toLowerCase();
    return rejectedFinancesData.filter(
      item =>
        item.dealerName.toLowerCase().includes(term) ||
        item.invoiceRefNo.toLowerCase().includes(term) ||
        item.amount.toLowerCase().includes(term),
    );
  }, [searchText]);

  return (
    <Container>
      <AppBar 
        title="Rejected Finances"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Rejected Finances</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Invoice Badge Header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceBadgeContainer}>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <View style={styles.invoiceBadge}>
              <Text style={styles.invoiceBadgeText}>100</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter Toolbar */}
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
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
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}>
            <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Rejected Finances List - Vertical Card View */}
        <View style={styles.verticalList}>
          {filteredData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <TouchableOpacity
                style={styles.moreButton}
                hitSlop={10}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="More actions"
                onPress={() => {
                  // TODO: open actions menu
                }}>
                <Dots
                  width={20}
                  height={20}
                  style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
                />
              </TouchableOpacity>

              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealerName}</Text>
                  <Text style={styles.cardSubtitle}>
                    Invoice / Unique Ref. No: {row.invoiceRefNo}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{row.invoiceStatus}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Dealer Name</Text>
                  <Text style={styles.infoValue}>{row.dealerName}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>
                    Invoice / Unique Ref. No
                  </Text>
                  <Text style={styles.infoValue}>{row.invoiceRefNo}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>{row.amount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>PI Amount</Text>
                  <Text style={styles.infoValue}>{row.piAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Date</Text>
                  <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Finance Status</Text>
                  <Text style={styles.infoValue}>{row.financeStatus}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disbursement Date</Text>
                  <Text style={styles.infoValue}>{row.disbursementDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disb. Amount</Text>
                  <Text style={styles.infoValue}>{row.disbAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>UTR No</Text>
                  <Text style={styles.infoValue}>{row.utrNo}</Text>
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
        onApply={(filters) => {
          setAppliedFilters(filters);
          // TODO: Apply filters to data later
        }}
        filterData={rejectedFinancesFilterData}
        appliedFilters={appliedFilters}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  invoiceHeader: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  invoiceBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  invoiceLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  invoiceBadge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  invoiceBadgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    backgroundColor: Colors.white,
    gap: scaleWidth(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  verticalList: {
    gap: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    // Reserve space for the top-right 3-dots button so it doesn't overlap content
    paddingRight: scaleWidth(56),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  moreButton: {
    position: 'absolute',
    top: scaleHeight(10),
    right: scaleWidth(10),
    zIndex: 2,
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000022',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardSubtitle: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginTop: scaleHeight(4),
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(8),
  },
  statusText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: '#4CAF50',
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
});

