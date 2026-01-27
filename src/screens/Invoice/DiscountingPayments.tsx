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
import {AppBar, Container, FilterModal} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter} from '@assets/Icons';

// Sample data matching the web screenshot
const discountingPaymentsData = [
  {
    id: '1',
    dealerName: 'Hero Finance',
    invoiceRefNo: '123101010',
    amount: '₹20,000,000.00',
    paidDate: '15-12-2024',
    transactionRef: 'UTR32432432',
  },
  {
    id: '2',
    dealerName: 'Tata Finance',
    invoiceRefNo: '12355253',
    amount: '₹15,500,000.00',
    paidDate: '14-12-2024',
    transactionRef: 'UTR32432433',
  },
  {
    id: '3',
    dealerName: 'ABC Finance',
    invoiceRefNo: '123101011',
    amount: '₹10,200,000.00',
    paidDate: '13-12-2024',
    transactionRef: 'UTR32432434',
  },
  {
    id: '4',
    dealerName: 'SK Finance',
    invoiceRefNo: '123101012',
    amount: '₹8,750,000.00',
    paidDate: '12-12-2024',
    transactionRef: 'UTR32432435',
  },
  {
    id: '5',
    dealerName: 'Seven Pharma',
    invoiceRefNo: '123101013',
    amount: '₹12,300,000.00',
    paidDate: '11-12-2024',
    transactionRef: 'UTR32432436',
  },
];

// Dummy filter data for Discounting Payments
const discountingPaymentsFilterData = {
  'Dealer Name': ['Hero Finance', 'Tata Finance', 'ABC Finance', 'SK Finance', 'Seven Pharma'],
  'Invoice Ref No': ['123101010', '12355253', '123101011', '123101012', '123101013'],
  'Transaction Ref': ['UTR32432432', 'UTR32432433', 'UTR32432434', 'UTR32432435', 'UTR32432436'],
};

export const DiscountingPayments: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return discountingPaymentsData;
    const term = searchText.toLowerCase();
    return discountingPaymentsData.filter(
      item =>
        item.dealerName.toLowerCase().includes(term) ||
        item.invoiceRefNo.toLowerCase().includes(term) ||
        item.transactionRef.toLowerCase().includes(term) ||
        item.amount.toLowerCase().includes(term),
    );
  }, [searchText]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  return (
    <Container>
      <AppBar 
        title="Invoice Dashboard" 
        navigation={navigation as any}
        showProgramSelector={true}
      />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Discountings</Text>
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

        {/* Payment List - Vertical Card View */}
        <View style={styles.verticalList}>
          {paginatedData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealerName}</Text>
                  <Text style={styles.cardSubtitle}>
                    Invoice / Unique Ref. No: {row.invoiceRefNo}
                  </Text>
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
                  <Text style={styles.infoLabel}>Paid Date</Text>
                  <Text style={styles.infoValue}>{row.paidDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Transaction Ref.</Text>
                  <Text style={styles.infoValue}>{row.transactionRef}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Pagination */}
        <View style={styles.paginationContainer}>
          <View style={styles.paginationLeft}>
            <Text style={styles.paginationText}>Show</Text>
            <View style={styles.paginationDropdown}>
              <Text style={styles.paginationDropdownText}>
                {entriesPerPage}
              </Text>
            </View>
            <Text style={styles.paginationText}>Entries</Text>
          </View>

          <View style={styles.paginationRight}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled,
              ]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}>
              <Text
                style={[
                  styles.paginationButtonText,
                  currentPage === 1 && styles.paginationButtonTextDisabled,
                ]}>
                Prev
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paginationPageButton,
                currentPage === 1 && styles.paginationPageButtonActive,
              ]}
              onPress={() => setCurrentPage(1)}>
              <Text
                style={[
                  styles.paginationPageButtonText,
                  currentPage === 1 && styles.paginationPageButtonTextActive,
                ]}>
                1
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled,
              ]}
              onPress={() =>
                setCurrentPage(prev => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}>
              <Text
                style={[
                  styles.paginationButtonText,
                  currentPage === totalPages &&
                    styles.paginationButtonTextDisabled,
                ]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
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
        filterData={discountingPaymentsFilterData}
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleHeight(16),
    paddingVertical: scaleHeight(12),
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  paginationText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  paginationDropdown: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(4),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(50),
  },
  paginationDropdownText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  paginationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  paginationButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(4),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  paginationButtonTextDisabled: {
    color: Colors.graybase,
  },
  paginationPageButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(4),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paginationPageButtonActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  paginationPageButtonText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  paginationPageButtonTextActive: {
    color: Colors.white,
    fontFamily: Fonts.GilroySemiBold,
  },
});
