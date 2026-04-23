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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AppBar, Container, FilterModal, ProgramBreadcrumb} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Search, Filter, Dots} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

// Sample data for Financing Requests
const financingRequestData = [
  {
    id: '1',
    loanReferenceNo: 'LR001',
    invoiceRefNo: 'INV001',
    anchor: 'Anchor Company A',
    loanDate: '01-01-2024',
    loanEndDate: '31-03-2024',
    eligibility: '85',
    loanAmount: '₹50,000',
    status: 'Approved',
  },
  {
    id: '2',
    loanReferenceNo: 'LR002',
    invoiceRefNo: 'INV002',
    anchor: 'Anchor Company B',
    loanDate: '05-01-2024',
    loanEndDate: '05-04-2024',
    eligibility: '75',
    loanAmount: '₹30,000',
    status: 'Submitted',
  },
  {
    id: '3',
    loanReferenceNo: 'LR003',
    invoiceRefNo: 'INV003',
    anchor: 'Anchor Company C',
    loanDate: '10-01-2024',
    loanEndDate: '10-04-2024',
    eligibility: '90',
    loanAmount: '₹75,000',
    status: 'Rejected',
  },
  {
    id: '4',
    loanReferenceNo: 'LR004',
    invoiceRefNo: 'INV004',
    anchor: 'Anchor Company D',
    loanDate: '15-01-2024',
    loanEndDate: '15-04-2024',
    eligibility: '80',
    loanAmount: '₹40,000',
    status: 'Created',
  },
  {
    id: '5',
    loanReferenceNo: 'LR005',
    invoiceRefNo: 'INV005',
    anchor: 'Anchor Company E',
    loanDate: '20-01-2024',
    loanEndDate: '20-04-2024',
    eligibility: '95',
    loanAmount: '₹60,000',
    status: 'Reserved',
  },
];

// Dummy filter data
const financingRequestFilterData = {
  'Status': ['Created', 'Submitted', 'Rejected', 'Approved', 'Reserved'],
  'Anchor': ['Anchor Company A', 'Anchor Company B', 'Anchor Company C'],
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return {bg: '#E8F5E9', text: '#4CAF50'};
    case 'submitted':
      return {bg: '#E3F2FD', text: '#2196F3'};
    case 'rejected':
      return {bg: '#FFEBEE', text: '#F44336'};
    case 'created':
      return {bg: '#FFF3E0', text: '#FF9800'};
    case 'reserved':
      return {bg: '#F3E5F5', text: '#9C27B0'};
    default:
      return {bg: '#F5F5F5', text: Colors.darkblack};
  }
};

export const FinancingRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

  const filteredData = useMemo(() => {
    let data = financingRequestData;
    
    // Apply search filter
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          item.loanReferenceNo.toLowerCase().includes(term) ||
          item.invoiceRefNo.toLowerCase().includes(term) ||
          item.anchor.toLowerCase().includes(term),
      );
    }

    // Apply status filter
    if (appliedFilters['Status']?.length) {
      data = data.filter(item => appliedFilters['Status'].includes(item.status));
    }

    return data;
  }, [searchText, appliedFilters]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const handleMenuToggle = (id: string) => {
    const ref = menuButtonRefs.current[id];
    if (ref) {
      ref.measure((x, y, width, height, pageX, pageY) => {
        setMenuAnchor({x: pageX, y: pageY, width, height});
        setOpenMenuId(id);
      });
    }
  };

  const handleMenuAction = (action: string, requestId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);
    void action;
    void requestId;
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

  return (
    <Container>
      <AppBar title="Financing Requests" navigation={navigation as any} />
      <ProgramBreadcrumb />
      <View style={styles.pageTitleBar}>
        <Text style={styles.pageTitleText}>Financing Request</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}>
        {/* Financing Request Badge Header */}
        <View style={styles.badgeHeader}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeLabel}>Financing Requests</Text>
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

        {/* Financing Request List - Vertical Card View */}
        <View style={styles.verticalList}>
          {paginatedData.map(row => {
            const statusColors = getStatusColor(row.status);
            return (
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
                    <Text style={styles.cardTitle}>{row.loanReferenceNo}</Text>
                    <Text style={styles.cardSubtitle}>
                      {row.invoiceRefNo} • {row.anchor}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
                    <Text style={[styles.statusText, {color: statusColors.text}]}>
                      {row.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Loan Reference No</Text>
                    <Text style={styles.infoValue}>{row.loanReferenceNo}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice/Unique Ref No</Text>
                    <Text style={styles.infoValue}>{row.invoiceRefNo}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Anchor</Text>
                    <Text style={styles.infoValue}>{row.anchor}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Loan Date</Text>
                    <Text style={styles.infoValue}>{row.loanDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Loan End Date</Text>
                    <Text style={styles.infoValue}>{row.loanEndDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Eligibility (%)</Text>
                    <Text style={styles.infoValue}>{row.eligibility}%</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Loan Amount</Text>
                    <Text style={styles.infoValue}>{row.loanAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, {color: statusColors.text}]}>
                      {row.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
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
        filterData={financingRequestFilterData}
        appliedFilters={appliedFilters}
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
            <TouchableOpacity
              onPress={() => handleMenuAction('view', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="eye"
                iconStyle="solid"
                color={Colors.darkblack}
                size={16}
              />
              <Text style={styles.menuText}>View Details</Text>
            </TouchableOpacity>

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
              onPress={() => handleMenuAction('cancel', openMenuId as string)}
              style={styles.menuItem}>
              <FontAwesome6
                name="xmark"
                iconStyle="solid"
                color={Colors.red}
                size={16}
              />
              <Text style={[styles.menuText, styles.deleteMenuText]}>Cancel Request</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    position: 'relative',
  },
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    zIndex: 10,
  },
  threeDotsTouchable: {
    padding: scaleWidth(4),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
    paddingRight: scaleWidth(40),
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
  statusText: {
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
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(180),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
  deleteMenuText: {
    color: Colors.red,
  },
});
