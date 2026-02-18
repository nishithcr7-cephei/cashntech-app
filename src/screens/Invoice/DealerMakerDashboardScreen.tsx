import React, {useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AppBar, Container, FilterModal, UploadModal} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Dots} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {ImgDashboard} from '@assets/Images';
import {useSelector} from 'react-redux';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';

// Key figure cards for Dealer Maker
const cardMetrics = [
  {label: 'Total Program Limit', value: '₹ 17,40,000'},
  {label: "No. of Dealer's Accounts", value: '1'},
  {label: 'Dealer Limit Uploaded', value: '₹ 2,00,00,000'},
  {label: 'Utilized Limit', value: '₹ 9,20,000'},
  {label: 'Available Limit', value: '₹ 8,20,000'},
  {label: 'Overdue Amount', value: '₹ 0'},
];

// Sample data for OD Account Summary
const odAccountSummaryData = [
  {
    id: '1',
    anchor: 'Anchor Company A',
    programName: 'Pharma Supply Chain Finance',
    creditAccount: 'OD123456',
    sanctionedLimit: '₹1,00,000',
    drawingPower: '₹85,000',
    utilizedLimit: '₹15,000',
    pipelineRequests: '₹5,000',
    excessCredit: '₹0',
    availableLimit: '₹70,000',
    overdueAmount: '₹0',
    odExpiry: '31-12-2024',
    overdueDays: 0,
    status: 'Regular',
  },
];

// Sample data for Upcoming Due Dates
const upcomingDueDatesData = [
  {
    id: '1',
    invoiceRefNo: 'INV001',
    anchor: 'Anchor Company A',
    creditAccountNo: 'OD123456',
    drawdownAmount: '₹50,000',
    drawdownDate: '01-01-2024',
    totalOutstanding: '₹53,500',
    tenorEndDate: '31-03-2024',
  },
];

// Sample data for DPD Invoice List
const dpdInvoiceData = [
  {
    id: '1',
    invoiceRefNo: 'INV-123101010',
    anchor: 'Anchor Company A',
    invoiceDate: '01-11-2024',
    dueDate: '15-11-2024',
    daysPastDue: 30,
    amount: '₹20,000,000.00',
    outstandingAmount: '₹20,000,000.00',
  },
];

// Dummy filter data
const dashboardFilterData = {
  'Anchor': ['Anchor Company A', 'Anchor Company B'],
  'Status': ['Regular', 'Overdue'],
};

export const DealerMakerDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const mode = route?.params?.mode ?? 'landing'; // 'landing' | 'dashboard'
  const isLanding = mode === 'landing';
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;

  // Dealer Maker now uses Anchor Maker InvoiceDashboard screen (Dealer Finance flow).
  // Keep this screen visible but disabled (overlay) for now.
  const isDisabled = userRole === 'dealer_maker' && !isLanding;
  const [activeTab, setActiveTab] = useState<'odSummary' | 'upcomingDue' | 'dpdInvoice'>('odSummary');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [searchText, setSearchText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

  const handleMenuToggle = (accountId: string) => {
    if (openMenuId === accountId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const ref = menuButtonRefs.current[accountId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(accountId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(accountId);
    }
  };

  const handleMenuAction = (action: string, accountId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    switch (action) {
      case 'viewDetail':
        // Navigate to credit account detail view
        console.log('View detail for account:', accountId);
        // TODO: Navigate to detail screen when available
        break;
      case 'repayment':
        // Navigate to repayment screen
        console.log('Repayment for account:', accountId);
        // TODO: Navigate to repayment screen when available
        break;
      case 'payMeEarly':
        // Pay me Early action
        console.log('Pay me Early for account:', accountId);
        // TODO: Implement Pay me Early functionality
        break;
      case 'attachment':
        // Show attachment upload modal
        setSelectedAccountId(accountId);
        setShowAttachmentModal(true);
        break;
      case 'print':
        // Print functionality
        console.log('Print account summary:', accountId);
        // TODO: Implement print functionality
        break;
    }
  };

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    if (file && selectedAccountId) {
      // TODO: Upload file to API
      console.log('Upload attachment for account:', selectedAccountId, file.name);
    }
    setShowAttachmentModal(false);
    setSelectedAccountId(null);
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

    return {
      position: 'absolute' as const,
      top: anchor.y + anchor.height + topPadding,
      left,
    };
  };

  const odAccountSummaryTable = useMemo(
    () => (
      <>
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
        <View style={styles.verticalList}>
          {odAccountSummaryData.map(row => (
            <View key={row.id} style={styles.listCard}>
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

              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.anchor}</Text>
                  <Text style={styles.cardSubtitle}>
                    Credit Account: {row.creditAccount}
                  </Text>
                </View>
                <View style={[styles.statusChip, row.status === 'Regular' ? styles.statusRegular : styles.statusOverdue]}>
                  <Text style={styles.statusChipText}>{row.status}</Text>
                </View>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Anchor</Text>
                  <Text style={styles.infoValue}>{row.anchor}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Program Name</Text>
                  <Text style={styles.infoValue}>{row.programName}</Text>
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
                  <Text style={styles.infoLabel}>OD Expiry</Text>
                  <Text style={styles.infoValue}>{row.odExpiry}</Text>
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
          ))}
        </View>
      </>
    ),
    [searchText],
  );

  const upcomingDueDatesTable = useMemo(
    () => (
      <>
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
        <View style={styles.verticalList}>
          {upcomingDueDatesData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.invoiceRefNo}</Text>
                  <Text style={styles.cardSubtitle}>
                    {row.anchor} • {row.creditAccountNo}
                  </Text>
                </View>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice/Unique Ref No</Text>
                  <Text style={styles.infoValue}>{row.invoiceRefNo}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Anchor</Text>
                  <Text style={styles.infoValue}>{row.anchor}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Credit Account No</Text>
                  <Text style={styles.infoValue}>{row.creditAccountNo}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Drawdown Amount</Text>
                  <Text style={styles.infoValue}>{row.drawdownAmount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Drawdown Date</Text>
                  <Text style={styles.infoValue}>{row.drawdownDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Total Outstanding</Text>
                  <Text style={styles.infoValue}>{row.totalOutstanding}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Tenor End Date</Text>
                  <Text style={styles.infoValue}>{row.tenorEndDate}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </>
    ),
    [searchText],
  );

  const dpdInvoiceTable = useMemo(
    () => (
      <>
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
        <View style={styles.verticalList}>
          {dpdInvoiceData.map(row => (
            <View key={row.id} style={styles.listCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{row.invoiceRefNo}</Text>
                  <Text style={styles.cardSubtitle}>
                    {row.anchor} • DPD: {row.daysPastDue} Days
                  </Text>
                </View>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice/Unique Ref No</Text>
                  <Text style={styles.infoValue}>{row.invoiceRefNo}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Anchor</Text>
                  <Text style={styles.infoValue}>{row.anchor}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Invoice Date</Text>
                  <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Due Date</Text>
                  <Text style={styles.infoValue}>{row.dueDate}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Days Past Due</Text>
                  <Text style={[styles.infoValue, styles.dpdValue]}>
                    {row.daysPastDue} Days
                  </Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>{row.amount}</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Outstanding Amount</Text>
                  <Text style={styles.infoValue}>{row.outstandingAmount}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </>
    ),
    [searchText],
  );

  return (
    <Container>
      {/* Keep AppBar usable (hamburger + title NOT covered) */}
      <AppBar 
        title={isLanding ? 'LMS System' : 'Invoice Dashboard'} 
        navigation={navigation as any}
      />

      {/* Body area (overlay should only cover this, not AppBar) */}
      <View style={styles.bodyRoot}>
        <View style={styles.bodyContent} pointerEvents={isDisabled ? 'none' : 'auto'}>
          {/* TRANSACTIONS landing: only image in content area */}
          {isLanding && (
            <Image
              source={ImgDashboard}
              style={styles.dashboardImageLanding}
              resizeMode="contain"
            />
          )}

          {/* Old Dealer Maker Invoice Dashboard UI */}
          {!isLanding && (
            <>
              <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.keyFigureHeading}>Invoice Dashboard: Key Figure</Text>

                <View style={styles.cardGrid}>
                  {cardMetrics.map(card => (
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
                    style={[styles.tabBtn, activeTab === 'odSummary' && styles.activeTab]}
                    onPress={() => setActiveTab('odSummary')}>
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'odSummary' && styles.activeTabText,
                      ]}>
                      Credit Account Summary
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'upcomingDue' && styles.activeTab]}
                    onPress={() => setActiveTab('upcomingDue')}>
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'upcomingDue' && styles.activeTabText,
                      ]}>
                      Upcoming Due Dates
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'dpdInvoice' && styles.activeTab]}
                    onPress={() => setActiveTab('dpdInvoice')}>
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'dpdInvoice' && styles.activeTabText,
                      ]}>
                      DPD Invoice List
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.tabContent}>
                  {activeTab === 'odSummary' && odAccountSummaryTable}
                  {activeTab === 'upcomingDue' && upcomingDueDatesTable}
                  {activeTab === 'dpdInvoice' && dpdInvoiceTable}
                </View>
              </ScrollView>

              {/* Filter Modal */}
              <FilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApply={(filters) => {
                  setAppliedFilters(filters);
                }}
                filterData={dashboardFilterData}
                appliedFilters={appliedFilters}
              />

              {/* Attachment Upload Modal */}
              <UploadModal
                visible={showAttachmentModal}
                allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
                onClose={handleAttachmentUpload}
              />

              {/* Action Menu Modal */}
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
                    {/* View Detail */}
                    <TouchableOpacity
                      onPress={() => handleMenuAction('viewDetail', openMenuId as string)}
                      style={styles.menuItem}>
                      <FontAwesome6
                        name="file-lines"
                        iconStyle="solid"
                        color={Colors.darkblack}
                        size={16}
                      />
                      <Text style={styles.menuText}>View Detail</Text>
                    </TouchableOpacity>

                    {/* Repayment */}
                    <TouchableOpacity
                      onPress={() => handleMenuAction('repayment', openMenuId as string)}
                      style={styles.menuItem}>
                      <FontAwesome6
                        name="square-plus"
                        iconStyle="solid"
                        color={Colors.darkblack}
                        size={16}
                      />
                      <Text style={styles.menuText}>Repayment</Text>
                    </TouchableOpacity>

                    {/* Pay me Early */}
                    <TouchableOpacity
                      onPress={() => handleMenuAction('payMeEarly', openMenuId as string)}
                      style={styles.menuItem}>
                      <FontAwesome6
                        name="money-bill-wave"
                        iconStyle="solid"
                        color={Colors.darkblack}
                        size={16}
                      />
                      <Text style={styles.menuText}>Pay me Early</Text>
                    </TouchableOpacity>

                    {/* Attachment */}
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

                    {/* Print */}
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
                  </Pressable>
                </Pressable>
              </Modal>
            </>
          )}
        </View>

        {/* Disable overlay only for old Invoice Dashboard screen (not landing), and NOT covering AppBar */}
        {isDisabled && (
          <Pressable style={styles.disabledOverlay} onPress={() => {}}>
            <View style={styles.disabledCard}>
              <Text style={styles.disabledTitle}>Under Maintenance</Text>
              <Text style={styles.disabledSubtitle}>This screen is not in use.</Text>
            </View>
          </Pressable>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  bodyRoot: {
    flex: 1,
    position: 'relative',
  },
  bodyContent: {
    flex: 1,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  disabledCard: {
    width: '100%',
    maxWidth: scaleWidth(320),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: scaleWidth(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(16),
  },
  disabledTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(6),
    textAlign: 'center',
  },
  disabledSubtitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
    gap: scaleHeight(12),
  },
  dashboardImageLanding: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
  },
  keyFigureHeading: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(10),
    marginTop: scaleHeight(12),
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(4),
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
    borderRadius: scaleWidth(8),
    padding: scaleWidth(4),
    marginTop: scaleHeight(16),
    gap: scaleWidth(4),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(6),
    alignItems: 'center',
  },
  tabText: {
    fontSize: scaleFont(12),
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
    paddingRight: scaleWidth(40), // Add padding to prevent overlap with 3-dots button
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
  statusRegular: {
    backgroundColor: '#E6F7EF',
  },
  statusOverdue: {
    backgroundColor: '#FFEBEE',
  },
  statusChipText: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(12),
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
  dpdValue: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  threeDotsTouchable: {
    padding: scaleWidth(4),
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    gap: scaleWidth(12),
  },
  menuText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
});
