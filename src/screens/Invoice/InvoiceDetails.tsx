import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AppBar, Container} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Upload, Plus} from '@assets/Icons';

// Sample data matching the screenshot
const invoiceData = [
  {
    id: '1',
    dealerName: 'Hero Finance',
    dealerCode: '012',
    invoiceNo: '123101010',
    invoiceAmount: '₹20,000,000.00',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹0.00',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Created',
    disbursementDate: 'dd-mm-yyyy',
    tenorEndDate: 'dd-mm-yyyy',
    utrNo: '1234567877',
  },
  {
    id: '2',
    dealerName: 'ABC Finance',
    dealerCode: '012',
    invoiceNo: '123101010',
    invoiceAmount: '₹20,000,000.00',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹0.00',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Created',
    disbursementDate: 'dd-mm-yyyy',
    tenorEndDate: 'dd-mm-yyyy',
    utrNo: '1234567877',
  },
  {
    id: '3',
    dealerName: 'SK Finance',
    dealerCode: '012',
    invoiceNo: '123101010',
    invoiceAmount: '₹20,000,000.00',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹0.00',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Created',
    disbursementDate: 'dd-mm-yyyy',
    tenorEndDate: 'dd-mm-yyyy',
    utrNo: '1234567877',
  },
  {
    id: '4',
    dealerName: 'Seven Pharma',
    dealerCode: '012',
    invoiceNo: '123101010',
    invoiceAmount: '₹20,000,000.00',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹0.00',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Created',
    disbursementDate: 'dd-mm-yyyy',
    tenorEndDate: 'dd-mm-yyyy',
    utrNo: '1234567877',
  },
  {
    id: '5',
    dealerName: 'New Finance',
    dealerCode: '012',
    invoiceNo: '123101010',
    invoiceAmount: '₹20,000,000.00',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹0.00',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Created',
    disbursementDate: 'dd-mm-yyyy',
    tenorEndDate: 'dd-mm-yyyy',
    utrNo: '1234567877',
  },
];

export const InvoiceDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return invoiceData;
    const term = searchText.toLowerCase();
    return invoiceData.filter(
      item =>
        item.dealerName.toLowerCase().includes(term) ||
        item.dealerCode.toLowerCase().includes(term) ||
        item.invoiceNo.toLowerCase().includes(term),
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
      <AppBar title="Invoice Details" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Controls Section */}
        <View style={styles.controlsSection}>
          <View style={styles.dealersBadgeContainer}>
            <Text style={styles.dealersLabel}>Dealers</Text>
            <View style={styles.dealersBadge}>
              <Text style={styles.dealersBadgeText}>100</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Search width={scaleWidth(18)} height={scaleHeight(18)} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.graybase}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <TouchableOpacity style={styles.filterButton}>
            <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Import</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton}>
            <View style={styles.buttonIconContainer}>
              <Plus width={scaleWidth(16)} height={scaleHeight(16)} />
            </View>
            <Text style={styles.primaryButtonText}>Upload Invoices</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton}>
            <View style={styles.buttonIconContainer}>
              <Plus width={scaleWidth(16)} height={scaleHeight(16)} />
            </View>
            <Text style={styles.primaryButtonText}>Create Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Card List - Same style as unpaid invoices */}
        <View style={styles.verticalList}>
          {paginatedData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealerName}</Text>
                  <Text style={styles.cardSubtitle}>
                    Invoice / Unique Ref. No: {row.invoiceNo}
                  </Text>
                </View>
                <View style={[styles.statusChip, styles.statusSuccessChip]}>
                  <Text style={[styles.statusChipText, styles.statusSuccessText]}>
                    {row.invoiceStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Dealer Code</Text>
                  <Text style={styles.infoValue}>{row.dealerCode}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>PI Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.piAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Net Disbursal Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.netDisbursalAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Date</Text>
                  <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disbursement Date</Text>
                  <Text style={styles.infoValue}>{row.disbursementDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Tenor End Date</Text>
                  <Text style={styles.infoValue}>{row.tenorEndDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>UTR No.</Text>
                  <Text style={styles.infoValue}>{row.utrNo}</Text>
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
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
    marginTop: scaleHeight(16),
    marginBottom: scaleHeight(16),
  },
  dealersBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  dealersLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  dealersBadge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  dealersBadgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
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
    minWidth: scaleWidth(150),
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
  actionButton: {
    backgroundColor: Colors.gray200,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
  },
  actionButtonText: {
    color: Colors.darkblack,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  buttonIconContainer: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  // Card styles - matching InvoiceDashboard
  verticalList: {
    gap: scaleHeight(12),
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    shadowColor: '#00000010',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  statusChip: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    backgroundColor: '#E6F7EF',
  },
  statusChipText: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(12),
  },
  statusSuccessChip: {
    backgroundColor: '#E6F7EF',
  },
  statusSuccessText: {
    color: Colors.green,
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
  // Pagination styles
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

