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
import {Search, Filter} from '@assets/Icons';

// Sample data for Credit Account Anchor
const creditAccountData = [
  {
    id: '1',
    dealerName: 'Hero Finance',
    creditAccount: '123101010',
    odExpiryDate: 'dd-mm-yyyy',
    sanctionedLimit: '₹20,000',
    drawingPower: '₹1,100.00',
    utilizedLimit: '₹0.00',
    pipelineRequests: '₹0.00',
    excessCredit: '₹0.00',
    availableLimit: '₹1,100.00',
    overdueDays: 30,
    status: 'Regular',
  },
  {
    id: '2',
    dealerName: 'Hero Finance',
    creditAccount: '123101010',
    odExpiryDate: 'dd-mm-yyyy',
    sanctionedLimit: '₹20,000',
    drawingPower: '₹1,100.00',
    utilizedLimit: '₹0.00',
    pipelineRequests: '₹0.00',
    excessCredit: '₹0.00',
    availableLimit: '₹1,100.00',
    overdueDays: 30,
    status: 'Regular',
  },
  {
    id: '3',
    dealerName: 'Hero Finance',
    creditAccount: '123101010',
    odExpiryDate: 'dd-mm-yyyy',
    sanctionedLimit: '₹20,000',
    drawingPower: '₹1,100.00',
    utilizedLimit: '₹0.00',
    pipelineRequests: '₹0.00',
    excessCredit: '₹0.00',
    availableLimit: '₹1,100.00',
    overdueDays: 30,
    status: 'Regular',
  },
  {
    id: '4',
    dealerName: 'Hero Finance',
    creditAccount: '123101010',
    odExpiryDate: 'dd-mm-yyyy',
    sanctionedLimit: '₹20,000',
    drawingPower: '₹1,100.00',
    utilizedLimit: '₹0.00',
    pipelineRequests: '₹0.00',
    excessCredit: '₹0.00',
    availableLimit: '₹1,100.00',
    overdueDays: 30,
    status: 'Regular',
  },
  {
    id: '5',
    dealerName: 'Hero Finance',
    creditAccount: '123101010',
    odExpiryDate: 'dd-mm-yyyy',
    sanctionedLimit: '₹20,000',
    drawingPower: '₹1,100.00',
    utilizedLimit: '₹0.00',
    pipelineRequests: '₹0.00',
    excessCredit: '₹0.00',
    availableLimit: '₹1,100.00',
    overdueDays: 30,
    status: 'Regular',
  },
];

// Dummy filter data for Credit Account Anchor
const creditAccountFilterData = {
  'Dealer Name': ['Hero Finance', 'ABC Finance', 'SK Finance', 'Seven Pharma'],
  'Status': ['Regular', 'Overdue', 'Pending'],
  'Credit Account': ['123101010', '123101011', '123101012'],
};

export const ANCreditAccount: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return creditAccountData;
    const term = searchText.toLowerCase();
    return creditAccountData.filter(
      item =>
        item.dealerName.toLowerCase().includes(term) ||
        item.creditAccount.toLowerCase().includes(term),
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
      <AppBar title="Payments" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Credit Account Anchor</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Credit Account Badge Header */}
        <View style={styles.creditAccountHeader}>
          <View style={styles.creditAccountBadgeContainer}>
            <Text style={styles.creditAccountLabel}>Credit Account</Text>
            <View style={styles.creditAccountBadge}>
              <Text style={styles.creditAccountBadgeText}>100</Text>
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

        {/* Credit Account List - Vertical Card View */}
        <View style={styles.verticalList}>
          {paginatedData.map(row => (
            <TouchableOpacity
              key={row.id}
              style={styles.listCard}
              onPress={() => {
                navigation.navigate('CreditAccountDetails' as never, {
                  dealerName: row.dealerName,
                  creditAccount: row.creditAccount,
                  anchor: 'Sun Pharma',
                });
              }}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealerName}</Text>
                  <Text style={styles.cardSubtitle}>
                    Credit Account: {row.creditAccount}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{row.status}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Dealer Name</Text>
                  <Text style={styles.infoValue}>{row.dealerName}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Credit Account</Text>
                  <Text style={styles.infoValue}>{row.creditAccount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>OD Expiry Date</Text>
                  <Text style={styles.infoValue}>{row.odExpiryDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Sanctioned Limit</Text>
                  <Text style={styles.infoValue}>{row.sanctionedLimit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Drawing Power</Text>
                  <Text style={styles.infoValue}>{row.drawingPower}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Utilized Limit</Text>
                  <Text style={styles.infoValue}>{row.utilizedLimit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Pipeline Requests</Text>
                  <Text style={styles.infoValue}>{row.pipelineRequests}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Excess Credit</Text>
                  <Text style={styles.infoValue}>{row.excessCredit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Available Limit</Text>
                  <Text style={styles.infoValue}>{row.availableLimit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Overdue Days</Text>
                  <Text style={[styles.infoValue, styles.overdueValue]}>
                    {row.overdueDays} Days
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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
        filterData={creditAccountFilterData}
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
  creditAccountHeader: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  creditAccountBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  creditAccountLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  creditAccountBadge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  creditAccountBadgeText: {
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
  statusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
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
  overdueValue: {
    color: '#FF6B6B',
    fontFamily: Fonts.GilroySemiBold,
  },
  statusValue: {
    color: '#4CAF50',
    fontFamily: Fonts.GilroySemiBold,
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

