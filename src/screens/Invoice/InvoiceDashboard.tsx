import React, {useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Modal,
  Dimensions,
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
  CheckerApprovalModal,
  ApproveRejectModal,
  UploadModal,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Dots, RightChevron} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';

type ProductTabType = 'all_product' | 'dealer_finance' | 'vendor_finance' | 'pid';

const getCardMetrics = (productTab: ProductTabType) => {
  const isAll = productTab === 'all_product' || productTab === 'vendor_finance' || productTab === 'pid';
  return [
    {label: 'Total Program Limit', value: '₹ 100,000,000.00'},
    {label: isAll ? 'No. of Accounts' : "No. of Dealer's Accounts", value: '1'},
    {label: isAll ? 'Limit Uploaded' : 'Dealer Limit Uploaded', value: '₹ 20,000,000.00'},
    {label: 'Utilized Limit', value: '₹ 1,100.00'},
    {label: 'Available Limit', value: '₹ 19,998,900.00'},
    {label: 'Overdue Amount', value: '₹ 0'},
  ];
};

// Summary – columns match web. Include bankName for breadcrumb when navigating to Invoice List & Approval.
const dealerSummaryRows = Array.from({length: 6}).map((_, index) => ({
  id: `dealer-${index}`,
  bankName: index === 0 ? 'UGRO' : 'TCL',
  programName: index === 0 ? 'UGRO DF Program' : 'TCL DF Program',
  primaryParty: 'Sun Pharma',
  counterParty: index === 0 ? '24 hrs medical' : 'All India Medicc',
  odAccount: index === 0 ? '' : '98765432101234',
  drawingPower: index === 0 ? '4,50,00,000.00' : '20,00,000.00',
  utilizedLimit: '-',
  pipelineRequests: '-',
  availableLimit: '-',
  overdueAmount: '-',
  dpdDays: '-',
  status: 'Regular',
}));

const unpaidRows = Array.from({length: 5}).map((_, index) => ({
  id: `unpaid-${index}`,
  dealer: 'Hero Finance',
  invoiceNo: '123101010',
  invoiceAmount: '₹20,000.00',
  piAmount: '₹20,00,000.00',
  invoiceDate: 'dd-mm-yyyy',
  invoiceStatus: 'Created',
  approvalStatus: 'Pending',
  adminStatus: '-',
  financeStatus: index === 0 ? '-' : '₹19,998,900.00',
  disbursementDate: 'dd-mm-yyyy',
  disbAmount: '₹0.00',
  utrNo: '30',
}));

// Dummy filter data for Invoice Dashboard
const dashboardFilterData = {
  'Dealer Name': ['Hero Finance', 'ABC Finance', 'SK Finance', 'Seven Pharma', 'New Finance'],
  'Status': ['Regular', 'Overdue', 'Pending'],
  'OD Account': ['123101010', '12355253', '123101011'],
};

export const InvoiceDashboard: React.FC = () => {
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  
  // Role-based visibility flags
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCheckerRole = isAnchorChecker || isDealerChecker;
  
  const [activeTab, setActiveTab] = useState<'dealers' | 'unpaid'>('dealers');
  const [productTab, setProductTab] = useState<ProductTabType>('all_product');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedDealerNo, setSelectedDealerNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});
  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  const handleMenuToggle = (dealerId: string) => {
    if (openMenuId === dealerId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const ref = menuButtonRefs.current[dealerId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(dealerId);
      });
    } else {
      // Fallback: open without anchor (top-right)
      setMenuAnchor(null);
      setOpenMenuId(dealerId);
    }
  };

  const handleMenuAction = (action: string, dealerId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    switch (action) {
      case 'checkerApproval':
        // Show checker approval modal
        setSelectedDealerId(dealerId);
        setShowCheckerApprovalModal(true);
        break;
      case 'attachment':
        // Show attachment upload modal
        setSelectedDealerId(dealerId);
        setShowAttachmentModal(true);
        break;
      case 'print':
        // Print functionality
        console.log('Print dealer summary:', dealerId);
        break;
      case 'approveReject':
        // Show approve/reject modal
        setSelectedDealerId(dealerId);
        setSelectedDealerNo(dealerId); // Using dealerId as invoiceNo for now
        setShowApproveRejectModal(true);
        break;
    }
  };

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    if (file && selectedDealerId) {
      // TODO: Upload file to API
      console.log('Upload attachment for dealer:', selectedDealerId, file.name);
    }
    setShowAttachmentModal(false);
    setSelectedDealerId(null);
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

  // Dealer Checker: default to "Latest Unpaid Invoices" tab
  React.useEffect(() => {
    if (userRole === 'dealer_checker') {
      setActiveTab('unpaid');
    }
  }, [userRole]);

  const dealerTable = useMemo(
    () => (
      <>
        {(isAnchorMaker || isDealerMaker) && (
          <View style={styles.allProgramHeader}>
            <Text style={styles.allProgramTitle}>All Program</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dealerSummaryRows.length}</Text>
            </View>
          </View>
        )}
        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchPlaceholder}>Search Entity</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}>
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.verticalList}>
          {dealerSummaryRows.map(row => (
            <View key={row.id} style={styles.cardWrapper}>
              <View style={styles.listCard}>
                <TouchableOpacity
                  style={styles.cardHeaderRow}
                  onPress={() => {
                    (navigation as any).navigate('InvoiceDetails', {
                      fromInvoiceDashboard: true,
                      bankName: row.bankName,
                      dealerName: row.counterParty,
                      programName: row.programName,
                    });
                  }}>
                  <View style={styles.cardHeaderContent}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{row.programName}</Text>
                      <RightChevron
                        width={scaleWidth(14)}
                        height={scaleHeight(14)}
                        style={styles.cardTitleChevron}
                      />
                    </View>
                    <Text style={styles.cardSubtitle}>
                      OD Account: {row.odAccount || '-'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Columns same order as web: Program Name, Primary Party, Counter Party, OD Account, Drawing Power (₹), Utilized Limit (₹), Pipeline Requests (₹), Available Limit (₹), Overdue Amount (₹), DPD Days, Status */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Program Name</Text>
                    <Text style={styles.infoValue}>{row.programName}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Primary Party</Text>
                    <Text style={styles.infoValue}>{row.primaryParty}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Counter Party</Text>
                    <Text style={styles.infoValue}>{row.counterParty}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>OD Account</Text>
                    <Text style={styles.infoValue}>{row.odAccount || '-'}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Drawing Power (₹)</Text>
                    <Text style={styles.infoValue}>{row.drawingPower}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Utilized Limit (₹)</Text>
                    <Text style={styles.infoValue}>{row.utilizedLimit}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Pipeline Requests (₹)</Text>
                    <Text style={styles.infoValue}>{row.pipelineRequests}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Available Limit (₹)</Text>
                    <Text style={styles.infoValue}>{row.availableLimit}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Overdue Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.overdueAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>DPD Days</Text>
                    <Text style={styles.infoValue}>{row.dpdDays}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, styles.statusGreenText]}>{row.status}</Text>
                  </View>
                </View>
            </View>
            </View>
          ))}
        </View>
      </>
    ),
    [isCheckerRole, isAnchorMaker, isDealerMaker],
  );

  const unpaidTable = useMemo(
    () => (
      <>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceBadgeContainer}>
            <Text style={styles.invoiceLabel}>Invoice List</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unpaidRows.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.listToolbar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchPlaceholder}>Search by All</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}>
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {unpaidRows.map(row => (
            <TouchableOpacity
              key={row.id}
              style={styles.listCard}
              onPress={() => {
                navigation.navigate('InvoiceDetails', {
                  invoiceId: row.invoiceNo,
                  dealerName: row.dealer,
                });
              }}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.dealer}</Text>
                  <Text style={styles.cardSubtitle}>
                    Invoice / Unique Ref. No: {row.invoiceNo}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>PI Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.piAmount}</Text>
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
                  <Text style={styles.infoLabel}>Finance Status</Text>
                  <Text style={styles.infoValue}>{row.financeStatus}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disbursement Date</Text>
                  <Text style={styles.infoValue}>{row.disbursementDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Disb. Amount (₹)</Text>
                  <Text style={styles.infoValue}>{row.disbAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>UTR No.</Text>
                  <Text style={styles.infoValue}>{row.utrNo}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ),
    [navigation],
  );

  return (
    <Container>
      <AppBar 
        title={
          isDealerChecker
            ? "Invoice"
            : isAnchorChecker
              ? "Transactions > Invoice Overview"
              : "Transactions > Invoice Overview"
        }
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Anchor Maker: Product tabs (All Product / Dealer Finance / Vendor Finance / PID) */}
        {(isAnchorMaker || isDealerMaker) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productTabsScroll}>
            <View style={styles.productTabsRow}>
              <TouchableOpacity
                style={[
                  styles.productTabBtn,
                  productTab === 'all_product' && styles.productTabBtnActive,
                ]}
                onPress={() => setProductTab('all_product')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.productTabText,
                    productTab === 'all_product' && styles.productTabTextActive,
                  ]}>
                  All Product
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.productTabBtn,
                  productTab === 'dealer_finance' && styles.productTabBtnActive,
                ]}
                onPress={() => setProductTab('dealer_finance')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.productTabText,
                    productTab === 'dealer_finance' && styles.productTabTextActive,
                  ]}>
                  Dealer Finance (DF)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.productTabBtn,
                  productTab === 'vendor_finance' && styles.productTabBtnActive,
                ]}
                onPress={() => setProductTab('vendor_finance')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.productTabText,
                    productTab === 'vendor_finance' && styles.productTabTextActive,
                  ]}>
                  Vendor Finance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.productTabBtn,
                  productTab === 'pid' && styles.productTabBtnActive,
                ]}
                onPress={() => setProductTab('pid')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.productTabText,
                    productTab === 'pid' && styles.productTabTextActive,
                  ]}>
                  PID
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {isDealerChecker && (
          <Text style={styles.sectionSubtitle}>Invoice</Text>
        )}
        {!isAnchorChecker && (
          <Text style={styles.keyFigureHeading}>Invoice Dashboard: Key Figure</Text>
        )}
        <View style={styles.cardGrid}>
          {getCardMetrics(productTab).map(card => (
            <View key={card.label} style={styles.card}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                {card.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'dealers' && styles.activeTab]}
            onPress={() => setActiveTab('dealers')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'dealers' && styles.activeTabText,
              ]}>
              {(isAnchorMaker || isDealerMaker) ? 'Summary of All Program' : 'Summary of Dealers'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'unpaid' && styles.activeTab]}
            onPress={() => setActiveTab('unpaid')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'unpaid' && styles.activeTabText,
              ]}>
              {isCheckerRole ? 'Latest Unpaid Invoices' : 'Latest Invoices'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'dealers' ? dealerTable : unpaidTable}
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
        filterData={dashboardFilterData}
        appliedFilters={appliedFilters}
      />

      {/* Checker Approval Modal */}
      <CheckerApprovalModal
        visible={showCheckerApprovalModal}
        onClose={() => {
          setShowCheckerApprovalModal(false);
          setSelectedDealerId(null);
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
        invoiceId={selectedDealerId}
        invoiceNo={selectedDealerNo || undefined}
        invoiceDetails={{
          subTotal: '10,80,025/-',
          withholdingTaxesPercent: '0.00/-',
          withholdingAmount: '0.00/-',
          finalPayableAmount: '10,80,025/-',
          finalDueDate: 'dd-mm-yyyy',
        }}
        onClose={() => {
          setShowApproveRejectModal(false);
          setSelectedDealerId(null);
          setSelectedDealerNo(null);
        }}
        onApprove={(dealerId, remarks) => {
          // TODO: Call approve API
          console.log('Approve dealer:', dealerId, remarks);
          // After API success, navigate to invoice detail view
          setShowApproveRejectModal(false);
          const invoiceNo = selectedDealerNo || dealerId;
          (navigation as any).navigate('InvoiceDetailView', {
            invoiceId: dealerId,
            invoiceNo,
          });
          setSelectedDealerId(null);
          setSelectedDealerNo(null);
        }}
        onReject={(dealerId, remarks) => {
          // TODO: Call reject API
          console.log('Reject dealer:', dealerId, remarks);
          setSelectedDealerId(null);
          setSelectedDealerNo(null);
        }}
      />

      {/* Attachment Upload Modal */}
      <UploadModal
        visible={showAttachmentModal}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={handleAttachmentUpload}
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
    gap: scaleHeight(12),
  },
  sectionSubtitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(8),
    marginTop: scaleHeight(12),
  },
  productTabsScroll: {
    marginTop: scaleHeight(6),
    marginBottom: scaleHeight(4),
  },
  productTabsRow: {
    flexDirection: 'row',
    gap: scaleWidth(18),
    paddingRight: scaleWidth(24),
  },
  productTabBtn: {
    paddingVertical: scaleHeight(8),
  },
  productTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryColor,
  },
  productTabText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  productTabTextActive: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  keyFigureHeading: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(10),
    marginTop: scaleHeight(4),
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F6FB',
    borderRadius: scaleWidth(20),
    padding: scaleWidth(4),
    marginTop: scaleHeight(16),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(16),
    alignItems: 'center',
  },
  tabText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  activeTab: {
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#00000022',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activeTabText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
  },
  tabContent: {
    marginTop: scaleHeight(18),
  },
  allProgramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  allProgramTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  searchBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(14),
    backgroundColor: Colors.white,
  },
  searchPlaceholder: {
    color: Colors.graybase,
    fontSize: scaleFont(14),
  },
  filterBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
  },
  filterText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  verticalList: {
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
    alignItems: 'center',
    marginBottom: scaleHeight(12),
    paddingRight: scaleWidth(50),
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardTitleChevron: {
    marginLeft: scaleWidth(6),
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
  statusGreenText: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  statusWarningChip: {
    backgroundColor: '#FFF4E0',
  },
  statusWarningText: {
    color: Colors.Yellow,
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
  invoiceHeader: {
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

