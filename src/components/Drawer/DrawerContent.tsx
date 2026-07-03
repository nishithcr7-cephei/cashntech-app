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
  BankBuilding,
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
  const [isProductsOpen, setIsProductsOpen] = React.useState(false);
  const [isReportingOpen, setIsReportingOpen] = React.useState(false);
  const [activeReportKey, setActiveReportKey] = React.useState<string | null>(null);
  const [isDealerFinanceOpen, setIsDealerFinanceOpen] = React.useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = React.useState(false);
  const [isFundPlannerOpen, setIsFundPlannerOpen] = React.useState(false);
  const [isLoanAccountsOpen, setIsLoanAccountsOpen] = React.useState(false);
  const {top, bottom} = useSafeAreaInsets();
  const userInfo = useSelector(userSelector.getUserInfo);
  const fullName = useSelector(userSelector.getFullName);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const canViewReports = useSelector(getIsCashntechUserType);
  
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

  // Show TRANSACTIONS menu for all roles (including CashnTech User - same menu)
  const showTransactions = true;

  // Show Payments section for all roles (visible but disabled/gray for everyone)
  const showPayments = false;
  
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
  
  // Show specific Invoice menu items based on role (including CashnTech User - same menu)
  const showPendingApprovals = false;
  const showRejectedFinances = false;
  const showDiscountingPayments = false;
  
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
  const isDealerLandingRoute =
    isDealerMaker &&
    currentRoute === 'DealerMakerDashboardScreen' &&
    dealerMode !== 'dashboard'; // default to landing if no mode
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

    // 2. Set states based on routes
    if (isTransactionRoute || isFundPlannerRoute || isLoanAccountsRoute) {
      setIsProductsOpen(true);
      setIsDealerFinanceOpen(true);
      setIsTransactionsOpen(true);
    }

    if (isFundPlannerRoute) {
      setIsFundPlannerOpen(true);
    }

    if (isLoanAccountsRoute) {
      setIsLoanAccountsOpen(true);
    }

  }, [currentRoute, isDealerMaker]);

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

        {/* Buttons */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.menuScroll}
          contentContainerStyle={styles.menuScrollContent}>
            <View>
              {/* PRODUCTS Root Menu */}
              <TouchableOpacity
                style={[
                  styles.button,
                  isProductsOpen && styles.parentMenuButton,
                ]}
                onPress={() => {
                  setIsProductsOpen(!isProductsOpen);
                }}>
                <View style={styles.rowCenter}>
                  <Folder
                    height={scaleHeight(24)}
                    width={scaleWidth(24)}
                  />
                  <Text
                    style={[
                      isProductsOpen ? styles.parentMenuText : styles.buttonText,
                    ]}>
                    PRODUCTS
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <UpChevron rotation={isProductsOpen ? 0 : 180} />
                </View>
              </TouchableOpacity>

              {isProductsOpen && (
                <View style={{marginLeft: scaleWidth(16)}}>
                  {/* Dealer Finance - child of Products */}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      isDealerFinanceOpen && styles.parentMenuButton,
                    ]}
                    onPress={() => {
                      setIsDealerFinanceOpen(!isDealerFinanceOpen);
                    }}>
                    <View style={styles.rowCenter}>
                      <BankBuilding
                        height={scaleHeight(24)}
                        width={scaleWidth(24)}
                      />
                      <Text
                        style={[
                          isDealerFinanceOpen ? styles.parentMenuText : styles.buttonText,
                        ]}>
                        Dealer Finance
                      </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <UpChevron rotation={isDealerFinanceOpen ? 0 : 180} />
                    </View>
                  </TouchableOpacity>

                  {isDealerFinanceOpen && (
                    <View style={{marginLeft: scaleWidth(16)}}>
                      {/* TRANSACTIONS - child of Dealer Finance */}
                      <TouchableOpacity
                        style={[
                          styles.button,
                          isTransactionsOpen && styles.parentMenuButton,
                        ]}
                        onPress={() => {
                          setIsTransactionsOpen(!isTransactionsOpen);
                        }}>
                        <View style={styles.rowCenter}>
                          <File
                            height={scaleHeight(24)}
                            width={scaleWidth(24)}
                          />
                          <Text
                            style={[
                              isTransactionsOpen ? styles.parentMenuText : styles.buttonText,
                            ]}>
                            Transactions
                          </Text>
                        </View>
                        <View style={styles.arrowContainer}>
                          <UpChevron rotation={isTransactionsOpen ? 0 : 180} />
                        </View>
                      </TouchableOpacity>

                      {isTransactionsOpen && (
                        <View style={{marginLeft: scaleWidth(16)}}>
                          {/* Same structure for Anchor Maker, Anchor Checker, Dealer Maker, Dealer Checker, and CashnTech User */}
                          {(isAnchorMaker || isAnchorChecker || isDealerChecker || isDealerMaker || isCashnTechUser) && (
                            <>
                              {/* 1. Invoice Overview - Direct item */}
                              {canViewOverview && (
                                <TouchableOpacity
                                  style={[
                                    styles.button,
                                    (currentRoute === 'InvoiceDashboard' || isDealerInvoiceDashboardRoute) &&
                                      styles.activeButton,
                                  ]}
                                  onPress={() => {
                                    navigation.closeDrawer();
                                    navigation.navigate('InvoiceDashboard');
                                  }}>
                                  <Text
                                    style={[
                                      styles.buttonText,
                                      (currentRoute === 'InvoiceDashboard' || isDealerInvoiceDashboardRoute) &&
                                        styles.activeButtonText,
                                    ]}>
                                    Invoice Overview
                                  </Text>
                                </TouchableOpacity>
                              )}

                              {/* 2. Invoice List & Approvals - Direct item */}
                              {canViewInvoices && (
                                <TouchableOpacity
                                  style={[
                                    styles.button,
                                    (currentRoute === 'InvoiceDetails' ||
                                      currentRoute === 'CreateInvoice' ||
                                      currentRoute === 'UploadInvoiceList') &&
                                      styles.activeButton,
                                    permissionsLoading && styles.disabledMenuItem,
                                  ]}
                                  disabled={permissionsLoading}
                                  onPress={() => {
                                    navigation.navigate('InvoiceDetails');
                                    navigation.closeDrawer();
                                  }}>
                                  <Text
                                    style={[
                                      styles.buttonText,
                                      (currentRoute === 'InvoiceDetails' ||
                                        currentRoute === 'CreateInvoice' ||
                                        currentRoute === 'UploadInvoiceList') &&
                                        styles.activeButtonText,
                                      permissionsLoading && styles.disabledMenuItemText,
                                    ]}>
                                    Invoice List & Approvals
                                  </Text>
                                </TouchableOpacity>
                              )}

                              {/* 3. Disbursement */}
                              {canViewDisbursement && (
                                <TouchableOpacity
                                  style={[
                                    styles.button,
                                    currentRoute === 'DisbursementScreen' && styles.activeButton,
                                    permissionsLoading && styles.disabledMenuItem,
                                  ]}
                                  disabled={permissionsLoading}
                                  onPress={() => {
                                    navigation.navigate('DisbursementScreen');
                                    navigation.closeDrawer();
                                  }}>
                                  <Text
                                    style={[
                                      styles.buttonText,
                                      currentRoute === 'DisbursementScreen' && styles.activeButtonText,
                                      permissionsLoading && styles.disabledMenuItemText,
                                    ]}>
                                    Disbursement
                                  </Text>
                                </TouchableOpacity>
                              )}

                              {/* 4. Interest Accruals */}
                              <TouchableOpacity
                                style={[
                                  styles.button,
                                  currentRoute === 'InterestAccrualsScreen' && styles.activeButton,
                                  permissionsLoading && styles.disabledMenuItem,
                                ]}
                                disabled={permissionsLoading || !canViewInterestAccruals}
                                onPress={() => {
                                  navigation.navigate('InterestAccrualsScreen');
                                  navigation.closeDrawer();
                                }}>
                                <Text
                                  style={[
                                    styles.buttonText,
                                    currentRoute === 'InterestAccrualsScreen' && styles.activeButtonText,
                                    (permissionsLoading || !canViewInterestAccruals) && styles.disabledMenuItemText,
                                  ]}>
                                  Interest Accruals
                                </Text>
                              </TouchableOpacity>

                              {/* 5. Repayment & Settlement */}
                              {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser) ? (
                                <TouchableOpacity
                                  style={[
                                    styles.button,
                                    currentRoute === 'RepaymentSettlementScreen' && styles.activeButton,
                                    permissionsLoading && styles.disabledMenuItem,
                                  ]}
                                  disabled={permissionsLoading || !canViewRepayment}
                                  onPress={() => {
                                    navigation.navigate('RepaymentSettlementScreen');
                                    navigation.closeDrawer();
                                  }}>
                                  <Text
                                    style={[
                                      styles.buttonText,
                                      currentRoute === 'RepaymentSettlementScreen' && styles.activeButtonText,
                                      (permissionsLoading || !canViewRepayment) && styles.disabledMenuItemText,
                                    ]}>
                                    Repayment & Settlement
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[styles.button, styles.disabledMenuItem]}
                                  onPress={() => {}}
                                  activeOpacity={1}>
                                  <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                    Repayment & Settlement
                                  </Text>
                                </TouchableOpacity>
                              )}

                              {/* 6. DPD / Penal Interest / NPA */}
                              {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser) ? (
                                <TouchableOpacity
                                  style={[
                                    styles.button,
                                    currentRoute === 'DPDPenalInterestNPAScreen' && styles.activeButton,
                                  ]}
                                  disabled={!canViewDPD}
                                  onPress={() => {
                                    navigation.navigate('DPDPenalInterestNPAScreen');
                                    navigation.closeDrawer();
                                  }}>
                                  <Text
                                    style={[
                                      styles.buttonText,
                                      currentRoute === 'DPDPenalInterestNPAScreen' &&
                                        styles.activeButtonText,
                                      !canViewDPD && styles.disabledMenuItemText,
                                    ]}>
                                    DPD / Penal Interest / NPA
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[styles.button, styles.disabledMenuItem]}
                                  onPress={() => {}}
                                  activeOpacity={1}>
                                  <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                    DPD / Penal Interest / NPA
                                  </Text>
                                </TouchableOpacity>
                              )}

                              {/* 7. Statement of Account (SOA) */}
                              {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser) ? (
                                <TouchableOpacity
                                  style={[
                                    styles.button,
                                    currentRoute === 'StatementOfAccount' && styles.activeButton,
                                  ]}
                                  disabled={!canViewSOA}
                                  onPress={() => {
                                    navigation.navigate('StatementOfAccount');
                                    navigation.closeDrawer();
                                  }}>
                                  <Text
                                    style={[
                                      styles.buttonText,
                                      currentRoute === 'StatementOfAccount' &&
                                        styles.activeButtonText,
                                      !canViewSOA && styles.disabledMenuItemText,
                                    ]}>
                                    Statement of Account (SOA)
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[styles.button, styles.disabledMenuItem]}
                                  onPress={() => {}}
                                  activeOpacity={1}>
                                  <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                    Statement of Account (SOA)
                                  </Text>
                                </TouchableOpacity>
                              )}


                            </>
                          )}

                          {/* Payments - visible but disabled for all users (gray, no expand) */}


                          {/* Fund Planner Submenu - Dealer Maker only */}
                          {showFundPlanner && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.button,
                                  isFundPlannerOpen && styles.parentMenuButton,
                                ]}
                                onPress={() => {
                                  setIsFundPlannerOpen(!isFundPlannerOpen);
                                }}>
                                <View style={styles.rowCenter}>
                                  <Text
                                    style={[
                                      isFundPlannerOpen ? styles.parentMenuText : styles.buttonText,
                                    ]}>
                                    Fund Planner
                                  </Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                  <UpChevron rotation={isFundPlannerOpen ? 0 : 180} />
                                </View>
                              </TouchableOpacity>

                              {isFundPlannerOpen && (
                                <View style={{marginLeft: scaleWidth(24)}}>
                                  {/* Financing Request - visible but disabled for now */}
                                  <TouchableOpacity
                                    style={[styles.button, styles.disabledMenuItem]}
                                    onPress={() => {}}
                                    activeOpacity={1}>
                                    <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                      Financing Request
                                    </Text>
                                  </TouchableOpacity>

                                  {/* Limit Details - visible but disabled for now */}
                                  <TouchableOpacity
                                    style={[styles.button, styles.disabledMenuItem]}
                                    onPress={() => {}}
                                    activeOpacity={1}>
                                    <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                      Limit Details
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </>
                          )}

                          {/* Loan Accounts Submenu - Dealer Maker only */}
                          {showLoanAccounts && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.button,
                                  isLoanAccountsOpen && styles.parentMenuButton,
                                ]}
                                onPress={() => {
                                  setIsLoanAccountsOpen(!isLoanAccountsOpen);
                                }}>
                                <View style={styles.rowCenter}>
                                  <Text
                                    style={[
                                      isLoanAccountsOpen ? styles.parentMenuText : styles.buttonText,
                                    ]}>
                                    Loan Accounts
                                  </Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                  <UpChevron rotation={isLoanAccountsOpen ? 0 : 180} />
                                </View>
                              </TouchableOpacity>

                              {isLoanAccountsOpen && (
                                <View style={{marginLeft: scaleWidth(24)}}>
                                  {/* OD Details - visible but disabled for now */}
                                  <TouchableOpacity
                                    style={[styles.button, styles.disabledMenuItem]}
                                    onPress={() => {}}
                                    activeOpacity={1}>
                                    <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                      OD Details
                                    </Text>
                                  </TouchableOpacity>

                                  {/* OD Repayments - visible but disabled for now */}
                                  <TouchableOpacity
                                    style={[styles.button, styles.disabledMenuItem]}
                                    onPress={() => {}}
                                    activeOpacity={1}>
                                    <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                      OD Repayments
                                    </Text>
                                  </TouchableOpacity>

                                  {/* Anchors List - visible but disabled for now */}
                                  <TouchableOpacity
                                    style={[styles.button, styles.disabledMenuItem]}
                                    onPress={() => {}}
                                    activeOpacity={1}>
                                    <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                                      Anchors List
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

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
                    <FontAwesome6
                      name="chart-column"
                      iconStyle="solid"
                      size={scaleHeight(22)}
                      color={isReportingOpen ? Colors.primaryColor : '#84919A'}
                    />
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
              onPress={() => {
                navigation.closeDrawer();
                navigation.navigate('Profile' as never);
              }}>
              <View
                style={[
                  styles.bottomButton,
                  currentRoute === 'Profile' && styles.activeButton,
                ]}>
                <View style={styles.row}>
                  <Text
                    style={[
                      styles.buttonText,
                      currentRoute === 'Profile' && styles.activeButtonText,
                    ]}>
                    Profile
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <View style={styles.logOut}>
                <View style={styles.row}>
                  <Logout height={scaleHeight(24)} width={scaleWidth(24)} />
                  <Text style={styles.buttonText}>Log Out</Text>
                </View>
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
  row: {flexDirection: 'row', alignItems: 'center'},
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
    paddingVertical: scaleHeight(4),
    paddingHorizontal: scaleWidth(8),
    marginBottom: scaleHeight(2),
    borderRadius: scaleWidth(4),
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
  buttonText: {
    color: '#252C32',
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(16),
    marginStart: scaleWidth(16),
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
    marginTop: scaleHeight(4),
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
    marginBottom: scaleHeight(2),
    paddingVertical: scaleHeight(4),
    paddingHorizontal: scaleWidth(8),
    borderRadius: scaleWidth(4),
  },
});
