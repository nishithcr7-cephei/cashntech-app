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
  const [isPaymentsOpen, setIsPaymentsOpen] = React.useState(false);
  const [isFundPlannerOpen, setIsFundPlannerOpen] = React.useState(false);
  const [isLoanAccountsOpen, setIsLoanAccountsOpen] = React.useState(false);
  const {top, bottom} = useSafeAreaInsets();
  const userInfo = useSelector(userSelector.getUserInfo);
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
  
  // Show TRANSACTIONS menu for all roles
  const showTransactions = true;
  
  // Show Payments section for Anchor Maker, Anchor Checker, and Dealer Checker
  const showPayments = isAnchorMaker || isAnchorChecker || isDealerChecker;
  
  // Show Fund Planner for Dealer Maker only (removed dealer_checker)
  const showFundPlanner = isDealerMaker;
  
  // Show Loan Accounts for Dealer Maker only (removed dealer_checker)
  const showLoanAccounts = isDealerMaker;
  
  // Use shared role labels so all roles (including dealer_checker) are supported
  const roleLabel = userRole ? ROLE_LABELS[userRole] : '';
  
  // Show specific Invoice menu items based on role (added dealer_checker)
  const showPendingApprovals = isAnchorMaker || isAnchorChecker || isDealerChecker;
  const showRejectedFinances = isAnchorMaker || isAnchorChecker || isDealerChecker;
  const showDiscountingPayments = isAnchorMaker || isAnchorChecker || isDealerChecker;
  
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
      currentRoute === 'DisbursementScreen';

    if (isTransactionRoute) {
      setIsTransactionsOpen(true);
    }

    // Check if current route is under Payments
    const isPaymentRoute = 
      currentRoute === 'DealerInvoiceList' ||
      currentRoute === 'FundingLimitsForDealers' ||
      currentRoute === 'ANCreditAccount' ||
      currentRoute === 'CreditAccountDetails' ||
      currentRoute === 'CreditAccountInvoiceNumber' ||
      currentRoute === 'CreditAccountDailyInterest';

    if (isPaymentRoute) {
      setIsPaymentsOpen(true);
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
          <View style={styles.rowCenter}>
            <Image source={UserImg} style={styles.image} resizeMode="contain" />
            <View style={styles.infoContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {userInfo.email || 'test@gmail.com'}
              </Text>
              <Text style={styles.subTitle} numberOfLines={2}>
                {userInfo.mobile_number || '9814756321'}
              </Text>
              {!!roleLabel && (
                <TouchableOpacity
                  style={styles.roleBadge}
                  onPress={() => {
                    navigation.closeDrawer();
                    // Navigate to SelectRoleScreen (in root Auth stack) so user can change role
                    (navigation.getParent() as any)?.navigate('SelectRoleScreen');
                  }}
                  activeOpacity={0.7}>
                  <Text style={styles.roleBadgeText}>{`Role: ${roleLabel}`}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
                  {/* Same structure for Anchor Maker, Anchor Checker, and Dealer Checker */}
                  {(isAnchorMaker || isAnchorChecker || isDealerChecker || isDealerMaker) && (
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

                      {/* 3. Disbursement - Anchor Maker, Anchor Checker, Dealer Maker & Dealer Checker */}
                      {(isAnchorMaker || isAnchorChecker || isDealerMaker || isDealerChecker) && (
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
                      )}

                      {/* Pending Approvals - Anchor Maker & Anchor Checker only */}
                      {showPendingApprovals && (
                        <TouchableOpacity
                          style={[
                            styles.button,
                            currentRoute === 'PendingApprovals' && styles.activeButton,
                          ]}
                          onPress={() => {
                            navigation.navigate('PendingApprovals');
                            navigation.closeDrawer();
                          }}>
                          <Text
                            style={[
                              styles.buttonText,
                              currentRoute === 'PendingApprovals' && styles.activeButtonText,
                            ]}>
                            Pending Approvals
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Rejected Finance - Anchor Maker & Anchor Checker only */}
                      {showRejectedFinances && (
                        <TouchableOpacity
                          style={[
                            styles.button,
                            currentRoute === 'RejectedFinances' && styles.activeButton,
                          ]}
                          onPress={() => {
                            navigation.navigate('RejectedFinances');
                            navigation.closeDrawer();
                          }}>
                          <Text
                            style={[
                              styles.buttonText,
                              currentRoute === 'RejectedFinances' && styles.activeButtonText,
                            ]}>
                            Rejected Finance
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Discounting Invoices - Anchor Maker & Anchor Checker only */}
                      {showDiscountingPayments && (
                        <TouchableOpacity
                          style={[
                            styles.button,
                            currentRoute === 'DiscountingPayments' && styles.activeButton,
                          ]}
                          onPress={() => {
                            navigation.navigate('DiscountingPayments');
                            navigation.closeDrawer();
                          }}>
                          <Text
                            style={[
                              styles.buttonText,
                              currentRoute === 'DiscountingPayments' && styles.activeButtonText,
                            ]}>
                            Discounting Invoices
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* DPD Invoice List */}
                      <TouchableOpacity
                        style={[
                          styles.button,
                          currentRoute === 'DPDInvoiceList' && styles.activeButton,
                        ]}
                        onPress={() => {
                          navigation.navigate('DPDInvoiceList');
                          navigation.closeDrawer();
                        }}>
                        <Text
                          style={[
                            styles.buttonText,
                            currentRoute === 'DPDInvoiceList' && styles.activeButtonText,
                          ]}>
                          DPD Invoice List
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Payments Submenu - Anchor Maker & Anchor Checker only */}
                  {showPayments && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          isPaymentsOpen && styles.parentMenuButton,
                        ]}
                        onPress={() => {
                          setIsPaymentsOpen(!isPaymentsOpen);
                        }}>
                        <View style={styles.rowCenter}>
                          <Text
                            style={[
                              isPaymentsOpen ? styles.parentMenuText : styles.buttonText,
                            ]}>
                            Payments
                          </Text>
                        </View>
                        <View style={styles.arrowContainer}>
                          <UpChevron rotation={isPaymentsOpen ? 0 : 180} />
                        </View>
                      </TouchableOpacity>

                      {isPaymentsOpen && (
                        <View style={{marginLeft: scaleWidth(24)}}>
                          {/* Dealers List */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'DealerInvoiceList' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('DealerInvoiceList');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'DealerInvoiceList' && styles.activeButtonText,
                              ]}>
                              Dealers List
                            </Text>
                          </TouchableOpacity>

                          {/* Funding Limits */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'FundingLimitsForDealers' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('FundingLimitsForDealers');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'FundingLimitsForDealers' && styles.activeButtonText,
                              ]}>
                              Funding Limits
                            </Text>
                          </TouchableOpacity>

                          {/* Anchor Credit Account */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'ANCreditAccount' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('ANCreditAccount');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'ANCreditAccount' && styles.activeButtonText,
                              ]}>
                              Anchor Credit Account
                            </Text>
                          </TouchableOpacity>

                          {/* Credit Account Details */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'CreditAccountDetails' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('CreditAccountDetails');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'CreditAccountDetails' && styles.activeButtonText,
                              ]}>
                              Credit Account Details
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
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
                          {/* Financing Request */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'FinancingRequestScreen' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('FinancingRequestScreen');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'FinancingRequestScreen' && styles.activeButtonText,
                              ]}>
                              Financing Request
                            </Text>
                          </TouchableOpacity>

                          {/* Limit Details */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'LimitDetailsScreen' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('LimitDetailsScreen');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'LimitDetailsScreen' && styles.activeButtonText,
                              ]}>
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
                          {/* OD Details */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'ODDetailsScreen' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('ODDetailsScreen');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'ODDetailsScreen' && styles.activeButtonText,
                              ]}>
                              OD Details
                            </Text>
                          </TouchableOpacity>

                          {/* OD Repayments */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'ODRepaymentsScreen' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('ODRepaymentsScreen');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'ODRepaymentsScreen' && styles.activeButtonText,
                              ]}>
                              OD Repayments
                            </Text>
                          </TouchableOpacity>

                          {/* Anchors List */}
                          <TouchableOpacity
                            style={[
                              styles.button,
                              currentRoute === 'AnchorsListScreen' && styles.activeButton,
                            ]}
                            onPress={() => {
                              navigation.navigate('AnchorsListScreen');
                              navigation.closeDrawer();
                            }}>
                            <Text
                              style={[
                                styles.buttonText,
                                currentRoute === 'AnchorsListScreen' && styles.activeButtonText,
                              ]}>
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
  },
  image: {
    height: scaleHeight(46),
    width: scaleWidth(46),
    borderRadius: scaleWidth(23),
  },
  infoContainer: {
    marginStart: scaleWidth(16),
    flex: 1,
    marginEnd: scaleWidth(8),
    alignItems: 'flex-start',
  },
  title: {
    fontSize: scaleFont(18),
    fontFamily: 'Gilroy-SemiBold',
    color: Colors.primaryColor,
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
  parentMenuText: {
    color: '#E30613',
    fontFamily: Fonts.GilroySemiBold,
  },
  logOut: {
    marginHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(64),
  },
});
