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
import {DrawerContentComponentProps, useDrawerStatus} from '@react-navigation/drawer';
import {useNavigationState} from '@react-navigation/native';
import {Colors, Fonts, ROLE_HEADER_COLORS} from '@constants/index';
import {useDispatch, useSelector} from 'react-redux';
import {Alert} from 'react-native';
import {userSelector} from '@store/user';
import {logoutUser} from '@services/api/api';
import Toast from 'react-native-toast-message';
import {AppRole} from '@constants/roles';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {selectPermissions, selectPermissionsLoading} from '@store/permissions';
import {evaluatePermissionKey} from '@utils/effectivePermissions';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {
  selectActiveProductCode,
  selectAvailableProducts,
} from '@store/product/product.selectors';
import {
  getEffectiveProductCode,
  getProductFullDisplayName,
  getProductNavLabel,
  hasCompactNavLabel,
  uniqueProductsByCode,
} from '@store/product/product.resolver';
import {PRODUCT_CODES, PRODUCT_DISPLAY_NAMES, ResolvedProduct} from '@store/product/product.types';
import {ProductIcon} from '@components/ProductSwitcher/ProductIcon';
import {ProductBottomSheet} from '@components/ProductSwitcher/ProductBottomSheet';
import {ProductSwitchConfirmModal} from '@components/ProductSwitcher/ProductSwitchConfirmModal';
import {useProductSwitcherSheet} from '@hooks/useProductSwitcherSheet';
import {useSwitchProductWorkspace} from '@hooks/useSwitchProductWorkspace';
import {DrawerTreeMenu, DrawerMenuNode} from './DrawerTreeMenu';

const REPORT_MENU_ITEMS = [
  {
    key: 'all-loans',
    title: 'All Loans Report',
    route: 'AllLoanReportScreen',
    permission: PERMISSIONS.REPORT_ALL_LOANS,
  },
  {
    key: 'disbursement',
    title: 'Disbursment Report',
    route: 'DisbursementReportScreen',
    permission: PERMISSIONS.REPORT_DISBURSEMENT,
  },
  {
    key: 'dpd',
    title: 'DPD Report',
    route: 'DpdReportScreen',
    permission: PERMISSIONS.REPORT_DPD,
  },
  {
    key: 'daily-accrual',
    title: 'Daily Accrual Report',
    route: 'DailyAccrualReportScreen',
    permission: PERMISSIONS.REPORT_DAILY_ACCRUAL,
  },
  {
    key: 'monthly-interest',
    title: 'Monthly Interest Report',
    route: 'MonthlyInterestReportScreen',
    permission: PERMISSIONS.REPORT_MONTHLY_INTEREST,
  },
  {
    key: 'repayment',
    title: 'Repayment Report',
    route: 'RepaymentReportScreen',
    permission: PERMISSIONS.REPORT_REPAYMENT,
  },
  {
    key: 'invoice-outstanding',
    title: 'Invoice Outstanding Report',
    route: 'InvoiceOutstandingReportScreen',
    permission: PERMISSIONS.REPORT_INVOICE_OUTSTANDING,
  },
  {
    key: 'loan-status',
    title: 'Loan Status Report',
    route: 'LoanStatusReportScreen',
    permission: PERMISSIONS.REPORT_LOAN_STATUS,
  },
  {
    key: 'all-product-outstanding',
    title: 'All Product Outstanding Report',
    route: 'AllProductOutstandingReportScreen',
    permission: PERMISSIONS.REPORT_ALL_PRODUCT_OUTSTANDING,
  },
  {
    key: 'utilization',
    title: 'Utilization Report',
    route: 'UtilizationReportScreen',
    permission: PERMISSIONS.REPORT_UTILIZATION,
  },
] as const;

/** Expand only the active product path: PRODUCTS → product → Transactions (+ route-specific submenus). */
const buildActiveProductExpandedKeys = (
  productCode: string,
  options: {expandFundPlanner?: boolean; expandLoanAccounts?: boolean} = {},
): Record<string, boolean> => {
  const keys: Record<string, boolean> = {
    products: true,
    [`product-${productCode}`]: true,
    [`transactions-${productCode}`]: true,
  };

  if (options.expandFundPlanner) {
    keys[`fundplanner-${productCode}`] = true;
  }
  if (options.expandLoanAccounts) {
    keys[`loanaccounts-${productCode}`] = true;
  }

  return keys;
};

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
  const roleLabel = useSelector(userSelector.getUserRoleLabel);
  const activeProductCode = useSelector(selectActiveProductCode);
  const availableProducts = useSelector(selectAvailableProducts);
  const effectiveProductCode = getEffectiveProductCode(activeProductCode);
  const {
    sheetVisible,
    openSheet,
    closeSheet,
    hasMultipleProducts,
    activeProduct,
  } = useProductSwitcherSheet();
  const {applyWorkspaceSwitch} = useSwitchProductWorkspace();
  const [pendingSwitch, setPendingSwitch] = React.useState<{
    product: ResolvedProduct;
    route: string;
    label: string;
  } | null>(null);
  // PR1 store already defaults DF-only users to a single resolved product;
  // this fallback only guards the brief window before scope/product hydration.
  // uniqueProductsByCode keeps drawer branch order DF → VF → PID.
  const productBranches: ResolvedProduct[] =
    availableProducts.length > 0
      ? uniqueProductsByCode(availableProducts)
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

  // Permissions
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canViewInvoices = useHasPermission(PERMISSIONS.INVOICE_LIST);
  const canViewDisbursement = useHasPermission(PERMISSIONS.DISBURSEMENT);
  const canViewRepayment = useHasPermission(PERMISSIONS.REPAYMENT_SETTLEMENT);
  const canViewInterestAccruals = useHasPermission(PERMISSIONS.INTEREST_ACCRUALS);
  const canViewSOA = useHasPermission(PERMISSIONS.SOA);
  const canViewDPD = useHasPermission(PERMISSIONS.DPD_PENAL_NPA);
  const canViewOverview = useHasPermission(PERMISSIONS.TRANSACTIONS_OVERVIEW);
  const effectivePermissions = useSelector(selectPermissions);
  // null = granted for any product ("All Products"); a UUID = that product only.
  const canViewConsolidatedFor = (productId: string | null) =>
    evaluatePermissionKey(
      effectivePermissions,
      PERMISSIONS.CONSOLIDATED_INVOICE_LIST,
      productId,
    );
  const canViewReports = useHasPermission(PERMISSIONS.REPORTING_ANALYSIS);
  const canViewAllLoansReport = useHasPermission(PERMISSIONS.REPORT_ALL_LOANS);
  const canViewDisbursementReport = useHasPermission(
    PERMISSIONS.REPORT_DISBURSEMENT,
  );
  const canViewDpdReport = useHasPermission(PERMISSIONS.REPORT_DPD);
  const canViewDailyAccrualReport = useHasPermission(
    PERMISSIONS.REPORT_DAILY_ACCRUAL,
  );
  const canViewMonthlyInterestReport = useHasPermission(
    PERMISSIONS.REPORT_MONTHLY_INTEREST,
  );
  const canViewRepaymentReport = useHasPermission(PERMISSIONS.REPORT_REPAYMENT);
  const canViewInvoiceOutstandingReport = useHasPermission(
    PERMISSIONS.REPORT_INVOICE_OUTSTANDING,
  );
  const canViewLoanStatusReport = useHasPermission(
    PERMISSIONS.REPORT_LOAN_STATUS,
  );
  const canViewAllProductOutstandingReport = useHasPermission(
    PERMISSIONS.REPORT_ALL_PRODUCT_OUTSTANDING,
  );
  const canViewUtilizationReport = useHasPermission(
    PERMISSIONS.REPORT_UTILIZATION,
  );

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

  const isFundPlannerRoute =
    isDealerMaker &&
    (currentRoute === 'FinancingRequestScreen' ||
      currentRoute === 'LimitDetailsScreen');

  const isLoanAccountsRoute =
    isDealerMaker &&
    (currentRoute === 'ODDetailsScreen' ||
      currentRoute === 'ODRepaymentsScreen' ||
      currentRoute === 'AnchorsListScreen');

  const drawerStatus = useDrawerStatus();

  const getSyncedExpandedKeys = React.useCallback(() => {
    return buildActiveProductExpandedKeys(effectiveProductCode, {
      expandFundPlanner:
        isFundPlannerRoute && effectiveProductCode === PRODUCT_CODES.DEALER_FINANCE,
      expandLoanAccounts:
        isLoanAccountsRoute && effectiveProductCode === PRODUCT_CODES.DEALER_FINANCE,
    });
  }, [effectiveProductCode, isFundPlannerRoute, isLoanAccountsRoute]);

  // Re-sync tree when active product changes — collapse all inactive branches.
  React.useEffect(() => {
    setExpandedKeys(getSyncedExpandedKeys());
  }, [getSyncedExpandedKeys]);

  // Re-sync when drawer opens so stale manual expansions do not persist.
  React.useEffect(() => {
    if (drawerStatus === 'open') {
      setExpandedKeys(getSyncedExpandedKeys());
    }
  }, [drawerStatus, getSyncedExpandedKeys]);

  const getProductBranchIcon = (code: string, isActive: boolean) => (
    <ProductIcon
      code={code}
      size={scaleHeight(20)}
      color={isActive ? Colors.primaryColor : '#9E9E9E'}
    />
  );

  const annotateUnderActiveProduct = (
    nodes: DrawerMenuNode[],
    isUnderActiveProduct: boolean,
  ): DrawerMenuNode[] =>
    nodes.map(node => ({
      ...node,
      isUnderActiveProduct,
      children: node.children
        ? annotateUnderActiveProduct(node.children, isUnderActiveProduct)
        : undefined,
    }));

  const buildProductBranchNode = (
    product: ResolvedProduct,
    branchIndex: number,
  ): DrawerMenuNode => {
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
        icon: (
          <File
            height={scaleHeight(22)}
            width={scaleWidth(22)}
            color={isActiveProductBranch ? Colors.primaryColor : '#9E9E9E'}
          />
        ),
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

    const fullName = getProductFullDisplayName(product);

    return {
      key: `product-${product.code}`,
      label: getProductNavLabel(product.code),
      fullLabel: hasCompactNavLabel(product.code) ? fullName : undefined,
      icon: getProductBranchIcon(product.code, isActiveProductBranch),
      isActiveProductBranch,
      isInactiveProductBranch: hasMultipleProducts && !isActiveProductBranch,
      showSeparatorBefore: branchIndex > 0,
      highlighted: isActiveProductBranch,
      // Added after annotation: read-only cross-product list, never styled as an inactive-product item.
      children: [
        {
          key: `all-invoices-${product.code}`,
          label: 'All Invoices',
          caption: 'Consolidated view',
          variant: 'consolidated',
          route: 'ConsolidatedInvoices',
          routeParams: {productCode: product.code},
          disabled:
            permissionsLoading || !canViewConsolidatedFor(product.id || null),
          isActive:
            currentRoute === 'ConsolidatedInvoices' &&
            currentRouteParams?.productCode === product.code,
        },
        ...annotateUnderActiveProduct(children, isActiveProductBranch),
      ],
    };
  };

  const allProductsInvoicesNode: DrawerMenuNode = {
    key: 'all-products-invoices',
    label: 'All Invoices',
    caption: 'All products · Consolidated',
    variant: 'consolidated',
    route: 'ConsolidatedInvoices',
    routeParams: {},
    disabled: permissionsLoading || !canViewConsolidatedFor(null),
    isActive:
      currentRoute === 'ConsolidatedInvoices' && !currentRouteParams?.productCode,
  };

  const productsRootNode: DrawerMenuNode = {
    key: 'products',
    label: 'PRODUCTS',
    icon: <Folder height={scaleHeight(22)} width={scaleWidth(22)} />,
    children: [
      allProductsInvoicesNode,
      ...productBranches.map((product, index) =>
        buildProductBranchNode(product, index + 1),
      ),
    ],
  };

  const handleMenuNavigate = (node: DrawerMenuNode) => {
    if (node.disabled || !node.route) {
      return;
    }
    if (node.productContext && node.productContext.code !== activeProductCode) {
      setPendingSwitch({
        product: node.productContext,
        route: node.route,
        label: node.label,
      });
      return;
    }
    navigation.closeDrawer();
    navigation.navigate({name: node.route, params: node.routeParams} as never);
  };

  const cancelPendingSwitch = () => setPendingSwitch(null);

  const confirmPendingSwitch = () => {
    if (!pendingSwitch) {
      return;
    }
    const {product, route} = pendingSwitch;
    setPendingSwitch(null);
    navigation.closeDrawer();
    applyWorkspaceSwitch(product, route);
  };

  const reportPermissionMap: Record<string, boolean> = {
    'all-loans': canViewAllLoansReport,
    disbursement: canViewDisbursementReport,
    dpd: canViewDpdReport,
    'daily-accrual': canViewDailyAccrualReport,
    'monthly-interest': canViewMonthlyInterestReport,
    repayment: canViewRepaymentReport,
    'invoice-outstanding': canViewInvoiceOutstandingReport,
    'loan-status': canViewLoanStatusReport,
    'all-product-outstanding': canViewAllProductOutstandingReport,
    utilization: canViewUtilizationReport,
  };

  const handleReportPress = (reportKey: string) => {
    if (!reportPermissionMap[reportKey]) {
      return;
    }
    setActiveReportKey(reportKey);
    navigation.closeDrawer();
    const report = REPORT_MENU_ITEMS.find(item => item.key === reportKey);
    if (report?.route) {
      navigation.navigate(report.route as never);
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
          <View style={styles.headerLeft}>
            <View style={styles.headerProfileRow}>
              <TouchableOpacity
                style={styles.headerProfileTouchable}
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
                    <Text
                      style={styles.partyText}
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      {userInfo.party_name}
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
            </View>

            {activeProduct ? (
              hasMultipleProducts ? (
                <TouchableOpacity
                  style={styles.headerActiveProductStrip}
                  activeOpacity={0.8}
                  onPress={openSheet}
                  accessibilityRole="button"
                  accessibilityLabel={`Active product ${getProductFullDisplayName(activeProduct)}. Tap to switch.`}>
                  <View style={styles.headerActiveProductContent}>
                    <Text style={styles.headerActiveProductLabel}>Active Product</Text>
                    <Text
                      style={styles.headerActiveProductName}
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      {getProductFullDisplayName(activeProduct)}
                    </Text>
                  </View>
                  <UpChevron
                    rotation={180}
                    height={scaleHeight(10)}
                    width={scaleWidth(10)}
                    color="#84919A"
                  />
                </TouchableOpacity>
              ) : (
                <View
                  style={styles.headerActiveProductStrip}
                  accessibilityLabel={`Active product ${getProductFullDisplayName(activeProduct)}`}>
                  <View style={styles.headerActiveProductContent}>
                    <Text style={styles.headerActiveProductLabel}>Active Product</Text>
                    <Text
                      style={styles.headerActiveProductName}
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      {getProductFullDisplayName(activeProduct)}
                    </Text>
                  </View>
                </View>
              )
            ) : null}

            {hasMultipleProducts ? (
              <ProductBottomSheet visible={sheetVisible} onClose={closeSheet} />
            ) : null}
            <ProductSwitchConfirmModal
              visible={!!pendingSwitch}
              fromProduct={activeProduct}
              toProduct={pendingSwitch?.product ?? null}
              targetLabel={pendingSwitch?.label}
              onCancel={cancelPendingSwitch}
              onConfirm={confirmPendingSwitch}
            />
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.closeDrawer()}>
            <LeftChevron height={scaleHeight(10)} width={scaleWidth(10)} />
          </TouchableOpacity>
        </View>

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

            {/* Reporting & Analysis — permission-based, matches web */}
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
                        styles.buttonText,
                        isReportingOpen && styles.parentMenuText,
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
                      const isEnabled = reportPermissionMap[item.key];
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.button,
                            isActive && styles.activeButton,
                            !isEnabled && styles.disabledMenuItem,
                          ]}
                          disabled={!isEnabled}
                          onPress={() => handleReportPress(item.key)}>
                          <Text
                            style={[
                              styles.buttonText,
                              styles.reportingSubMenuText,
                              isActive && styles.activeButtonText,
                              !isEnabled && styles.disabledMenuItemText,
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
    paddingBottom: scaleHeight(20),
    backgroundColor: '#FFE9E9',
    borderTopRightRadius: scaleWidth(8),
    borderBottomWidth: scaleWidth(2),
    borderColor: 'rgba(227, 6, 19, 0.5)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerProfileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerActiveProductStrip: {
    marginTop: scaleHeight(12),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(4),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerActiveProductContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: scaleWidth(8),
  },
  headerActiveProductLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: '#84919A',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: scaleHeight(4),
  },
  headerActiveProductName: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: '#374151',
    lineHeight: scaleHeight(20),
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
    marginStart: scaleWidth(12),
    flex: 1,
    marginEnd: scaleWidth(4),
    alignItems: 'flex-start',
    alignSelf: 'stretch',
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
    lineHeight: scaleHeight(16),
    alignSelf: 'stretch',
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
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
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
