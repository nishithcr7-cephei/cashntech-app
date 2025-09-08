import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {AppBar, Container} from '@components/index';
import {UpChevron} from '@assets/Icons';
import Colors from '@constants/Colors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {ClientScreens} from '@constants/Screens';
import {UserImg} from '@assets/Images';

type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, ClientScreens.ProfileScreen>,
  DrawerScreenProps<HomeNavigatorType>
>;

export const ProfileScreen: React.FC<{
  navigation: NavigationType['navigation'];
}> = ({navigation}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggleSection = (key: string) => {
    setExpanded(expanded === key ? null : key);
  };

  return (
    <Container>
      <AppBar title="Profile" navigation={navigation} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Image Circle */}
        <View style={[styles.sectionContainer, styles.imageContainer]}>
          <View style={styles.imageCircle}>
            <Image source={UserImg} style={styles.userImage} />
          </View>
          <Text style={styles.profileName}>John Doe</Text>
          <Text style={styles.profileId}>ID: CL001</Text>
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
                <Text style={styles.detailValue}>Market Knowledge (D)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Firm Name</Text>
                <Text style={styles.detailValue}>ABC Corporation</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>State</Text>
                <Text style={styles.detailValue}>Maharashtra</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City</Text>
                <Text style={styles.detailValue}>Mumbai</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>Andheri East</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>12, XYZ Street</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Visit</Text>
                <Text style={styles.detailValue}>2025-08-29</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fill By</Text>
                <Text style={styles.detailValue}>John Doe</Text>
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

          {expanded === 'client' && (
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name of Client</Text>
                <Text style={styles.detailValue}>Jane Smith</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>Owner</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <Text style={styles.detailValue}>9876543210</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>jane.smith@example.com</Text>
              </View>
            </View>
          )}
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
                <Text style={styles.detailValue}>Private Ltd</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Business Vintage (In years)
                </Text>
                <Text style={styles.detailValue}>10</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sector</Text>
                <Text style={styles.detailValue}>FMCG</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>HDFC Bank</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Monthly Turnover (Rs. Lacs)
                </Text>
                <Text style={styles.detailValue}>120</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CIBIL Score</Text>
                <Text style={styles.detailValue}>750</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Facility Type</Text>
                <Text style={styles.detailValue}>
                  WCTL - Working Capital Term Loan
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Existing Funding Sanctioned Amt
                </Text>
                <Text style={styles.detailValue}>50</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Estimated Funding Required
                </Text>
                <Text style={styles.detailValue}>80</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Credit Period Offer (In Days)
                </Text>
                <Text style={styles.detailValue}>60</Text>
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

          {expanded === 'vendor' && (
            <View style={styles.sectionContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product Category</Text>
                <Text style={styles.detailValue}>Personal Care & Hygiene</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product Type</Text>
                <Text style={styles.detailValue}>Shampoo, conditioner</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor Name</Text>
                <Text style={styles.detailValue}>XYZ Distributors</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>123, Market Road</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>State</Text>
                <Text style={styles.detailValue}>Maharashtra</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City</Text>
                <Text style={styles.detailValue}>Mumbai</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pincode</Text>
                <Text style={styles.detailValue}>400093</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor Contact number</Text>
                <Text style={styles.detailValue}>9876543210</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly Sales Value</Text>
                <Text style={styles.detailValue}>25</Text>
              </View>
            </View>
          )}
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
                <Text style={styles.detailValue}>Interested</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Intent</Text>
                <Text style={styles.detailValue}>High</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Next Visit</Text>
                <Text style={styles.detailValue}>2025-09-15</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Reason for Not Interested
                </Text>
                <Text style={styles.detailValue}>N/A</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Are you interested for?</Text>
                <Text style={styles.detailValue}>Insurance</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
});
