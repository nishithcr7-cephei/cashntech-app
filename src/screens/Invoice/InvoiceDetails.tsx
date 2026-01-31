import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  AppBar,
  CheckerApprovalModal,
  Container,
  FilterModal,
  ProgramBreadcrumb,
  UploadModal,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Upload, Plus, Dots} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';

// Sample data matching the screenshot
const invoiceData = [
  {
    id: '1',
    dealerName: 'Mahesh Motors',
    dealerCode: 'DLR001',
    invoiceNo: 'INV-1001',
    invoiceAmount: '₹1,20,000',
    requestedAmount: '₹1,18,000',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹1,10,500',
    invoiceDate: '12/10/2024',
    invoiceStatus: 'Created',
    approvalStatus: 'Pending',
    adminStatus: '-',
    disbursementDate: '15/10/2024',
    tenorEndDate: '15/10/2025',
    utrNo: 'UTR568920',
  },
  {
    id: '2',
    dealerName: 'Krishna Auto',
    dealerCode: 'DLR002',
    invoiceNo: 'INV-1002',
    invoiceAmount: '₹95,000',
    requestedAmount: '₹92,000',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹90,500',
    invoiceDate: '18/10/2024',
    invoiceStatus: 'Created',
    approvalStatus: 'Pending',
    adminStatus: '-',
    disbursementDate: '15/10/2024',
    tenorEndDate: '15/10/2025',
    utrNo: 'UTR568920',
  },
  {
    id: '3',
    dealerName: 'Shree Ganesh Trade',
    dealerCode: 'DLR003',
    invoiceNo: 'INV-1003',
    invoiceAmount: '₹2,30,000',
    requestedAmount: '₹2,25,000',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹2,20,000',
    invoiceDate: '20/10/2024',
    invoiceStatus: 'Created',
    approvalStatus: 'Pending',
    adminStatus: '-',
    disbursementDate: '15/10/2024',
    tenorEndDate: '15/10/2025',
    utrNo: 'UTR568920',
  },
  {
    id: '4',
    dealerName: 'Hero Finance',
    dealerCode: '012',
    invoiceNo: '123101010',
    invoiceAmount: '₹20,000,000.00',
    requestedAmount: '₹19,980,000',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹0.00',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Created',
    approvalStatus: 'Pending',
    adminStatus: '-',
    disbursementDate: 'dd-mm-yyyy',
    tenorEndDate: 'dd-mm-yyyy',
    utrNo: '1234567877',
  },
  {
    id: '5',
    dealerName: 'ABC Finance',
    dealerCode: '012',
    invoiceNo: '123101010',
    invoiceAmount: '₹20,000,000.00',
    requestedAmount: '₹19,980,000',
    piAmount: '₹20,000',
    netDisbursalAmount: '₹0.00',
    invoiceDate: 'dd-mm-yyyy',
    invoiceStatus: 'Created',
    approvalStatus: 'Pending',
    adminStatus: '-',
    disbursementDate: 'dd-mm-yyyy',
    tenorEndDate: 'dd-mm-yyyy',
    utrNo: '1234567877',
  },
];

// Dummy filter data for Invoice Details
const invoiceFilterData = {
  'Invoice Status': ['Created', 'Pending', 'Approved', 'Rejected'],
  'Dealer Name': ['Hero Finance', 'ABC Finance', 'SK Finance', 'Seven Pharma', 'New Finance'],
  'Finance Status': ['Active', 'Inactive', 'Pending'],
};

export const InvoiceDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

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

  const handleMenuToggle = (invoiceId: string) => {
    if (openMenuId === invoiceId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const ref = menuButtonRefs.current[invoiceId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(invoiceId);
      });
    } else {
      // Fallback: open without anchor (top-right)
      setMenuAnchor(null);
      setOpenMenuId(invoiceId);
    }
  };

  const handleMenuAction = (action: string, invoiceId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    const invoiceNo =
      invoiceData.find(item => item.id === invoiceId)?.invoiceNo ?? invoiceId;
    
    switch (action) {
      case 'edit':
        // Navigate to Create Invoice page for editing
        (navigation as any).navigate('CreateInvoice', {
          invoiceId,
          invoiceNo,
          mode: 'edit',
        });
        break;
      case 'checkerApproval':
        // Show checker approval modal
        setSelectedInvoiceId(invoiceId);
        setShowCheckerApprovalModal(true);
        break;
      case 'recreateInvoice':
        // Navigate to Create Invoice page
        (navigation as any).navigate('CreateInvoice', {
          invoiceId,
          invoiceNo,
          mode: 'recreate',
        });
        break;
      case 'attachment':
        // Show attachment upload modal
        setSelectedInvoiceId(invoiceId);
        setShowAttachmentModal(true);
        break;
      case 'print':
        // Print functionality - nothing for now
        console.log('Print invoice:', invoiceId);
        break;
      case 'delete':
        Alert.alert(
          'Delete Invoice',
          'Are you sure you want to delete this invoice?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                // TODO: Call delete API here
                // Example:
                // const {error} = await deleteInvoice(invoiceId);
                // if (!error) {
                //   // Remove from list or refresh
                // }
                console.log('Delete invoice:', invoiceId);
              },
            },
          ],
        );
        break;
    }
  };

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    if (file && selectedInvoiceId) {
      // TODO: Upload file to API
      // Example:
      // await uploadInvoiceAttachment(selectedInvoiceId, file);
      console.log('Upload attachment for invoice:', selectedInvoiceId, file.name);
    }
    setShowAttachmentModal(false);
    setSelectedInvoiceId(null);
  };

  return (
    <Container>
      <AppBar 
        title="Invoice Details"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Invoice Details</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}>
        <Text style={styles.sectionSubtitle}>Invoice Details</Text>
        {/* Controls Section */}
        <View style={styles.controlsSection}>
          {/* Row 1: Dealers Badge */}
          <View style={styles.topRow}>
            <View style={styles.dealersBadgeContainer}>
              <Text style={styles.dealersLabel}>Dealer Wise Invoice Details</Text>
              <View style={styles.dealersBadge}>
                <Text style={styles.dealersBadgeText}>{invoiceData.length}</Text>
              </View>
            </View>
          </View>

          {/* Row 2: Search + Filter */}
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

          {/* Row 3: Primary actions */}
          <View style={styles.primaryActionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonHalf]}
              onPress={() => navigation.navigate('UploadInvoiceList' as never)}>
              <View style={styles.buttonIconContainer}>
                <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
              </View>
              <Text style={styles.primaryButtonText}>Upload Invoices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonHalf]}
              onPress={() => navigation.navigate('CreateInvoice' as never)}>
              <View style={styles.buttonIconContainer}>
                <Plus width={scaleWidth(14)} height={scaleHeight(14)} />
              </View>
              <Text style={styles.primaryButtonText}>Create Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card List - Same style as unpaid invoices */}
        <View style={styles.listTopSeparator} />
        <View style={styles.verticalList}>
          {paginatedData.map((row, index) => (
            <View key={row.id} style={styles.cardWrapper}>
              <View style={styles.listCard}>
                {/* 3 Dots Action Button */}
                <View
                  ref={(r) => {
                    menuButtonRefs.current[row.id] = r;
                  }}
                  collapsable={false}
                  style={styles.threeDotsButton}>
                  <TouchableOpacity
                    onPress={() => handleMenuToggle(row.id)}
                    activeOpacity={0.7}
                    hitSlop={10}
                    style={styles.threeDotsTouchable}>
                    <Dots
                      width={scaleWidth(20)}
                      height={scaleHeight(20)}
                      style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardHeaderContainer}>
                  {/* Row 1: Hero Finance and 3 Dots */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{row.dealerName}</Text>
                  </View>
                  
                  {/* Row 2: Invoice/Unique Ref. No */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardSubtitle}>
                      Invoice / Unique Ref. No: {row.invoiceNo}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Dealer Code</Text>
                    <Text style={styles.infoValue}>{row.dealerCode}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice / Unique Ref. No</Text>
                    <Text style={styles.infoValue}>{row.invoiceNo}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Requested Amount</Text>
                    <Text style={styles.infoValue}>{row.requestedAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disbursed Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.netDisbursalAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Date</Text>
                    <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Status</Text>
                    <Text style={styles.infoValue}>{row.invoiceStatus}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Approval Status</Text>
                    <Text style={styles.infoValue}>{row.approvalStatus}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Admin Status</Text>
                    <Text style={styles.infoValue}>{row.adminStatus}</Text>
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
        filterData={invoiceFilterData}
        appliedFilters={appliedFilters}
      />

      {/* Checker Approval Modal */}
      <CheckerApprovalModal
        visible={showCheckerApprovalModal}
        onClose={() => {
          setShowCheckerApprovalModal(false);
          setSelectedInvoiceId(null);
        }}
        approvedBy="Company Name_Checker"
        approvalDate="dd-mm-yyyy"
      />

      {/* Attachment Upload Modal */}
      <UploadModal
        visible={showAttachmentModal}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={handleAttachmentUpload}
      />

      {/* Action Menu Modal (prevents backdrop from blocking taps on Android) */}
      <Modal
        transparent
        visible={!!openMenuId}
        animationType="fade"
        onRequestClose={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}>
        <Pressable
          style={styles.menuModalOverlay}
          onPress={() => {
            setOpenMenuId(null);
            setMenuAnchor(null);
          }}>
          <Pressable
            style={[styles.actionMenu, getMenuPosition(menuAnchor)]}
            onPress={() => {}}>
            <TouchableOpacity
              onPress={() => handleMenuAction('edit', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="pencil"
                iconStyle="solid"
                color={Colors.darkblack}
                size={16}
              />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMenuAction('checkerApproval', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="calendar-check"
                iconStyle="solid"
                color={Colors.darkblack}
                size={16}
              />
              <Text style={styles.menuText}>Checker Approval</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMenuAction('recreateInvoice', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="square-plus"
                iconStyle="solid"
                color={Colors.darkblack}
                size={16}
              />
              <Text style={styles.menuText}>Recreate Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMenuAction('attachment', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="paperclip"
                iconStyle="solid"
                color={Colors.darkblack}
                size={16}
              />
              <Text style={styles.menuText}>Attachment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMenuAction('print', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="print"
                iconStyle="solid"
                color={Colors.darkblack}
                size={16}
              />
              <Text style={styles.menuText}>Print</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMenuAction('delete', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="trash"
                iconStyle="solid"
                color={Colors.red}
                size={16}
              />
              <Text style={[styles.menuText, styles.deleteMenuText]}>Delete</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Container>
  );
};

const getMenuPosition = (anchor: {x: number; y: number; width: number; height: number} | null) => {
  const screen = Dimensions.get('window');
  const menuWidth = scaleWidth(180);
  const horizontalPadding = scaleWidth(12);
  const topPadding = scaleHeight(8);

  if (!anchor) {
    return {
      position: 'absolute' as const,
      top: topPadding + scaleHeight(60),
      right: horizontalPadding,
    };
  }

  const desiredLeft = anchor.x + anchor.width - menuWidth;
  const left = Math.max(
    horizontalPadding,
    Math.min(desiredLeft, screen.width - menuWidth - horizontalPadding),
  );

  const top = Math.max(topPadding, anchor.y + anchor.height + scaleHeight(6));

  return {
    position: 'absolute' as const,
    top,
    left,
  };
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: Colors.white,
  },
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
  sectionSubtitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(8),
    marginTop: scaleHeight(12),
  },
  controlsSection: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(16),
    gap: scaleHeight(16),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
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
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginTop: scaleHeight(12),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
    justifyContent: 'center',
    minWidth: scaleWidth(100),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(4),
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(10),
    gap: scaleWidth(6),
  },
  primaryButtonHalf: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(10),
  },
  buttonIconContainer: {
    width: scaleWidth(18),
    height: scaleHeight(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
  },
  // Card styles - matching InvoiceDashboard
  listTopSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E6',
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(12),
  },
  verticalList: {
    marginTop: scaleHeight(8),
    gap: scaleHeight(12),
  },
  cardWrapper: {
    position: 'relative',
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
  cardHeaderContainer: {
    marginBottom: scaleHeight(12),
    paddingRight: scaleWidth(50),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
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
  statusChipContainer: {
    marginTop: scaleHeight(4),
  },
  statusChip: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    backgroundColor: '#E6F7EF',
    alignSelf: 'flex-start',
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
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  threeDotsTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionMenu: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: scaleWidth(180),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  menuText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  deleteMenuText: {
    color: Colors.red,
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

