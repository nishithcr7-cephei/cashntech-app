import {RightCheckmark, RightChevron} from '@assets/Icons';
import {
  AppBar,
  Container,
} from '@components/index';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import fontWeight from '@constants/FontWeight';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  kycActions,
  kycSelector,
} from '@store/kyc';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const KYCFormSelection = () => {
  const navigation = useNavigation<KycNavigationType>();
  const {params} = useRoute<RouteProp<KycNavigatorType, 'KYCFormSelection'>>();

  const dispatch = useDispatch();
  const kycChecked = useSelector(kycSelector.getKycChecked) || [];
  const KycBusinessChecked =
    useSelector(kycSelector.getBusinessChecked) || [];

  const checkedKyc = () => {
    if (params?.clientID != null) {
      dispatch(kycActions.getKycChecked(params.clientID.toString()));
    }
  };
  const CheckedBusinessKyc = () => {
    if (params?.clientID != null) {
      dispatch(kycActions.getKycBusinessChecked(params.clientID.toString()));
    }
  };
  useEffect(() => {
    checkedKyc();
  }, []);

  useEffect(() => {
    CheckedBusinessKyc();
  }, []);

  const personalDocs = [
    {label: 'Upload your Picture', key: 'profile'},
    {label: 'PAN Card Details', key: 'pan'},
    {label: 'Aadhar Card Details', key: 'aadhar'},
    {label: 'Residence Details', key: 'residence'},
  ];

  const businessDocs = [
    {label: 'Udhyam Certificate', key: 'udhyam'},
    {label: 'GST Documents', key: 'gst'},
    {label: 'Godown Details', key: 'godown'},
    {label: 'Company PAN Card Details', key: 'company_pan'},
    {label: 'Shareholding Details', key: 'shareholding'},
    {label: 'Company Information', key: 'company_docs'},
  ];

  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'bank'>(
    'personal',
  );
  const [refreshing, setRefreshing] = useState(false);

  // Call business KYC check when business tab is selected
  useEffect(() => {
    if (activeTab === 'business') {
      CheckedBusinessKyc();
    }
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both personal and business KYC status
      checkedKyc();
      CheckedBusinessKyc();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigation = (text: string) => {
    const navMap: {
      [key: string]:
        | 'KycUploadDoc'
        | 'KycUploadPan'
        | 'KycUploadAdhar'
        | 'ResidenceDetail';
    } = {
      'Upload your Picture': 'KycUploadDoc',
      'PAN Card Details': 'KycUploadPan',
      'Aadhar Card Details': 'KycUploadAdhar',
      'Residence Details': 'ResidenceDetail',
    };
    const screen = navMap[text];
    screen
      ? navigation.navigate(screen, {clientID: params.clientID})
      : null;
  };

  const handleNavigation2 = (text: string) => {
    const navMap: {
      [key: string]:
        | 'UdhyamCertificate'
        | 'GSTDocument'
        | 'GodownDetails'
        | 'CompanyPanCard'
        | 'ShareholdingCompany'
        | 'CompanyDocument';
    } = {
      'Udhyam Certificate': 'UdhyamCertificate',
      'GST Documents': 'GSTDocument',
      'Godown Details': 'GodownDetails',
      'Company PAN Card Details': 'CompanyPanCard',
      'Shareholding Details': 'ShareholdingCompany',
      'Company Information': 'CompanyDocument',
    };
    const screen = navMap[text];
    screen
      ? navigation.navigate(screen, {clientID: params.clientID})
      : null;
  };

  const renderList = (
    docs: {label: string; key: string}[],
    handler: (label: string) => void,
  ) =>
    docs.map(({label, key}, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.card,
          kycChecked.includes(key)
            ? {backgroundColor: Colors.frostedPlains}
            : {},
        ]}
        onPress={() => handler(label)}>
        <Text style={styles.cardText}>{label}</Text>
        {kycChecked.includes(key) ? (
          <RightCheckmark width={20} height={20} color="black" />
        ) : (
          <RightChevron width={20} height={17} />
        )}
      </TouchableOpacity>
    ));

  const renderlist = (
    docs: {label: string; key: string}[],
    handler: (label: string) => void,
  ) =>
    docs.map(({label, key}, index) => {
      const isUploaded = KycBusinessChecked.includes(key);
      
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.card,
            isUploaded
              ? {backgroundColor: '#E8F5E8'} // Light green background for uploaded documents
              : {},
          ]}
          onPress={() => handler(label)}>
          <Text style={styles.cardText}>{label}</Text>
          {isUploaded ? (
            <RightCheckmark width={20} height={20} color="black" />
          ) : (
            <RightChevron width={20} height={17} />
          )}
        </TouchableOpacity>
      );
    });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <View>
            <Text style={styles.heading}>
              Let's Verify and Upload Documents
            </Text>
            <Text style={styles.subHeading}>
              Please Submit the following documents to verify your profile
            </Text>
            {renderList(personalDocs, handleNavigation)}
          </View>
        );
      case 'business':
        return (
          <View>
            <Text style={styles.heading}>
              Let's Verify and Upload Documents
            </Text>
            <Text style={styles.subHeading}>
              Please Submit the following documents to verify your profile
            </Text>
            {renderlist(businessDocs, handleNavigation2)}
          </View>
        );
      case 'bank':
        return (
          <View>
            <Text style={styles.heading}>
              Bank Statement Upload
            </Text>
            <Text style={styles.subHeading}>
              Please upload your bank statements to verify your financial details
            </Text>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('BankStatementUpload', {clientID: params.clientID})}>
              <Text style={styles.cardText}>Bank Statement Upload</Text>
              <RightChevron width={20} height={17} />
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <Container>
      <AppBar title="Kyc Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Kyc Document</Text>
      </View>
      
      {/* Small Refresh Button */}
      <View style={styles.refreshContainer}>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabRow}>
          {['Personal KYC', 'Business KYC', 'Bank Statement'].map(
            (label, index) => {
              const key = label.toLowerCase().split(' ')[0] as
                | 'personal'
                | 'business'
                | 'bank';
              return (
                <TouchableOpacity
                  key={label}
                  style={styles.tab}
                  onPress={() => setActiveTab(key)}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === key && styles.activeTabText,
                    ]}>
                    {label}
                  </Text>
                  {activeTab === key && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            },
          )}
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  Subcontainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginHorizontal: 0,
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
    flex: 1,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: scaleFont(14),
    color: '#6B7280',
    fontWeight: fontWeight.Medium,
  },
  activeTabText: {
    color: '#DC2626',
    fontWeight: fontWeight.SemiBold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#DC2626',
    borderRadius: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginBottom: 12,
  },
  subheading: {
    fontSize: scaleFont(14),
  },
  subHeading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 18,
    color: '#888',
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  clearButton: {},
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    gap: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.green,
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  refreshContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  refreshButton: {
    backgroundColor: Colors.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: scaleFont(12),
    fontWeight: fontWeight.SemiBold,
  },
});