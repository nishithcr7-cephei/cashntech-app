import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import React from 'react';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {UserImg} from '@assets/Images';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  LeftChevron,
  UpChevron,
  Logout,
  File,
  Folder,
} from '@assets/Icons';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {useNavigationState} from '@react-navigation/native';
import {Colors, Fonts, ROLE_HEADER_COLORS} from '@constants/index';
import {useDispatch, useSelector} from 'react-redux';
import {Alert} from 'react-native';
import {getIsCashntechUserType, userSelector} from '@store/user';
import {logoutUser} from '@services/api/api';
import Toast from 'react-native-toast-message';
import {AppRole, ROLE_LABELS} from '@constants/roles';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {selectPermissionsLoading} from '@store/permissions';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {
  selectActiveProductCode,
  selectAvailableProducts,
} from '@store/product/product.selectors';
import {setActiveProduct} from '@store/product/product.slice';
import {getEffectiveProductCode} from '@store/product/product.resolver';
import {PRODUCT_CODES, PRODUCT_DISPLAY_NAMES, ResolvedProduct} from '@store/product/product.types';
import {setProgramScope} from '@store/programSelection/programSelection.slice';
import {ProductIcon} from '@components/ProductSwitcher/ProductIcon';
import {DrawerTreeMenu, DrawerMenuNode} from './DrawerTreeMenu';

const REPORT_MENU_ITEMS = [
  {key: 'all-loans', title: 'All Loans Report'},
  {key: 'disbursement', title: 'Disbursment Report'},
  {key: 'dpd', title: 'DPD Report'},
  {key: 'daily-accrual', title: 'Daily Accrual Report'},
  {key: 'monthly-interest', title: 'Monthly Interest Report'},
  {key: 'repayment', title: 'Repayment Report'},
  {key: 'invoice-outstanding', title: 'Invoice Outstanding Report'},
  {key: 'loan-status', title: 'Loan Status Report'},
  {key: 'all-product-outstanding', title: 'All Product Outstanding Report'},
  {key: 'utilization', title: 'Utilization Report'},
] as const;

export const DrawerContent = ({navigation}: DrawerContentComponentProps) => {
  const dispatch = useDispatch();
  // Single expand/collapse map keyed by menu node key — replaces the previous
  // fixed isProductsOpen/isDealerFinanceOpen/... booleans so the PRODUCTS tree
  // can render an arbitrary number of product branches (DF, VF, ...).
  const [expandedKeys, setExpandedKeys] = React.useState<Record<string, boolean>>({});
  const [isReportingOpen, setIsReportingOpen] = React.useState(false);
  const [activeReportKey, setActiveReportKey] = React.useState<string | null>(null);
  const {top, bottom} = useSafeAreaInsets();
  const userInfo = useSelector(userSelector.getUserInfo);
  const fullName = useSelector(userSelector.getFullName);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const canViewReports = useSelector(getIsCashntechUserType);
  const activeProductCode = useSelector(selectActiveProductCode);
  const availableProducts = useSelector(selectAvailableProducts);
  const effectiveProductCode = getEffectiveProductCode(activeProductCode);
  const hasMultipleProducts = availableProducts.length > 1;
  // PR1 store already defaults DF-only users to a single resolved product;
  // this fallback only guards the brief window before scope/product hydration.
  const productBranches: ResolvedProduct[] =
    availableProducts.length > 0
      ? availableProducts
      : [
          {
            id: '',
            name: PRODUCT_DISPLAY_NAMES[PRODUCT_CODES.DEALER_FINANCE],
            code: PRODUCT_CODES.DEALER_FINANCE,
          },
        ];

  const toggleExpandedKey = (key: string) => {
    setExpandedKeys(prev => ({...prev, [key]: !prev[key]}));
  };

  const switchActiveProduct = (product: ResolvedProduct) => {
    dispatch(setActiveProduct(product));
    dispatch(setProgramScope('all'));
  };

  const handleActiveProductToggle = (product: ResolvedProduct) => {
    if (product.code === activeProductCode) {
      return;
    }
    switchActiveProduct(product);
  };

  // Get role-based header colors (default to anchor_maker if no role)
  const headerColors = userRole
    ? ROLE_HEADER_COLORS[userRole]
    : ROLE_HEADER_COLORS.anchor_maker;

  // Role-based menu visibility (All Access = same transaction menu as maker/checker on web)
  const isAnchorAllAccess = userRole === 'anchor_all_access';
  const isDealerAllAccess = userRole === 'dealer_all_access';
  const isAnchorMaker = userRole === 'anchor_maker' || isAnchorAllAccess;
  const isAnchorChecker = userRole === 'anchor_checker' || isAnchorAllAccess;
  const isDealerMaker = userRole === 'dealer_maker' || isDealerAllAccess;
  const isDealerChecker = userRole === 'dealer_checker' || isDealerAllAccess;
  const isCashnTechUser = userRole === 'cashntech_user';
  // Transactions items are visible for these 5 roles only (matches web parity gating).
  const canViewTransactionsSection =
    isAnchorMaker || isAnchorChecker || isDealerChecker || isDealerMaker || isCashnTechUser;

  // Show Fund Planner for Dealer Maker only (removed dealer_checker)
  const showFundPlanner = isDealerMaker;

  // Show Loan Accounts for Dealer Maker only (removed dealer_checker)
  const showLoanAccounts = isDealerMaker;

  // Use shared role labels so all roles (including dealer_checker) are supported
  const roleLabel = userRole ? ROLE_LABELS[userRole] : '';

  // Permissions
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canViewInvoices = useHasPermission(PERMISSIONS.INVOICE_LIST);
  const canViewDisbursement = useHasPermission(PERMISSIONS.DISBURSEMENT);
  const canViewRepayment = useHasPermission(PERMISSIONS.REPAYMENT_SETTLEMENT);
  const canViewInterestAccruals = useHasPermission(PERMISSIONS.INTEREST_ACCRUALS);
  const canViewSOA = useHasPermission(PERMISSIONS.SOA);
  const canViewDPD = useHasPermission(PERMISSIONS.DPD_PENAL_NPA);
  const canViewOverview = useHasPermission(PERMISSIONS.TRANSACTIONS_OVERVIEW);

  // Get current route (name + params) for highlighting active menu item
  const currentRouteInfo = useNavigationState(state => {
    if (state) {
      const route: any = state.routes[state.index];
      if (route.state) {
        // Handle nested navigators
        const nestedState: any = route.state;
        const nestedRoute: any = nestedState.routes[nestedState.index];
        return nestedRoute;
      }
      return route as any;
    }
    return null;
  });

  const currentRoute = currentRouteInfo?.name as string | null;
  const currentRouteParams: any = currentRouteInfo?.params || {};
  const dealerMode = currentRouteParams?.mode;
  const isDealerInvoiceDashboardRoute =
    isDealerMaker &&
    currentRoute === 'DealerMakerDashboardScreen' &&
    dealerMode === 'dashboard';

  // Auto-expand menus based on current route
  React.useEffect(() => {
    // 1. Define all routes first
    const isTransactionRoute =
      currentRoute === 'InvoiceDashboard' ||
      currentRoute === 'InvoiceDetails' ||
      currentRoute === 'CreateInvoice' ||
      currentRoute === 'UploadInvoiceList' ||
      currentRoute === 'DealerInvoiceList' ||
      currentRoute === 'FundingLimitsForDealers' ||
      currentRoute === 'ANCreditAccount' ||
      currentRoute === 'CreditAccountDetails' ||
      currentRoute === 'CreditAccountInvoiceNumber' ||
      currentRoute === 'CreditAccountDailyInterest' ||
      currentRoute === 'FinancingRequestScreen' ||
      currentRoute === 'LimitDetailsScreen' ||
      currentRoute === 'DealerMakerDashboardScreen' ||
      currentRoute === 'DisbursementScreen' ||
      currentRoute === 'InterestAccrualsScreen' ||
      currentRoute === 'RepaymentSettlementScreen' ||
      currentRoute === 'DPDPenalInterestNPAScreen' ||
      currentRoute === 'StatementOfAccount' ||
      currentRoute === 'ODDetailsScreen' ||
      currentRoute === 'ODRepaymentsScreen' ||
      currentRoute === 'AnchorsListScreen';

    const isFundPlannerRoute =
      isDealerMaker &&
      (currentRoute === 'FinancingRequestScreen' ||
       currentRoute === 'LimitDetailsScreen');

    const isLoanAccountsRoute =
      isDealerMaker &&
      (currentRoute === 'ODDetailsScreen' ||
       currentRoute === 'ODRepaymentsScreen' ||
       currentRoute === 'AnchorsListScreen');

    // 2. Auto-expand the branch for the *active* product — when a menu item
    // under a product branch is tapped, that product becomes active first,
    // then navigation happens, so this always expands the matching branch.
    if (isTransactionRoute || isFundPlannerRoute || isLoanAccountsRoute) {
      setExpandedKeys(prev => ({
        ...prev,
        products: true,
        [`product-${effectiveProductCode}`]: true,
        [`transactions-${effectiveProductCode}`]: true,
      }));
    }

    if (isFundPlannerRoute) {
      setExpandedKeys(prev => ({...prev, [`fundplanner-${effectiveProductCode}`]: true}));
    }

    if (isLoanAccountsRoute) {
      setExpandedKeys(prev => ({...prev, [`loanaccounts-${effectiveProductCode}`]: true}));
    }

  }, [currentRoute, isDealerMaker, effectiveProductCode]);

  const getProductBranchIcon = (code: string) => (
    <ProductIcon code={code} size={scaleHeight(20)} color="#7A7C82" />
  );

  const buildProductBranchNode = (product: ResolvedProduct): DrawerMenuNode => {
    const isActiveProductBranch = product.code === effectiveProductCode;

    const transactionsChildren: DrawerMenuNode[] = [
      {
        key: `invoice-overview-${product.code}`,
        label: 'Invoice Overview',
        route: 'InvoiceDashboard',
        visible: canViewTransactionsSection && canViewOverview,
        productContext: product,
        isActive:
          isActiveProductBranch &&
          (currentRoute === 'InvoiceDashboard' || isDealerInvoiceDashboardRoute),
      },
      {
        key: `invoice-list-${product.code}`,
        label: 'Invoice List & Approvals',
        route: 'InvoiceDetails',
        visible: canViewTransactionsSection && canViewInvoices,
        disabled: permissionsLoading,
        productContext: product,
        isActive:
          isActiveProductBranch &&
          (currentRoute === 'InvoiceDetails' ||
            currentRoute === 'CreateInvoice' ||
            currentRoute === 'UploadInvoiceList'),
      },
      {
        key: `disbursement-${product.code}`,
        label: 'Disbursement',
        route: 'DisbursementScreen',
        visible: canViewTransactionsSection && canViewDisbursement,
        disabled: permissionsLoading,
        productContext: product,
        isActive: isActiveProductBranch && currentRoute === 'DisbursementScreen',
      },
      {
        key: `interest-accruals-${product.code}`,
        label: 'Interest Accruals',
        visible: canViewTransactionsSection,
        route: 'InterestAccrualsScreen',
        disabled: permissionsLoading || !canViewInterestAccruals,
        productContext: product,
        isActive: isActiveProductBranch && currentRoute === 'InterestAccrualsScreen',
      },
      {
        key: `repayment-${product.code}`,
        label: 'Repayment & Settlement',
        visible: canViewTransactionsSection,
        route: 'RepaymentSettlementScreen',
        disabled: permissionsLoading || !canViewRepayment,
        productContext: product,
        isActive: isActiveProductBranch && currentRoute === 'RepaymentSettlementScreen',
      },
      {
        key: `dpd-${product.code}`,
        label: 'DPD / Penal Interest / NPA',
        visible: canViewTransactionsSection,
        route: 'DPDPenalInterestNPAScreen',
        disabled: !canViewDPD,
        productContext: product,
        isActive: isActiveProductBranch && currentRoute === 'DPDPenalInterestNPAScreen',
      },
      {
        key: `soa-${product.code}`,
        label: 'Statement of Account (SOA)',
        visible: canViewTransactionsSection,
        route: 'StatementOfAccount',
        disabled: !canViewSOA,
        productContext: product,
        isActive: isActiveProductBranch && currentRoute === 'StatementOfAccount',
      },
    ];

    const children: DrawerMenuNode[] = [
      {
        key: `transactions-${product.code}`,
        label: 'Transactions',
        icon: <File height={scaleHeight(22)} width={scaleWidth(22)} />,
        children: transactionsChildren,
      },
    ];

    // Fund Planner / Loan Accounts stay Dealer Finance only (dealer maker role), as today.
    if (product.code === PRODUCT_CODES.DEALER_FINANCE && showFundPlanner) {
      children.push({
        key: `fundplanner-${product.code}`,
        label: 'Fund Planner',
        children: [
          {key: `financing-request-${product.code}`, label: 'Financing Request', disabled: true},
          {key: `limit-details-${product.code}`, label: 'Limit Details', disabled: true},
        ],
      });
    }

    if (product.code === PRODUCT_CODES.DEALER_FINANCE && showLoanAccounts) {
      children.push({
        key: `loanaccounts-${product.code}`,
        label: 'Loan Accounts',
        children: [
          {key: `od-details-${product.code}`, label: 'OD Details', disabled: true},
          {key: `od-repayments-${product.code}`, label: 'OD Repayments', disabled: true},
          {key: `anchors-list-${product.code}`, label: 'Anchors List', disabled: true},
        ],
      });
    }

    return {
      key: `product-${product.code}`,
      label: product.name,
      icon: getProductBranchIcon(product.code),
      highlighted: isActiveProductBranch,
      children,
    };
  };

  const productsRootNode: DrawerMenuNode = {
    key: 'products',
    label: 'PRODUCTS',
    icon: <Folder height={scaleHeight(22)} width={scaleWidth(22)} />,
    children: productBranches.map(buildProductBranchNode),
  };

  const handleMenuNavigate = (node: DrawerMenuNode) => {
    if (node.disabled || !node.route) {
      return;
    }
    // Tapping a menu item under a non-active product branch switches the
    // active product first, so the destination screen's data matches the
    // branch the user tapped from.
    if (node.productContext && node.productContext.code !== activeProductCode) {
      switchActiveProduct(node.productContext);
    }
    navigation.closeDrawer();
    navigation.navigate(node.route as never);
  };

  const handleReportPress = (reportKey: string) => {
    setActiveReportKey(reportKey);
    navigation.closeDrawer();

    if (reportKey === 'all-loans') {
      navigation.navigate('AllLoanReportScreen');
      return;
    }

    if (reportKey === 'disbursement') {
      navigation.navigate('DisbursementReportScreen');
      return;
    }

    if (reportKey === 'dpd') {
      navigation.navigate('DpdReportScreen');
      return;
    }

    if (reportKey === 'daily-accrual') {
      navigation.navigate('DailyAccrualReportScreen');
      return;
    }

    if (reportKey === 'monthly-interest') {
      navigation.navigate('MonthlyInterestReportScreen');
      return;
    }

    if (reportKey === 'repayment') {
      navigation.navigate('RepaymentReportScreen');
      return;
    }

    if (reportKey === 'invoice-outstanding') {
      navigation.navigate('InvoiceOutstandingReportScreen');
      return;
    }

    if (reportKey === 'loan-status') {
      navigation.navigate('LoanStatusReportScreen');
      return;
    }

    if (reportKey === 'all-product-outstanding') {
      navigation.navigate('AllProductOutstandingReportScreen');
      return;
    }

    if (reportKey === 'utilization') {
      navigation.navigate('UtilizationReportScreen');
      return;
    }

    Toast.show({
      type: 'info',
      text1: 'Reporting',
      text2: 'This report will be available in a future update.',
      visibilityTime: 2500,
    });
  };

  const handleLogout = () => {
    // Add a small delay to ensure the Drawer Activity is still properly attached
    // This prevents "Tried to show an alert while not attached to an Activity" warning
    setTimeout(() => {
      try {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
          {
            text: 'Cancel',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: () => {
              logoutUser();
            },
          },
        ]);
      } catch (error) {
        // If Alert fails, proceed with logout directly
        console.warn('Alert failed, proceeding with logout:', error);
        logoutUser();
      }
    }, 300);
  };

  return (
    <View style={styles.rootView}>
      <View style={[styles.container, {marginTop: top, marginBottom: bottom}]}>
        {/* Header */}
        <View style={[styles.headerContainer, {
          backgroundColor: headerColors.bg,
          borderColor: headerColors.border,
        }]}>
          <TouchableOpacity
            style={styles.rowCenter}
            activeOpacity={0.8}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('Profile' as never);
            }}>
            <View style={styles.imageWrapper}>
              <Image source={UserImg} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {fullName?.trim() ||
                  `${userInfo.first_name} ${userInfo.last_name}`.trim() ||
                  'User Name'}
              </Text>
              {!!userInfo.party_name && (
                <Text style={styles.partyText} numberOfLines={1}>
                  ({userInfo.party_name})
                </Text>
              )}
              <Text style={styles.subTitle} numberOfLines={1}>
                {userInfo.mobile_number || '9814756321'}
              </Text>
              {!!roleLabel && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{`Role: ${roleLabel}`}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.closeDrawer()}>
            <LeftChevron height={scaleHeight(10)} width={scaleWidth(10)} />
          </TouchableOpacity>
        </View>

        {/* Active product switcher — horizontal chip row for multi-product users */}
        {hasMultipleProducts && (
          <View style={styles.activeProductSection}>
            <Text style={styles.sectionLabel}>ACTIVE PRODUCT</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              bounces={false}
              style={styles.productChipScroll}
              contentContainerStyle={styles.productChipRow}>
              {availableProducts.map(product => {
                const isActive = product.code === activeProductCode;
                return (
                  <TouchableOpacity
                    key={product.code}
                    style={[styles.productChip, isActive && styles.productChipActive]}
                    activeOpacity={0.8}
                    onPress={() => handleActiveProductToggle(product)}>
                    <ProductIcon
                      code={product.code}
                      size={scaleHeight(11)}
                      color={isActive ? Colors.white : '#6B7280'}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.productChipText,
                        isActive && styles.productChipTextActive,
                      ]}>
                      {product.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Buttons */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.menuScroll}
          contentContainerStyle={styles.menuScrollContent}>
            <DrawerTreeMenu
              nodes={[productsRootNode]}
              expandedKeys={expandedKeys}
              onToggle={toggleExpandedKey}
              onNavigate={handleMenuNavigate}
            />

            {/* Reporting & Analysis — Cashntech user_type only */}
            {canViewReports ? (
              <View style={styles.reportingSection}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    isReportingOpen && styles.parentMenuButton,
                  ]}
                  onPress={() => setIsReportingOpen(prev => !prev)}>
                  <View style={styles.rowCenter}>
                    <View style={styles.iconBox}>
                      <FontAwesome6
                        name="chart-column"
                        iconStyle="solid"
                        size={scaleHeight(20)}
                        color={isReportingOpen ? Colors.primaryColor : '#84919A'}
                      />
                    </View>
                    <Text
                      style={[
                        isReportingOpen
                          ? styles.parentMenuText
                          : styles.buttonText,
                      ]}>
                      Reporting & Analysis
                    </Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <UpChevron rotation={isReportingOpen ? 0 : 180} />
                  </View>
                </TouchableOpacity>

                {isReportingOpen && (
                  <View style={styles.reportingSubMenu}>
                    {REPORT_MENU_ITEMS.map(item => {
                      const isActive = activeReportKey === item.key;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[styles.button, isActive && styles.activeButton]}
                          onPress={() => handleReportPress(item.key)}>
                          <Text
                            style={[
                              styles.buttonText,
                              styles.reportingSubMenuText,
                              isActive && styles.activeButtonText,
                            ]}>
                            {item.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            {/* Bottom actions: Profile & Logout */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.bottomButton,
                currentRoute === 'Profile' && styles.activeButton,
              ]}
              onPress={() => {
                navigation.closeDrawer();
                navigation.navigate('Profile' as never);
              }}>
              <View style={styles.rowCenter}>
                <View style={styles.iconBox}>
                  <FontAwesome6
                    name="user"
                    iconStyle="solid"
                    size={scaleHeight(20)}
                    color={currentRoute === 'Profile' ? Colors.primaryColor : '#84919A'}
                  />
                </View>
                <Text
                  style={[
                    styles.buttonText,
                    currentRoute === 'Profile' && styles.activeButtonText,
                  ]}>
                  Profile
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.logOut]}
              onPress={handleLogout}>
              <View style={styles.rowCenter}>
                <View style={styles.iconBox}>
                  <Logout height={scaleHeight(22)} width={scaleWidth(22)} />
                </View>
                <Text style={styles.buttonText}>Log Out</Text>
              </View>
            </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootView: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0,
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('screen').height,
  },
  container: {
    flex: 1,
  },
  rowCenter: {flexDirection: 'row', flex: 1, alignItems: 'center'},
  headerContainer: {
    padding: scaleWidth(16),
    paddingBottom: scaleHeight(26),
    backgroundColor: '#FFE9E9',
    borderTopRightRadius: scaleWidth(8),
    borderBottomWidth: scaleWidth(2),
    borderColor: 'rgba(227, 6, 19, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    backgroundColor: 'rgba(236, 74, 83, 0.3)',
    borderRadius: scaleWidth(24),
    height: scaleWidth(24),
    width: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleWidth(8),
  },
  imageWrapper: {
    height: scaleHeight(46),
    width: scaleWidth(46),
    borderRadius: scaleWidth(23),
    overflow: 'hidden',
    backgroundColor: Colors.primaryColor,
  },
  image: {
    height: scaleHeight(46),
    width: scaleWidth(46),
  },
  infoContainer: {
    marginStart: scaleWidth(16),
    flex: 1,
    marginEnd: scaleWidth(20),
    alignItems: 'flex-start',
    minWidth: 0,
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: 'Gilroy-SemiBold',
    color: Colors.primaryColor,
    lineHeight: scaleHeight(20),
    textTransform: 'capitalize',
  },
  partyText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: '#95969C',
    marginTop: scaleHeight(2),
  },
  subTitle: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#95969C',
  },
  roleBadge: {
    marginTop: scaleHeight(6),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    backgroundColor: '#FFE9E9',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(227, 6, 19, 0.4)',
  },
  roleBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  activeProductSection: {
    paddingTop: scaleHeight(14),
    paddingBottom: scaleHeight(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  sectionLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: '#84919A',
    letterSpacing: 0.5,
    marginBottom: scaleHeight(8),
    paddingHorizontal: scaleWidth(16),
  },
  productChipScroll: {
    // Full drawer width so chips can scroll past the edge instead of clipping
    flexGrow: 0,
  },
  productChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    paddingHorizontal: scaleWidth(16),
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: scaleWidth(5),
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(10),
    borderRadius: scaleWidth(20),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  productChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  productChipText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#6B7280',
  },
  productChipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.GilroySemiBold,
  },
  menuScroll: {
    flex: 1,
    marginTop: scaleHeight(12),
    marginHorizontal: scaleWidth(16),
  },
  menuScrollContent: {
    paddingBottom: scaleHeight(16),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(8),
    marginBottom: scaleHeight(4),
    borderRadius: scaleWidth(6),
  },
  activeButton: {
    backgroundColor: '#FFE9E9',
    borderLeftWidth: scaleWidth(3),
    borderLeftColor: Colors.primaryColor,
  },
  parentMenuButton: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: scaleWidth(2),
    borderLeftColor: 'rgba(227, 6, 19, 0.3)',
  },
  arrowContainer: {
    paddingLeft: scaleWidth(16),
    paddingRight: scaleWidth(8),
  },
  // Fixed-width icon slot shared by all drawer rows so labels start at the same x.
  iconBox: {
    width: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#252C32',
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(15),
    marginStart: scaleWidth(12),
    flexShrink: 1,
  },
  activeButtonText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
  },
  disabledMenuItem: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  disabledMenuItemText: {
    color: '#9E9E9E',
  },
  parentMenuText: {
    color: '#E30613',
    fontFamily: Fonts.GilroySemiBold,
  },
  reportingSection: {
    marginTop: scaleHeight(10),
    paddingTop: scaleHeight(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  reportingSubMenu: {
    marginLeft: scaleWidth(16),
  },
  reportingSubMenuText: {
    marginStart: 0,
    fontSize: scaleFont(15),
  },
  logOut: {
    marginBottom: scaleHeight(4),
  },
  bottomButton: {
    marginTop: scaleHeight(8),
  },
});
