import React, {useMemo, useState, useRef} from 'react';
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
} from '@components/index';
import {MarkAsDisbursedModal} from './DisbursementScreen/MarkAsDisbursedModal';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Filter, Dots} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';

// Summary metrics for Disbursement
const disbursementMetrics = [
  {label: 'Dealers', value: '5'},
  {label: 'Total Invoices Submitted', value: '12'},
  {label: 'Total Dis. Amount', value: '₹ 20,000,000.00'},
  {label: 'Disbursed Amount', value: '₹ 9,20,000'},
  {label: 'Pending Dis. Amount', value: '₹ 8,20,000'},
];

// Disbursement rows – columns aligned with Invoice List & Approval + Disburse Date
const disbursementRows = Array.from({length: 5}).map((_, index) => ({
  id: `disbursement-${index}`,
  loanRefNo: '125423',
  invoiceNo: '1234566',
  bankName: 'UGRO',
  productName: 'Dealer Finance',
  programName: 'UGRO DF Program',
  primaryParty: 'Hero Finanace',
  counterParty: 'Sun Pharma',
  invoiceAmount: '25,000.00/-',
  invoiceDate: 'dd-mm-yyyy',
  requestDate: 'dd-mm-yyyy',
  dueDate: 'dd-mm-yyyy',
  disburseDate: 'dd-mm-yyyy',
  invoiceStatus: 'Submitted',
  approvalStatus: 'Approval Complete',
  adminStatus: 'Verify',
}));

// Filter data
const disbursementFilterData = {
  'Primary Party': ['Hero Finanace', 'ABC Finance', 'SK Finance'],
  'Invoice Status': ['Submitted', 'Pending', 'Disbursed'],
  'Loan Ref No.': ['125423', '125424', '125425'],
};

export const DisbursementScreen: React.FC = () => {
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const programSelection = useSelector(selectProgramSelection);
  const programName = programSelection?.programName ?? 'Sun Pharma PGM';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCheckerRole = isAnchorChecker || isDealerChecker;

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const [showDisbursedModal, setShowDisbursedModal] = useState(false);
  const [selectedDisbursementId, setSelectedDisbursementId] = useState<string | null>(null);
  const menuButtonRefs = useRef<Record<string, any>>({});

  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  const filteredData = useMemo(() => {
    let data = disbursementRows;
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      data = data.filter(
        item =>
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.counterParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term),
      );
    }
    return data;
  }, [searchText]);

  const handleMenuToggle = (disbursementId: string) => {
    if (openMenuId === disbursementId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const ref = menuButtonRefs.current[disbursementId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(disbursementId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(disbursementId);
    }
  };

  const handleMenuAction = (action: string, disbursementId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    switch (action) {
      case 'markAsDisbursed':
        setSelectedDisbursementId(disbursementId);
        setShowDisbursedModal(true);
        break;
      case 'sendMail':
        // TODO: Send Mail to Bank
        break;
      case 'delete':
        // TODO: Delete
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
      <AppBar
        title="Transactions > Disbursement"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <ScrollView
        contentContainerStyle={styles.content}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}>
        {/* Program Title */}
        <View style={styles.pageTitleBar}>
          <Text style={styles.pageTitleText}>{programName}</Text>
        </View>

        {/* Summary Metrics - Grid Cards Layout */}
        <View style={styles.cardGrid}>
          {disbursementMetrics.map((metric, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardLabel}>{metric.label}</Text>
              <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Invoices Section */}
        <View style={styles.invoicesHeader}>
          <Text style={styles.invoicesLabel}>Invoices</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{filteredData.length}</Text>
          </View>
        </View>

        {/* Search and Filter */}
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

        {/* Invoice List - Same columns as Invoice List & Approval + Disburse Date; 3-dot action only for Checker */}
        <View style={styles.verticalList}>
          {filteredData.map(row => (
            <View key={row.id} style={styles.cardWrapper}>
              <View style={styles.listCard}>
                {isCheckerRole && (
                  <TouchableOpacity
                    ref={ref => {
                      if (ref) {
                        menuButtonRefs.current[row.id] = ref;
                      }
                    }}
                    style={styles.threeDotsButton}
                    onPress={() => handleMenuToggle(row.id)}
                    activeOpacity={0.7}>
                    <Dots
                      width={scaleWidth(20)}
                      height={scaleHeight(20)}
                      style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.infoGrid}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Loan Ref No.</Text>
                    <Text style={styles.infoValue}>{row.loanRefNo}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice No</Text>
                    <Text style={styles.infoValue}>{row.invoiceNo}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Bank Name</Text>
                    <Text style={styles.infoValue}>{row.bankName}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Product Name</Text>
                    <Text style={styles.infoValue}>{row.productName}</Text>
                  </View>
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
                    <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                    <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Date</Text>
                    <Text style={styles.infoValue}>{row.invoiceDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Request Date</Text>
                    <Text style={styles.infoValue}>{row.requestDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Due Date</Text>
                    <Text style={styles.infoValue}>{row.dueDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Disburse Date</Text>
                    <Text style={styles.infoValue}>{row.disburseDate}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Invoice Status</Text>
                    <Text style={[styles.infoValue, styles.statusGreen]}>{row.invoiceStatus}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Approval Status</Text>
                    <Text style={[styles.infoValue, styles.statusGreen]}>{row.approvalStatus}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Admin Status</Text>
                    <Text style={[styles.infoValue, styles.statusGreen]}>{row.adminStatus}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
        }}
        filterData={disbursementFilterData}
        appliedFilters={appliedFilters}
      />

      {/* 3-dot Action Menu - Disbursal list view, Checker role only: Send Mail to Bank, Mark as Disbursed, Delete */}
      {isCheckerRole && (
        <Modal
          transparent
          visible={!!openMenuId}
          animationType="fade"
          onRequestClose={() => {
            setOpenMenuId(null);
            setMenuAnchor(null);
          }}>
          <Pressable
            style={styles.menuOverlay}
            onPress={() => {
              setOpenMenuId(null);
              setMenuAnchor(null);
            }}>
            <Pressable style={[styles.actionMenu, getMenuPosition(menuAnchor)]} onPress={e => e.stopPropagation()}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction('sendMail', openMenuId as string)}>
                <FontAwesome6 name="envelope" iconStyle="regular" color={Colors.darkblack} size={16} />
                <Text style={styles.menuItemText}>Send Mail to Bank</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction('markAsDisbursed', openMenuId as string)}>
                <FontAwesome6 name="square-check" iconStyle="regular" color={Colors.darkblack} size={16} />
                <Text style={styles.menuItemText}>Mark as Disbursed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction('delete', openMenuId as string)}>
                <FontAwesome6 name="trash" iconStyle="solid" color={Colors.red} size={16} />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Mark as Disbursed Modal */}
      <MarkAsDisbursedModal
        visible={showDisbursedModal}
        onClose={() => {
          setShowDisbursedModal(false);
          setSelectedDisbursementId(null);
        }}
        invoiceAmount={
          filteredData.find(item => item.id === selectedDisbursementId)?.invoiceAmount?.replace('/-', '') || '15,556'
        }
        invoiceNo={
          filteredData.find(item => item.id === selectedDisbursementId)?.invoiceNo
        }
        onSubmit={data => {
          // TODO: Call API to mark as disbursed
          console.log('Mark as Disbursed:', selectedDisbursementId, data);
          setShowDisbursedModal(false);
          setSelectedDisbursementId(null);
        }}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    marginBottom: scaleHeight(8),
    marginHorizontal: -scaleWidth(16),
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(16),
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
  invoicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  invoicesLabel: {
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
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
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
    paddingRight: scaleWidth(50),
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionMenu: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    minWidth: scaleWidth(180),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  menuItemText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  menuItemTextDanger: {
    color: Colors.red,
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
  statusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
});
