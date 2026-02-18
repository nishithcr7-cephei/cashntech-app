import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {
  AppBar,
  Container,
  FilterModal,
  ProgramBreadcrumb,
  CheckerApprovalModal,
  ApproveRejectModal,
  UploadModal,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Dots} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';

// Sample data for OD Details
const odDetailsData = [
  {
    id: '1',
    anchor: 'Anchor Company A',
    creditAccount: 'OD123456',
    sanctionedLimit: '₹1,00,000',
    drawingPower: '₹85,000',
    utilizedLimit: '₹15,000',
    pipelineRequests: '₹5,000',
    excessCredit: '₹0',
    availableLimit: '₹70,000',
    overdueAmount: '₹0',
    odExpiryDate: '31-12-2024',
    overdueDays: 0,
    status: 'Regular',
  },
  {
    id: '2',
    anchor: 'Anchor Company B',
    creditAccount: 'OD123457',
    sanctionedLimit: '₹2,00,000',
    drawingPower: '₹1,80,000',
    utilizedLimit: '₹20,000',
    pipelineRequests: '₹10,000',
    excessCredit: '₹0',
    availableLimit: '₹1,50,000',
    overdueAmount: '₹0',
    odExpiryDate: '31-12-2024',
    overdueDays: 0,
    status: 'Regular',
  },
];

// Dummy filter data
const odDetailsFilterData = {
  'Anchor': ['Anchor Company A', 'Anchor Company B'],
  'Status': ['Regular', 'Overdue'],
};

export const ODDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  
  // Role-based visibility flags
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerMaker = userRole === 'dealer_maker';
  
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedOdId, setSelectedOdId] = useState<string | null>(null);
  const [selectedOdNo, setSelectedOdNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

  const filteredData = useMemo(() => {
    let data = odDetailsData;
    
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          item.anchor.toLowerCase().includes(term) ||
          item.creditAccount.toLowerCase().includes(term),
      );
    }

    return data;
  }, [searchText, appliedFilters]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const appBarTitle = isDealerMaker ? 'OD Account Details' : 'OD Details';

  const handleMenuToggle = (odId: string) => {
    if (openMenuId === odId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const ref = menuButtonRefs.current[odId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(odId);
      });
    } else {
      // Fallback: open without anchor (top-right)
      setMenuAnchor(null);
      setOpenMenuId(odId);
    }
  };

  const handleMenuAction = (action: string, odId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    switch (action) {
      case 'checkerApproval':
        // Show checker approval modal
        setSelectedOdId(odId);
        setShowCheckerApprovalModal(true);
        break;
      case 'attachment':
        // Show attachment upload modal
        setSelectedOdId(odId);
        setShowAttachmentModal(true);
        break;
      case 'print':
        // Print functionality
        console.log('Print OD details:', odId);
        break;
      case 'approveReject':
        // Show approve/reject modal
        setSelectedOdId(odId);
        setSelectedOdNo(odId); // Using odId as invoiceNo for now
        setShowApproveRejectModal(true);
        break;
    }
  };

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    if (file && selectedOdId) {
      // TODO: Upload file to API
      console.log('Upload attachment for OD:', selectedOdId, file.name);
    }
    setShowAttachmentModal(false);
    setSelectedOdId(null);
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

  return (
    <Container>
      <AppBar title={appBarTitle} navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>OD Details</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* OD Details Badge Header */}
        <View style={styles.badgeHeader}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeLabel}>OD Accounts</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filteredData.length}</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter Toolbar */}
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Search width={scaleWidth(18)} height={scaleHeight(18)} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
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

        {/* OD Details List - Vertical Card View */}
        <View style={styles.verticalList}>
          {paginatedData.map(row => (
            <View key={row.id} style={styles.cardWrapper}>
              <View style={styles.listCard}>
                {/* 3 Dots Action Button - Only for Anchor Checker */}
                {isAnchorChecker && (
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
                )}

                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.cardTitle}>{row.anchor}</Text>
                    <Text style={styles.cardSubtitle}>
                      OD Account: {row.creditAccount}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, row.status === 'Regular' ? styles.statusRegular : styles.statusOverdue]}>
                    <Text style={styles.statusText}>{row.status}</Text>
                  </View>
                </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Anchor</Text>
                  <Text style={styles.infoValue}>{row.anchor}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Credit Account</Text>
                  <Text style={styles.infoValue}>{row.creditAccount}</Text>
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
                  <Text style={[styles.infoValue, row.excessCredit !== '₹0' && styles.excessValue]}>
                    {row.excessCredit}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Available Limit</Text>
                  <Text style={styles.infoValue}>{row.availableLimit}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Overdue Amount</Text>
                  <Text style={[styles.infoValue, row.overdueAmount !== '₹0' && styles.overdueValue]}>
                    {row.overdueAmount}
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>OD Expiry Date</Text>
                  <Text style={styles.infoValue}>{row.odExpiryDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Overdue Days</Text>
                  <Text style={[styles.infoValue, row.overdueDays > 0 && styles.overdueValue]}>
                    {row.overdueDays} Days
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>{row.status}</Text>
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
          setCurrentPage(1);
        }}
        filterData={odDetailsFilterData}
        appliedFilters={appliedFilters}
      />

      {/* Checker Approval Modal */}
      <CheckerApprovalModal
        visible={showCheckerApprovalModal}
        onClose={() => {
          setShowCheckerApprovalModal(false);
          setSelectedOdId(null);
        }}
        approvalEntries={[
          {
            id: '1',
            approvedBy: 'Company Name_Checker',
            approvalDate: '01-02-2026',
            status: 'Approved',
          },
          {
            id: '2',
            approvedBy: 'Another Checker',
            approvalDate: '05-02-2026',
            status: 'Rejected',
          },
        ]}
      />

      {/* Approve/Reject Modal */}
      <ApproveRejectModal
        visible={showApproveRejectModal}
        invoiceId={selectedOdId}
        invoiceNo={selectedOdNo || undefined}
        invoiceDetails={{
          subTotal: '10,80,025/-',
          withholdingTaxesPercent: '0.00/-',
          withholdingAmount: '0.00/-',
          finalPayableAmount: '10,80,025/-',
          finalDueDate: 'dd-mm-yyyy',
        }}
        onClose={() => {
          setShowApproveRejectModal(false);
          setSelectedOdId(null);
          setSelectedOdNo(null);
        }}
        onApprove={(odId, remarks) => {
          // TODO: Call approve API
          console.log('Approve OD:', odId, remarks);
          // After API success, navigate to invoice detail view
          setShowApproveRejectModal(false);
          const invoiceNo = selectedOdNo || odId;
          (navigation as any).navigate('InvoiceDetailView', {
            invoiceId: odId,
            invoiceNo,
          });
          setSelectedOdId(null);
          setSelectedOdNo(null);
        }}
        onReject={(odId, remarks) => {
          // TODO: Call reject API
          console.log('Reject OD:', odId, remarks);
          setSelectedOdId(null);
          setSelectedOdNo(null);
        }}
      />

      {/* Attachment Upload Modal */}
      <UploadModal
        visible={showAttachmentModal}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={handleAttachmentUpload}
      />

      {/* Action Menu Modal - Only for Anchor Checker */}
      {isAnchorChecker && (
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
              {/* Anchor Checker: Approve/Reject, Checker Approval only */}
              <TouchableOpacity
                onPress={() => handleMenuAction('approveReject', openMenuId as string)}
                style={styles.menuItem}>
                <FontAwesome6
                  name="check"
                  iconStyle="solid"
                  color={Colors.darkblack}
                  size={16}
                />
                <Text style={styles.menuText}>Approve / Reject</Text>
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
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
  badgeHeader: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  badgeLabel: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
    paddingRight: scaleWidth(50),
  },
  cardHeaderContent: {
    flex: 1,
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
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(8),
  },
  statusRegular: {
    backgroundColor: '#E8F5E9',
  },
  statusOverdue: {
    backgroundColor: '#FFEBEE',
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
  excessValue: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  overdueValue: {
    color: Colors.red,
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
});
