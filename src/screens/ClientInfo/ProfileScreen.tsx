import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {AppBar, Container} from '@components/index';
import {LeftChevron, UpChevron} from '@assets/Icons';
import Colors from '@constants/Colors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {ClientScreens} from '@constants/Screens';
import {UserImg} from '@assets/Images';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector} from '@store/client';
import moment from 'moment';
import {formatIndianNumber} from '@utils/Utils';
import {UserResponse} from './ClientInfo.type';

type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, ClientScreens.ProfileScreen>,
  DrawerScreenProps<HomeNavigatorType>
>;

export const ProfileScreen: React.FC<NavigationType> = ({
  navigation,
  route,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const dispatch = useDispatch();
  const loader = useSelector(clientSelector.getClientLoader);
  const basicDetails = useSelector(clientSelector.getBasicDetailFormData);
  const clientDetails = useSelector(clientSelector.getClientDetailsFormData);
  const firmDetails = useSelector(clientSelector.getFirmDetailsFormData);
  const venderDetails = useSelector(clientSelector.getVendorDetailsFormData);
  const visitDetails = useSelector(clientSelector.getVisitDetailsFormData);

  useEffect(() => {
<<<<<<< HEAD
    dispatch(clientActions.resetAllClientFormData());
=======
>>>>>>> 4572029 (Add Api and saga for client details)
    if (route.params?.clientId) {
      const id = route.params.clientId;
      dispatch(clientActions.getClientBasicDetails(id));
      dispatch(clientActions.getClientsDetails(id));
      dispatch(clientActions.getFirmDetails(id));
      dispatch(clientActions.getVendorDetails(id));
      dispatch(clientActions.getVisitDetails(id));
    }
<<<<<<< HEAD
  }, [dispatch, route.params?.clientId]);
=======
  }, [dispatch]);
>>>>>>> 4572029 (Add Api and saga for client details)

  const toggleSection = (key: string) => {
    setExpanded(expanded === key ? null : key);
  };

<<<<<<< HEAD
  const t = (value: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value.trim() || '-';
    if (typeof value === 'number')
      return Number.isFinite(value) ? String(value) : '-';
    return String(value);
  };
=======
  const t = (value: string | null | undefined) =>
    value && value.trim() !== '' ? value : '-';
>>>>>>> 4572029 (Add Api and saga for client details)

  return (
    <Container>
      <AppBar
        title="Client Details"
        onPressLeftIcon={() => navigation.goBack()}
<<<<<<< HEAD
        leftIconProps={{hitSlop: {top: 8, right: 8, bottom: 8, left: 8}}}
=======
>>>>>>> 4572029 (Add Api and saga for client details)
        renderLeftIcon={
          <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
        }
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Image Circle */}
        <View style={[styles.sectionContainer, styles.imageContainer]}>
          <View style={styles.imageCircle}>
            <Image source={UserImg} style={styles.userImage} />
          </View>
<<<<<<< HEAD
          <Text style={styles.profileName}>{t(basicDetails.firmName)}</Text>
=======
          <Text style={styles.profileName}>John Doe</Text>
>>>>>>> 4572029 (Add Api and saga for client details)
          <Text style={styles.profileId}>
            ID: {route.params?.clientId ?? '-'}
          </Text>
        </View>

        {/* Basic Details Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('basic')}
            activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>1. Basic Details</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleSection('basic')}
                activeOpacity={0.7}>
                {expanded === 'basic' ? (
                  <UpChevron height={16} width={16} />
                ) : (
                  <View style={styles.rotatedChevron}>
                    <UpChevron height={16} width={16} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {expanded === 'basic' && (
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source of Lead</Text>
                <Text style={styles.detailValue}>
                  {t(basicDetails.sourceOfLead)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Firm Name</Text>
                <Text style={styles.detailValue}>
                  {t(basicDetails.firmName)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Program Type</Text>
                <Text style={styles.detailValue}>
                  {t(basicDetails.programType)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product Type</Text>
                <Text style={styles.detailValue}>
                  {t(basicDetails.productType)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>State</Text>
                <Text style={styles.detailValue}>{t(basicDetails.state)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City</Text>
                <Text style={styles.detailValue}>{t(basicDetails.city)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {t(basicDetails.location)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>
                  {t(basicDetails.address)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Visit</Text>
                <Text style={styles.detailValue}>
<<<<<<< HEAD
                  {basicDetails.dateOfVisit
                    ? moment(basicDetails.dateOfVisit).format('DD/MM/YYYY')
                    : '-'}
=======
                  {t(moment(basicDetails.dateOfVisit).format('DD/MM/YYYY'))}
>>>>>>> 4572029 (Add Api and saga for client details)
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Filed by</Text>
                <Text style={styles.detailValue}>
                  {t(basicDetails.filedBy)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Client Details Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('client')}
            activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>2. Client Details</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleSection('client')}
                activeOpacity={0.7}>
                {expanded === 'client' ? (
                  <UpChevron height={16} width={16} />
                ) : (
                  <View style={styles.rotatedChevron}>
                    <UpChevron height={16} width={16} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {expanded === 'client' &&
            clientDetails.map((client, index) => (
              <View
                key={index}
                style={[
                  styles.sectionContent,
                  index !== clientDetails.length - 1 && styles.bottomBorder,
                ]}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name of Client</Text>
                  <Text style={styles.detailValue}>{client.nameOfClient}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{client.clientType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact Number</Text>
                  <Text style={styles.detailValue}>{client.contactNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{client.email}</Text>
                </View>
              </View>
            ))}
        </View>

        {/* Firm Details Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('firm')}
            activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>3. Firm Details</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleSection('firm')}
                activeOpacity={0.7}>
                {expanded === 'firm' ? (
                  <UpChevron height={16} width={16} />
                ) : (
                  <View style={styles.rotatedChevron}>
                    <UpChevron height={16} width={16} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {expanded === 'firm' && (
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type of Firm</Text>
                <Text style={styles.detailValue}>
                  {t(firmDetails.firmType)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Business Vintage (In years)
                </Text>
                <Text style={styles.detailValue}>
                  {t(firmDetails.businessVintage)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sector</Text>
                <Text style={styles.detailValue}>{t(firmDetails.sector)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>
                  {t(firmDetails.bankName)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Monthly Turnover (Rs. Lacs)
                </Text>
                <Text style={styles.detailValue}>
                  {formatIndianNumber(t(firmDetails.monthlyTurnover))}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CIBIL Score</Text>
                <Text style={styles.detailValue}>
                  {t(firmDetails.cibilScore)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Facility Type</Text>
                <Text style={styles.detailValue}>
                  {t(firmDetails.facilityType)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Existing Funding Sanctioned Amt
                </Text>
                <Text style={styles.detailValue}>
                  {formatIndianNumber(
                    t(firmDetails.existingFundingSanctionedAmount),
                  )}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Estimated Funding Required
                </Text>
                <Text style={styles.detailValue}>
                  {formatIndianNumber(t(firmDetails.estimatedFundingRequired))}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Credit Period Offer (In Days)
                </Text>
                <Text style={styles.detailValue}>
                  {t(firmDetails.creditPeriodOffer)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Vendor Details Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('vendor')}
            activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>4. Vendor Details</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleSection('vendor')}
                activeOpacity={0.7}>
                {expanded === 'vendor' ? (
                  <UpChevron height={16} width={16} />
                ) : (
                  <View style={styles.rotatedChevron}>
                    <UpChevron height={16} width={16} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {expanded === 'vendor' &&
            venderDetails.map((vendor, index) => (
              <View
                style={[
                  styles.sectionContent,
                  index !== venderDetails.length - 1 && styles.bottomBorder,
                ]}
                key={index}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Product Category</Text>
                  <Text style={styles.detailValue}>
                    {t(vendor.productCategory)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Product Type</Text>
                  <Text style={styles.detailValue}>
                    {t(vendor.productType)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vendor Name</Text>
                  <Text style={styles.detailValue}>{t(vendor.vendorName)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{t(vendor.address)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State</Text>
                  <Text style={styles.detailValue}>{t(vendor.state)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City</Text>
                  <Text style={styles.detailValue}>{t(vendor.city)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode</Text>
                  <Text style={styles.detailValue}>{t(vendor.pinCode)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vendor Contact number</Text>
                  <Text style={styles.detailValue}>
                    {t(vendor.vendorContactNumber)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Monthly Sales Value</Text>
                  <Text style={styles.detailValue}>
                    {formatIndianNumber(t(vendor.monthlySalesValue))}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* Visit Details Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('visit')}
            activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>5. Visit Details</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleSection('visit')}
                activeOpacity={0.7}>
                {expanded === 'visit' ? (
                  <UpChevron height={16} width={16} />
                ) : (
                  <View style={styles.rotatedChevron}>
                    <UpChevron height={16} width={16} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {expanded === 'visit' && (
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User Response</Text>
                <Text style={styles.detailValue}>
                  {t(visitDetails.userResponse)}
                </Text>
              </View>
              {visitDetails.userResponse === UserResponse.INTERESTED && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Intent</Text>
                    <Text style={styles.detailValue}>
                      {t(visitDetails.intent)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date of Next Visit</Text>
                    <Text style={styles.detailValue}>
<<<<<<< HEAD
                      {visitDetails.dateOfNextVisit
                        ? moment(visitDetails.dateOfNextVisit).format(
                            'DD/MM/YYYY',
                          )
                        : '-'}
=======
                      {moment(visitDetails.dateOfNextVisit).format(
                        'DD/MM/YYYY',
                      )}
>>>>>>> 4572029 (Add Api and saga for client details)
                    </Text>
                  </View>
                </>
              )}

              {visitDetails.userResponse === UserResponse.NOT_INTERESTED && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Reason for Not Interested
                    </Text>
                    <Text style={styles.detailValue}>
                      {t(visitDetails.reasonForNotInterested)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Are you interested for?
                    </Text>
                    <Text style={styles.detailValue}>
                      {t(visitDetails.interestedFor)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <Modal transparent visible={loader}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.LimeGray,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(24),
  },
  imageCircle: {
    width: scaleWidth(96),
    height: scaleWidth(96),
    borderRadius: scaleWidth(48),
    backgroundColor: Colors.lightPink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primaryColor,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userImage: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    borderRadius: scaleWidth(40),
  },
  profileName: {
    marginTop: scaleHeight(8),
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
  },
  profileId: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    color: Colors.graybase,
  },
  sectionContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: scaleWidth(16),
    marginTop: scaleHeight(16),
    borderRadius: 8,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.015,
    shadowRadius: 1,
    elevation: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.LimeGray,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  expandButton: {
    padding: scaleWidth(4),
  },
  rotatedChevron: {
    transform: [{rotate: '180deg'}],
  },
  sectionContent: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.LimeGray,
    gap: scaleWidth(8),
  },
  detailLabel: {
    fontSize: scaleFont(14),
    fontWeight: FontWeight.Medium,
    color: Colors.graybase,
    flexShrink: 0,
    flexBasis: '40%',
  },
  detailValue: {
    fontSize: scaleFont(14),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.LimeGray,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
