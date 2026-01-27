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
import {Colors, Fonts} from '@constants/index';
import {useDispatch, useSelector} from 'react-redux';
import {Alert} from 'react-native';
import {userSelector} from '@store/user';
import {logoutUser} from '@services/api/api';
import Toast from 'react-native-toast-message';

export const DrawerContent = ({navigation}: DrawerContentComponentProps) => {
  const [isTransactionsOpen, setIsTransactionsOpen] = React.useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = React.useState(false);
  const {top, bottom} = useSafeAreaInsets();
  const userInfo = useSelector(userSelector.getUserInfo);
  
  // Get current route name for highlighting active menu item
  const currentRoute = useNavigationState(state => {
    if (state) {
      const route = state.routes[state.index];
      if (route.state) {
        // Handle nested navigators
        const nestedState = route.state;
        const nestedRoute = nestedState.routes[nestedState.index];
        return nestedRoute.name;
      }
      return route.name;
    }
    return null;
  });

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
      currentRoute === 'CreditAccountDailyInterest';

    if (isTransactionRoute) {
      setIsTransactionsOpen(true);
    }

    // Check if current route is under Invoice
    const isInvoiceRoute = 
      currentRoute === 'InvoiceDashboard' ||
      currentRoute === 'InvoiceDetails' ||
      currentRoute === 'CreateInvoice' ||
      currentRoute === 'UploadInvoiceList' ||
      currentRoute === 'PendingApprovals' ||
      currentRoute === 'RejectedFinances' ||
      currentRoute === 'DiscountingPayments' ||
      currentRoute === 'DPDInvoiceList';

    if (isInvoiceRoute) {
      setIsInvoiceOpen(true);
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
        <View style={styles.headerContainer}>
          <View style={styles.rowCenter}>
            <Image source={UserImg} style={styles.image} resizeMode="contain" />
            <View style={styles.infoContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {userInfo.email || 'test@gmail.com'}
              </Text>
              <Text style={styles.subTitle} numberOfLines={2}>
                {userInfo.mobile_number || '9814756321'}
              </Text>
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
              {/* TRANSACTIONS Root Menu */}
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
                  {/* Invoice Submenu */}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      isInvoiceOpen && styles.parentMenuButton,
                    ]}
                    onPress={() => {
                      setIsInvoiceOpen(!isInvoiceOpen);
                    }}>
                    <View style={styles.rowCenter}>
                      <Text
                        style={[
                          isInvoiceOpen ? styles.parentMenuText : styles.buttonText,
                        ]}>
                        Invoice
                      </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <UpChevron rotation={isInvoiceOpen ? 0 : 180} />
                    </View>
                  </TouchableOpacity>

                  {isInvoiceOpen && (
                    <View style={{marginLeft: scaleWidth(24)}}>
                      {/* Invoice Dashboard */}
                      <TouchableOpacity
                        style={[
                          styles.button,
                          currentRoute === 'InvoiceDashboard' && styles.activeButton,
                        ]}
                        onPress={() => {
                          navigation.navigate('InvoiceDashboard');
                          navigation.closeDrawer();
                        }}>
                        <Text
                          style={[
                            styles.buttonText,
                            currentRoute === 'InvoiceDashboard' && styles.activeButtonText,
                          ]}>
                          Invoice Dashboard
                        </Text>
                      </TouchableOpacity>

                      {/* Invoice Details */}
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
                          Invoice Details
                        </Text>
                      </TouchableOpacity>

                      {/* Pending Approvals */}
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

                      {/* Rejected Finance */}
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

                      {/* Discounting Invoices */}
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
                    </View>
                  )}

                  {/* Payments Submenu */}
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
