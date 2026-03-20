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
} from '@assets/Icons';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {useNavigationState} from '@react-navigation/native';
import {Colors, Fonts, ROLE_HEADER_COLORS} from '@constants/index';
import {useDispatch, useSelector} from 'react-redux';
import {Alert} from 'react-native';
import {userSelector} from '@store/user';
import {logoutUser} from '@services/api/api';
import Toast from 'react-native-toast-message';
import {AppRole, ROLE_LABELS} from '@constants/roles';

export const DrawerContent = ({navigation}: DrawerContentComponentProps) => {
  const [isTransactionsOpen, setIsTransactionsOpen] = React.useState(false);
  const [isFundPlannerOpen, setIsFundPlannerOpen] = React.useState(false);
  const [isLoanAccountsOpen, setIsLoanAccountsOpen] = React.useState(false);
  const {top, bottom} = useSafeAreaInsets();
  const userInfo = useSelector(userSelector.getUserInfo);
  const fullName = useSelector(userSelector.getFullName);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  
  // Get role-based header colors (default to anchor_maker if no role)
  const headerColors = userRole
    ? ROLE_HEADER_COLORS[userRole]
    : ROLE_HEADER_COLORS.anchor_maker;
  
  // Role-based menu visibility
  const isAnchorMaker = userRole === 'anchor_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCashnTechUser = userRole === 'cashntech_user';

  // Show TRANSACTIONS menu for all roles (including CashnTech User - same menu)
  const showTransactions = true;

  // Show Payments section for all roles (visible but disabled/gray for everyone)
  const showPayments = isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser;
  
  // Show Fund Planner for Dealer Maker only (removed dealer_checker)
  const showFundPlanner = isDealerMaker;
  
  // Show Loan Accounts for Dealer Maker only (removed dealer_checker)
  const showLoanAccounts = isDealerMaker;
  
  // Use shared role labels so all roles (including dealer_checker) are supported
  const roleLabel = userRole ? ROLE_LABELS[userRole] : '';
  
  // Show specific Invoice menu items based on role (including CashnTech User - same menu)
  const showPendingApprovals = isAnchorMaker || isAnchorChecker || isDealerChecker || isCashnTechUser;
  const showRejectedFinances = isAnchorMaker || isAnchorChecker || isDealerChecker || isCashnTechUser;
  const showDiscountingPayments = isAnchorMaker || isAnchorChecker || isDealerChecker || isCashnTechUser;
  
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
    // Check if current route is under TRANSACTIONS
    const isTransactionRoute = 
      currentRoute === 'InvoiceDashboard' ||
      currentRoute === 'InvoiceDetails' ||
      currentRoute === 'CreateInvoice' ||
      currentRoute === 'UploadInvoiceList' ||
      currentRoute === 'PendingApprovals' ||
      currentRoute === 'RejectedFinances' ||
      currentRoute === 'DiscountingPayments' ||
      currentRoute === 'DPDInvoiceList' ||
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
      currentRoute === 'DPDPenalInterestNPAScreen';

    if (isTransactionRoute) {
      setIsTransactionsOpen(true);
    }

    // Check if current route is under Fund Planner (Dealer Maker only)
    const isFundPlannerRoute = 
      isDealerMaker &&
      (currentRoute === 'FinancingRequestScreen' ||
       currentRoute === 'LimitDetailsScreen');

    if (isFundPlannerRoute) {
      setIsFundPlannerOpen(true);
    }

    // Check if current route is under Loan Accounts (Dealer Maker only)
    const isLoanAccountsRoute = 
      isDealerMaker &&
      (currentRoute === 'ODDetailsScreen' ||
       currentRoute === 'ODRepaymentsScreen' ||
       currentRoute === 'AnchorsListScreen');

    if (isLoanAccountsRoute) {
      setIsLoanAccountsOpen(true);
    }

  }, [currentRoute]);

  const handleLogout = () => {
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
        <View style={styles.buttonContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              {/* TRANSACTIONS Root Menu - click expands to show Invoice; Invoice is main area with its sub-menus */}
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
                    TRANSACTIONS
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <UpChevron rotation={isTransactionsOpen ? 0 : 180} />
                </View>
              </TouchableOpacity>

              {isTransactionsOpen && (
                <View style={{marginLeft: scaleWidth(24)}}>
                  {/* Same structure for Anchor Maker, Anchor Checker, Dealer Maker, Dealer Checker, and CashnTech User */}
                  {(isAnchorMaker || isAnchorChecker || isDealerChecker || isDealerMaker || isCashnTechUser) && (
                    <>
                      {/* 1. Invoice Overview - Direct item */}
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

                      {/* 2. Invoice List & Approvals - Direct item */}
                      <TouchableOpacity
                        style={[
                          styles.button,
                          (currentRoute === 'InvoiceDetails' ||
                            currentRoute === 'CreateInvoice' ||
                            currentRoute === 'UploadInvoiceList') &&
                            styles.activeButton,
                        ]}
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
                          ]}>
                          Invoice List & Approvals
                        </Text>
                      </TouchableOpacity>

                      {/* 3. Disbursement - disabled for Anchor Checker (like Repayment & Settlement) */}
                      {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser) && (
                        isAnchorChecker ? (
                          <TouchableOpacity
                            style={[styles.button, styles.disabledMenuItem]}
                            onPress={() => {}}
                            activeOpacity={1}>
                            <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                              Disbursement
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'DisbursementScreen' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('DisbursementScreen');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'DisbursementScreen' && styles.activeButtonText,
                              ]}>
                              Disbursement
                            </Text>
                          </TouchableOpacity>
                        )
                      )}

                      {/* 4. Interest Accruals - disabled for Anchor Checker (like Repayment & Settlement) */}
                      {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser) && (
                        isAnchorChecker ? (
                          <TouchableOpacity
                            style={[styles.button, styles.disabledMenuItem]}
                            onPress={() => {}}
                            activeOpacity={1}>
                            <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                              Interest Accruals
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'InterestAccrualsScreen' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('InterestAccrualsScreen');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'InterestAccrualsScreen' && styles.activeButtonText,
                              ]}>
                              Interest Accruals
                            </Text>
                          </TouchableOpacity>
                        )
                      )}

                      {/* 5. Repayment & Settlement - visible but disabled for now */}
                      {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser) && (
                        <TouchableOpacity
                          style={[styles.button, styles.disabledMenuItem]}
                          onPress={() => {}}
                          activeOpacity={1}>
                          <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                            Repayment & Settlement
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* 6. DPD / Penal Interest / NPA - visible but disabled for now */}
                      {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker || isCashnTechUser) && (
                        <TouchableOpacity
                          style={[styles.button, styles.disabledMenuItem]}
                          onPress={() => {}}
                          activeOpacity={1}>
                          <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                            DPD / Penal Interest / NPA
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Pending Approvals - visible but disabled for now */}
                      {showPendingApprovals && (
                        <TouchableOpacity
                          style={[styles.button, styles.disabledMenuItem]}
                          onPress={() => {}}
                          activeOpacity={1}>
                          <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                            Pending Approvals
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Rejected Finance - visible but disabled for now */}
                      {showRejectedFinances && (
                        <TouchableOpacity
                          style={[styles.button, styles.disabledMenuItem]}
                          onPress={() => {}}
                          activeOpacity={1}>
                          <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                            Rejected Finance
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Discounting Invoices - visible but disabled for now */}
                      {showDiscountingPayments && (
                        <TouchableOpacity
                          style={[styles.button, styles.disabledMenuItem]}
                          onPress={() => {}}
                          activeOpacity={1}>
                          <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                            Discounting Invoices
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* DPD Invoice List - visible but disabled for now */}
                      <TouchableOpacity
                        style={[styles.button, styles.disabledMenuItem]}
                        onPress={() => {}}
                        activeOpacity={1}>
                        <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                          DPD Invoice List
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Payments - visible but disabled for all users (gray, no expand) */}
                  {showPayments && (
                    <TouchableOpacity
                      style={[styles.button, styles.disabledMenuItem]}
                      onPress={() => {}}
                      activeOpacity={1}>
                      <Text style={[styles.buttonText, styles.disabledMenuItemText]}>
                        Payments
                      </Text>
                    </TouchableOpacity>
                  )}

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
          </ScrollView>
        </View>
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
        {/* Logout Button*/}
        <TouchableOpacity onPress={handleLogout}>
          <View style={styles.logOut}>
            <View style={styles.row}>
              <Logout height={scaleHeight(24)} width={scaleWidth(24)} />
              <Text style={styles.buttonText}>Log Out</Text>
            </View>
          </View>
        </TouchableOpacity>
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
  buttonContainer: {
    flex: 1,
    marginTop: scaleHeight(24),
    marginHorizontal: scaleWidth(16),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scaleWidth(8),
    marginBottom: scaleHeight(12),
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
  logOut: {
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(64),
  },
  bottomButton: {
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(12),
    padding: scaleWidth(8),
    borderRadius: scaleWidth(4),
  },
});
