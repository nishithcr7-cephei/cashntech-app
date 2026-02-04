import React, {useState, useMemo, useEffect} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
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
import {fetchInvoiceListRequest} from '@store/invoice/inv.slice';
import {
  selectInvoiceList,
  selectInvoiceListLoading,
  selectInvoiceListError,
} from '@store/invoice/inv.selector';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import type {InvoiceListItemApi} from '@store/invoice/inv.types';

const NA_AD = 'N/A/AD';

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

function formatStatus(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

type InvoiceRow = {
  id: string;
  dealerName: string;
  dealerCode: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceDueDate: string;
  invoiceStatus: string;
  approvalStatus: string;
};

function mapApiToRow(item: InvoiceListItemApi): InvoiceRow {
  return {
    id: item.id,
    dealerName: item.counter_party_name,
    dealerCode: item.counter_party_code,
    invoiceNo: item.invoice_ref_no,
    invoiceDate: formatDate(item.invoice_date),
    invoiceDueDate: formatDate(item.invoice_due_date),
    invoiceStatus: formatStatus(item.invoice_status),
    approvalStatus: formatStatus(item.approval_status),
  };
}

// Filter options - API values (CREATED, IN_PROGRESS, etc.)
const invoiceFilterData = {
  'Invoice Status': ['CREATED', 'IN_PROGRESS', 'SUBMITTED', 'REJECTED'],
  'Approval Status': [
    'PENDING_ANCHOR_CHECKER',
    'PENDING_DEALER_MAKER',
    'PENDING_DEALER_CHECKER',
    'APPROVAL_COMPLETE',
    'REJECTED_BY_ANCHOR_CHECKER',
    'REJECTED_BY_DEALER_MAKER',
    'REJECTED_BY_DEALER_CHECKER',
  ],
};

export const InvoiceDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const programSelection = useSelector(selectProgramSelection);
  const invoiceListRaw = useSelector(selectInvoiceList);
  const invoiceListLoading = useSelector(selectInvoiceListLoading);
  const invoiceListError = useSelector(selectInvoiceListError);

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

  const programId = programSelection?.programId;

  const apiFilters = useMemo(() => {
    const inv = appliedFilters['Invoice Status'];
    const appr = appliedFilters['Approval Status'];
    const body: {byInvoiceStatus?: string[]; byApprovalStatus?: string[]} = {};
    if (inv?.length) body.byInvoiceStatus = inv;
    if (appr?.length) body.byApprovalStatus = appr;
    return Object.keys(body).length ? body : undefined;
  }, [appliedFilters]);

  useEffect(() => {
    if (programId) {
      dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
    }
  }, [programId, apiFilters, dispatch]);

  const invoiceData = useMemo(
    () => invoiceListRaw.map(mapApiToRow),
    [invoiceListRaw],
  );

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return invoiceData;
    const term = searchText.toLowerCase();
    return invoiceData.filter(
      item =>
        item.dealerName.toLowerCase().includes(term) ||
        item.dealerCode.toLowerCase().includes(term) ||
        item.invoiceNo.toLowerCase().includes(term),
    );
  }, [invoiceData, searchText]);


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
      filteredData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceId;
    
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
        <Text style={styles.pageTitleText}>Invoice List</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}>
        {!programId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Select a program first to view invoice list.
            </Text>
          </View>
        ) : invoiceListError ? (
          <View style={styles.emptyState}>
            <Text style={styles.errorStateText}>{invoiceListError}</Text>
          </View>
        ) : (
          <>
        {/* Controls Section */}
        <View style={styles.controlsSection}>
          {/* Row 1: Dealers Badge */}
          <View style={styles.topRow}>
            <View style={styles.dealersBadgeContainer}>
              <Text style={styles.dealersLabel}>Dealer Wise Invoice List Details</Text>
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
        {invoiceListLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading invoices...</Text>
          </View>
        ) : (
        <View style={styles.verticalList}>
          {filteredData.map((row) => (
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
                    <Text style={[styles.infoValue, styles.infoValueNaAd]}>{NA_AD}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Requested Amount</Text>
                    <Text style={[styles.infoValue, styles.infoValueNaAd]}>{NA_AD}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disbursed Amount (₹)</Text>
                    <Text style={[styles.infoValue, styles.infoValueNaAd]}>{NA_AD}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Date</Text>
                    <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Due Date</Text>
                    <Text style={styles.infoValue}>{row.invoiceDueDate}</Text>
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
                    <Text style={[styles.infoValue, styles.infoValueNaAd]}>{NA_AD}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disbursement Date</Text>
                    <Text style={[styles.infoValue, styles.infoValueNaAd]}>{NA_AD}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Tenor End Date</Text>
                    <Text style={[styles.infoValue, styles.infoValueNaAd]}>{NA_AD}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>UTR No.</Text>
                    <Text style={[styles.infoValue, styles.infoValueNaAd]}>{NA_AD}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
        )}
        </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
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
  infoValueNaAd: {
    color: Colors.tertiaryBlue,
    fontFamily: Fonts.GilroySemiBold,
  },
  loadingContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  emptyState: {
    paddingVertical: scaleHeight(40),
    paddingHorizontal: scaleWidth(16),
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
  },
  errorStateText: {
    fontSize: scaleFont(14),
    color: Colors.red,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
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
});

