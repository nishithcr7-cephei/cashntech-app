import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  Alert,
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
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Download, Dots, LeftChevron} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';

// Sample invoice data for a specific dealer
const dealerInvoiceData = [
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
    id: '3',
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
];

// Dummy filter data
const dealerInvoiceFilterData = {
  'Invoice Status': ['Created', 'Approved', 'Rejected', 'Pending'],
  'Dealer Code': ['012', '013', '014'],
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'created':
      return {bg: '#E8F5E9', text: '#4CAF50'};
    case 'approved':
      return {bg: '#E3F2FD', text: '#2196F3'};
    case 'rejected':
      return {bg: '#FFEBEE', text: '#F44336'};
    default:
      return {bg: '#F5F5F5', text: Colors.darkblack};
  }
};

export const DealerInvoiceDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorChecker = userRole === 'anchor_checker';
  const invoiceStatusOptions = dealerInvoiceFilterData['Invoice Status'];
  
  // Bulk selection state (Anchor Checker only)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const isBulkMode = isAnchorChecker && selectedInvoiceIds.length > 0;
  
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

  // Get dealer name from route params
  const dealerName = (route.params as any)?.dealerName || 'Hero Finance';

  const toggleInvoiceSelection = (invoiceId: string) => {
    if (!isAnchorChecker) {
      return;
    }
    setSelectedInvoiceIds(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      }
      return [...prev, invoiceId];
    });
  };

  const clearSelection = () => {
    setSelectedInvoiceIds([]);
    setSelectedStatus(null);
  };

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
      setMenuAnchor(null);
      setOpenMenuId(invoiceId);
    }
  };

  const handleMenuAction = (action: string, invoiceId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    const invoice = dealerInvoiceData.find(item => item.id === invoiceId);
    const invoiceNo = invoice?.invoiceNo || invoiceId;

    switch (action) {
      case 'checkerApproval':
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setShowCheckerApprovalModal(true);
        break;
      case 'approveReject':
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setShowApproveRejectModal(true);
        break;
    }
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

    const rightSpace = screen.width - anchor.x - anchor.width;
    const leftSpace = anchor.x;

    if (rightSpace >= menuWidth + horizontalPadding) {
      return {
        position: 'absolute' as const,
        top: anchor.y + anchor.height + topPadding,
        left: anchor.x + anchor.width - menuWidth,
      };
    } else if (leftSpace >= menuWidth + horizontalPadding) {
      return {
        position: 'absolute' as const,
        top: anchor.y + anchor.height + topPadding,
        right: screen.width - anchor.x,
      };
    } else {
      return {
        position: 'absolute' as const,
        top: anchor.y + anchor.height + topPadding,
        right: horizontalPadding,
      };
    }
  };

  const filteredData = useMemo(() => {
    let data = dealerInvoiceData;
    
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          item.dealerName.toLowerCase().includes(term) ||
          item.dealerCode.toLowerCase().includes(term) ||
          item.invoiceNo.toLowerCase().includes(term) ||
          item.invoiceStatus.toLowerCase().includes(term),
      );
    }
    
    return data;
  }, [searchText]);

  // Derived selection helpers (based on currently visible invoices)
  const visibleInvoiceIds = filteredData.map(item => item.id);
  const allSelectedOnScreen =
    visibleInvoiceIds.length > 0 &&
    visibleInvoiceIds.every(id => selectedInvoiceIds.includes(id));

  const handleExport = () => {
    void dealerName;
  };

  const toggleSelectAllVisible = () => {
    if (!isAnchorChecker || visibleInvoiceIds.length === 0) {
      return;
    }

    setSelectedInvoiceIds(prev => {
      if (allSelectedOnScreen) {
        // Unselect only the currently visible invoices
        return prev.filter(id => !visibleInvoiceIds.includes(id));
      }

      // Add all visible invoices to selection (keep any previously selected)
      const next = new Set(prev);
      visibleInvoiceIds.forEach(id => next.add(id));
      return Array.from(next);
    });
  };

  const handleApplyBulkStatus = () => {
    if (!selectedStatus || selectedInvoiceIds.length === 0) {
      return;
    }

    // TODO: Call bulk status update API here using selectedInvoiceIds & selectedStatus

    Alert.alert(
      'Status Updated',
      `${selectedInvoiceIds.length} invoice${
        selectedInvoiceIds.length > 1 ? 's' : ''
      } status updated to ${selectedStatus}.`,
    );

    setShowStatusModal(false);
    clearSelection();
  };

  return (
    <Container>
      <AppBar 
        title="Invoice Details" 
        navigation={navigation as any}
        hideHamburger={false}
        renderLeftIcon={
          <LeftChevron 
            height={scaleWidth(16)} 
            width={scaleHeight(16)} 
            color={Colors.primaryColor}
          />
        }
        onPressLeftIcon={() => navigation.goBack()}
      />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Invoice Details</Text>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Anchor Wise Invoice Details Badge Header */}
        <View style={styles.dealersHeader}>
          <View style={styles.dealersBadgeContainer}>
            <Text style={styles.dealersLabel}>Anchor Wise Invoice Details</Text>
            <View style={styles.dealersBadge}>
              <Text style={styles.dealersBadgeText}>100</Text>
            </View>
          </View>

          {isAnchorChecker && (
            <TouchableOpacity
              style={styles.selectAllRow}
              activeOpacity={0.8}
              onPress={toggleSelectAllVisible}>
              <View
                style={[
                  styles.checkboxBox,
                  allSelectedOnScreen && styles.checkboxBoxSelected,
                ]}>
                {allSelectedOnScreen && (
                  <Text style={styles.checkboxTick}>✓</Text>
                )}
              </View>
              <Text style={styles.selectAllText}>Select all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search, Filter and Export Toolbar */}
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Search width={scaleWidth(18)} height={scaleHeight(18)} />
            <TextInput
              style={styles.searchInput}
              placeholder="Q Search"
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
          <TouchableOpacity 
            style={styles.exportBtn}
            onPress={handleExport}>
            <Download width={scaleWidth(18)} height={scaleHeight(18)} />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Invoice List - Card View */}
        <View style={styles.verticalList}>
          {filteredData.map((row) => {
            const statusColors = getStatusColor(row.invoiceStatus);
            const isSelected = selectedInvoiceIds.includes(row.id);
            return (
              <View key={row.id} style={styles.cardWrapper}>
                <View style={styles.listCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.headerSelectableRow}
                        onPress={() => toggleInvoiceSelection(row.id)}>
                        {isAnchorChecker && (
                          <View
                            style={[
                              styles.checkboxBox,
                              isSelected && styles.checkboxBoxSelected,
                            ]}>
                            {isSelected && (
                              <Text style={styles.checkboxTick}>✓</Text>
                            )}
                          </View>
                        )}
                        <View style={styles.cardHeaderTextContainer}>
                          <Text style={styles.cardTitle}>{row.dealerName}</Text>
                          <Text style={styles.cardSubtitle}>
                            Invoice / Unique Ref. No: {row.invoiceNo}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cardHeaderRight}>
                      <View style={[styles.statusChip, {backgroundColor: statusColors.bg}]}>
                        <Text style={[styles.statusChipText, {color: statusColors.text}]}>
                          {row.invoiceStatus}
                        </Text>
                      </View>
                      {/* 3 Dots Action Button - Only for Anchor Checker - Positioned on right */}
                      {isAnchorChecker && !isBulkMode && (
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
                    </View>
                  </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Dealer Name</Text>
                    <Text style={styles.infoValue}>{row.dealerName}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Dealer Code</Text>
                    <Text style={styles.infoValue}>{row.dealerCode}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice / Unique Ref. No.</Text>
                    <Text style={styles.infoValue}>{row.invoiceNo}</Text>
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
                    <Text style={styles.infoLabel}>Net Disbursal Amount</Text>
                    <Text style={styles.infoValue}>{row.netDisbursalAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Date</Text>
                    <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Status</Text>
                    <Text style={[styles.infoValue, {color: statusColors.text}]}>
                      {row.invoiceStatus}
                    </Text>
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
            );
          })}
        </View>
      </ScrollView>

      {/* Bulk Status Action Bar - Anchor Checker only */}
      {isAnchorChecker && selectedInvoiceIds.length > 0 && (
        <View style={styles.bulkActionBar}>
          <View style={styles.bulkActionLeft}>
            <Text style={styles.bulkSelectedText}>
              {selectedInvoiceIds.length} invoice
              {selectedInvoiceIds.length > 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity onPress={clearSelection}>
              <Text style={styles.bulkClearText}>Clear selection</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.bulkPrimaryButton}
            activeOpacity={0.9}
            onPress={() => setShowStatusModal(true)}>
            <Text style={styles.bulkPrimaryText}>Change Status</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Checker Approval Modal */}
      <CheckerApprovalModal
        visible={showCheckerApprovalModal}
        onClose={() => {
          setShowCheckerApprovalModal(false);
          setSelectedInvoiceId(null);
          setSelectedInvoiceNo(null);
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
        invoiceId={selectedInvoiceId}
        invoiceNo={selectedInvoiceNo || undefined}
        invoiceDetails={{
          subTotal: '10,80,025/-',
          withholdingTaxesPercent: undefined,
          withholdingAmount: undefined,
          finalPayableAmount: '10,80,025/-',
          finalDueDate: 'dd-mm-yyyy',
        }}
        onClose={() => {
          setShowApproveRejectModal(false);
          setSelectedInvoiceId(null);
          setSelectedInvoiceNo(null);
        }}
        onApprove={(invoiceId, remarks) => {
          void remarks;
          setShowApproveRejectModal(false);
          const invoiceNo = selectedInvoiceNo || invoiceId;
          (navigation as any).navigate('InvoiceDetailView', {
            invoiceId,
            invoiceNo,
          });
          setSelectedInvoiceId(null);
          setSelectedInvoiceNo(null);
        }}
        onReject={(invoiceId, remarks) => {
          void invoiceId;
          void remarks;
          setSelectedInvoiceId(null);
          setSelectedInvoiceNo(null);
        }}
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

      {/* Bulk Status Bottom Sheet */}
      {isAnchorChecker && (
        <Modal
          transparent
          animationType="slide"
          visible={showStatusModal}
          onRequestClose={() => setShowStatusModal(false)}>
          <Pressable
            style={styles.statusModalOverlay}
            onPress={() => setShowStatusModal(false)}>
            <Pressable
              style={styles.statusModalContainer}
              onPress={() => {}}>
              <Text style={styles.statusModalTitle}>Change invoice status</Text>
              <Text style={styles.statusModalSubtitle}>
                Apply to {selectedInvoiceIds.length} selected invoice
                {selectedInvoiceIds.length > 1 ? 's' : ''}
              </Text>

              {invoiceStatusOptions.map(status => {
                const isActive = selectedStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={styles.statusOptionRow}
                    activeOpacity={0.8}
                    onPress={() => setSelectedStatus(status)}>
                    <View
                      style={[
                        styles.statusOptionRadio,
                        isActive && styles.statusOptionRadioSelected,
                      ]}>
                      {isActive && <View style={styles.statusOptionRadioInner} />}
                    </View>
                    <Text style={styles.statusOptionText}>{status}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.statusModalButtonsRow}>
                <TouchableOpacity
                  style={[styles.statusButton, styles.statusCancelButton]}
                  onPress={() => {
                    setShowStatusModal(false);
                    setSelectedStatus(null);
                  }}>
                  <Text
                    style={[
                      styles.statusButtonText,
                      styles.statusCancelButtonText,
                    ]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    styles.statusApplyButton,
                    !selectedStatus && styles.statusApplyButtonDisabled,
                  ]}
                  onPress={handleApplyBulkStatus}
                  disabled={!selectedStatus}>
                  <Text style={styles.statusApplyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          // TODO: Apply filters to data later
        }}
        filterData={dealerInvoiceFilterData}
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
  dealersHeader: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9E9E9E',
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  exportText: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: scaleWidth(8),
  },
  headerSelectableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardHeaderTextContainer: {
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  threeDotsButton: {
    zIndex: 10,
  },
  threeDotsTouchable: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F5F5F5',
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
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(180),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(12),
  },
  menuText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
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
  },
  statusChipText: {
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
  // Checkbox styles (reused from registration screen)
  checkboxBox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    marginRight: scaleWidth(8),
    marginTop: scaleHeight(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(12),
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(8),
  },
  selectAllText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  // Bulk action bar
  bulkActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bulkActionLeft: {
    flex: 1,
  },
  bulkSelectedText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  bulkClearText: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    color: Colors.graybase,
    textDecorationLine: 'underline',
  },
  bulkPrimaryButton: {
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(12),
    backgroundColor: Colors.primaryColor,
    marginLeft: scaleWidth(12),
  },
  bulkPrimaryText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  // Status modal (bottom sheet)
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  statusModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(16),
    borderTopRightRadius: scaleWidth(16),
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(20),
  },
  statusModalTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  statusModalSubtitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(12),
  },
  statusOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
  },
  statusOptionRadio: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderRadius: scaleWidth(9),
    borderWidth: 1,
    borderColor: Colors.graybase,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(10),
  },
  statusOptionRadioSelected: {
    borderColor: Colors.primaryColor,
  },
  statusOptionRadioInner: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    backgroundColor: Colors.primaryColor,
  },
  statusOptionText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  statusModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: scaleHeight(16),
    gap: scaleWidth(8),
  },
  statusButton: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(10),
  },
  statusCancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  statusCancelButtonText: {
    color: Colors.darkblack,
  },
  statusApplyButton: {
    backgroundColor: Colors.primaryColor,
  },
  statusApplyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  statusApplyButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
});
