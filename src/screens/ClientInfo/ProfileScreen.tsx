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
import {AppBar, Container, TabBar, TabItem} from '@components/index';
import {LeftChevron, UpChevron} from '@assets/Icons';
import Colors from '@constants/Colors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {ClientScreens} from '@constants/Screens';
import {UserImg} from '@assets/Images';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector} from '@store/client';
import {getClientProfile, getSoftSanctionDetails, getKycDocuments, profileSelector} from '@store/profile';
import moment from 'moment';
import {formatIndianNumber} from '@utils/Utils';
import {UserResponse} from './ClientInfo.type';
import {FILE_DOWNLOAD_URL} from '@config/config';
import {Linking, Alert, Platform, PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';

type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, ClientScreens.ProfileScreen>,
  DrawerScreenProps<HomeNavigatorType>
>;

export const ProfileScreen: React.FC<NavigationType> = ({
  navigation,
  route,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [profileImageError, setProfileImageError] = useState<boolean>(false);
  const dispatch = useDispatch();
  const loader = useSelector(clientSelector.getClientLoader);
  const basicDetails = useSelector(clientSelector.getBasicDetailFormData);
  const clientDetails = useSelector(clientSelector.getClientDetailsFormData);
  const firmDetails = useSelector(clientSelector.getFirmDetailsFormData);
  const venderDetails = useSelector(clientSelector.getVendorDetailsFormData);
  const visitDetails = useSelector(clientSelector.getVisitDetailsFormData);
  const clientProfile = useSelector(profileSelector.getClientProfile);
  const clientProfileLoading = useSelector(profileSelector.getClientProfileLoading);
  const clientProfileError = useSelector(profileSelector.getClientProfileError);
  const softSanctionData = useSelector(profileSelector.getSoftSanctionData);
  const softSanctionLoading = useSelector(profileSelector.getSoftSanctionLoading);
  const softSanctionError = useSelector(profileSelector.getSoftSanctionError);
  const kycDocumentsData = useSelector(profileSelector.getKycDocumentsData);
  const kycDocumentsLoading = useSelector(profileSelector.getKycDocumentsLoading);
  const kycDocumentsError = useSelector(profileSelector.getKycDocumentsError);

  

  useEffect(() => {
    dispatch(clientActions.resetAllClientFormData());
    // Reset profile image error state when client changes
    setProfileImageError(false);
    if (route.params?.clientId) {
      const id = route.params.clientId;
      dispatch(clientActions.getClientBasicDetails(id));
      dispatch(clientActions.getClientsDetails(id));
      dispatch(clientActions.getFirmDetails(id));
      dispatch(clientActions.getVendorDetails(id));
      dispatch(clientActions.getVisitDetails(id));
      dispatch(getClientProfile(id));
      dispatch(getSoftSanctionDetails(id));
      dispatch(getKycDocuments(id));
    }
  }, [dispatch, route.params?.clientId]);

  const toggleSection = (key: string) => {
    setExpanded(expanded === key ? null : key);
  };

  const tabs: TabItem[] = [
    {id: 'personal', label: 'Personal'},
    {id: 'softSanction', label: 'Soft Sanction'},
    {id: 'kyc', label: 'KYC'},
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleFileDownload = async (downloadUrl: string, fileName: string) => {
    try {
      // Request storage permission for Android
      if (Platform.OS === 'android') {
        // For Android 13+ (API 33+), we don't need WRITE_EXTERNAL_STORAGE
        // For older versions, we still need it
        const androidVersion = Platform.Version;
        let permission = null;
        
        if (androidVersion < 33) {
          // For Android 12 and below, request WRITE_EXTERNAL_STORAGE
          permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
        }
        
        if (permission) {
          const granted = await PermissionsAndroid.request(permission, {
            title: 'Storage Permission',
            message: 'App needs access to storage to download files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          });
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Storage permission is required to download files');
            return;
          }
        }
      }
      
      // Create download path - try Downloads folder first, fallback to app directory
      let downloadPath;
      try {
        // Try to use Downloads folder
        downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } catch (error) {
        // Fallback to app's document directory
        downloadPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }
      
      // Show download progress
      Alert.alert('Download Started', `Downloading ${fileName}...`);
      
      // Download the file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: downloadPath,
      }).promise;
      
      if (downloadResult.statusCode === 200) {
        const isDownloadsFolder = downloadPath.includes('Download');
        const locationMessage = isDownloadsFolder 
          ? 'your Downloads folder' 
          : 'your app\'s document folder';
          
        Alert.alert(
          'Download Complete',
          `${fileName} has been downloaded to ${locationMessage}`,
          [
            {text: 'OK'},
            {
              text: 'Open File',
              onPress: () => {
                // Try to open the downloaded file
                Linking.openURL(`file://${downloadPath}`).catch(() => {
                  Alert.alert('Error', 'Cannot open the downloaded file');
                });
              }
            }
          ]
        );
      } else {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      // Fallback: Try to open the URL in browser
      Alert.alert(
        'Download Failed',
        `Failed to download the file. Error: ${errorMessage}`,
        [
          {text: 'Cancel'},
          {
            text: 'Open in Browser',
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL(downloadUrl);
                if (canOpen) {
                  await Linking.openURL(downloadUrl);
                } else {
                  Alert.alert('Error', 'Cannot open the file in browser');
                }
              } catch (browserError) {
                Alert.alert('Error', 'Cannot open the file in browser');
              }
            }
          }
        ]
      );
    }
  };

  const t = (value: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value.trim() || '-';
    if (typeof value === 'number')
      return Number.isFinite(value) ? String(value) : '-';
    return String(value);
  };


  const renderPersonalContent = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentContainer}>
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
              <Text style={styles.detailLabel}>Pin Code</Text>
              <Text style={styles.detailValue}>
                {t(basicDetails.pincode)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {t(basicDetails.location)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>City</Text>
              <Text style={styles.detailValue}>{t(basicDetails.city)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>
                {t(basicDetails.address)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>State</Text>
              <Text style={styles.detailValue}>{t(basicDetails.state)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Filed by</Text>
              <Text style={styles.detailValue}>
                {t(basicDetails.filedBy)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Visit</Text>
              <Text style={styles.detailValue}>
                {basicDetails.dateOfVisit
                  ? moment(basicDetails.dateOfVisit).format('DD/MM/YYYY')
                  : '-'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Firm Name</Text>
              <Text style={styles.detailValue}>
                {t(basicDetails.firmName)}
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
                <Text style={styles.detailLabel}>Client Type</Text>
                <Text style={styles.detailValue}>{client.clientType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{client.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <Text style={styles.detailValue}>{client.contactNumber}</Text>
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
              <Text style={styles.detailLabel}>Annual Turnover</Text>
              <Text style={styles.detailValue}>
                {formatIndianNumber(t(firmDetails.annualTurnover))}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Firm Type</Text>
              <Text style={styles.detailValue}>
                {t(firmDetails.firmType)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Business Vintage</Text>
              <Text style={styles.detailValue}>
                {t(firmDetails.businessVintage)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Industry</Text>
              <Text style={styles.detailValue}>{t(firmDetails.industry)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sector</Text>
              <Text style={styles.detailValue}>{t(firmDetails.sector)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Name</Text>
              <Text style={styles.detailValue}>
                {Array.isArray(firmDetails.bankName) 
                  ? firmDetails.bankName.map(bank => t(bank)).join(', ')
                  : t(firmDetails.bankName)}
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
                {Array.isArray(firmDetails.facilityType) 
                  ? firmDetails.facilityType.map(type => t(type)).join(', ')
                  : t(firmDetails.facilityType)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Existing Funding Sanctioned Amount</Text>
              <Text style={styles.detailValue}>
                {formatIndianNumber(
                  t(firmDetails.existingFundingSanctionedAmount),
                )}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Funding Required</Text>
              <Text style={styles.detailValue}>
                {formatIndianNumber(t(firmDetails.estimatedFundingRequired))}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Credit Period Offer (In Days)</Text>
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
                <Text style={styles.detailLabel}>Vendor Address</Text>
                <Text style={styles.detailValue}>{t(vendor.address)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor City</Text>
                <Text style={styles.detailValue}>{t(vendor.city)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor State</Text>
                <Text style={styles.detailValue}>{t(vendor.state)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor Pin Code</Text>
                <Text style={styles.detailValue}>{t(vendor.pinCode)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor Contact Number</Text>
                <Text style={styles.detailValue}>
                  {t(vendor.vendorContactNumber)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor Contact Email</Text>
                <Text style={styles.detailValue}>
                  {t(vendor.vendorContactEmail)}
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

      {/* Feedback Details Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('visit')}
          activeOpacity={0.7}>
          <Text style={styles.sectionTitle}>5. Feedback Details</Text>
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
              <Text style={styles.detailLabel}>Client Response</Text>
              <Text style={styles.detailValue}>
                {t(visitDetails.userResponse)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Intent</Text>
              <Text style={styles.detailValue}>
                {t(visitDetails.intent)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Next Visit</Text>
              <Text style={styles.detailValue}>
                {visitDetails.dateOfNextVisit
                  ? moment(visitDetails.dateOfNextVisit).format(
                      'DD/MM/YYYY',
                    )
                  : '-'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason for Not Interested</Text>
              <Text style={styles.detailValue}>
                {t(visitDetails.reasonForNotInterested)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Are You Interested For</Text>
              <Text style={styles.detailValue}>
                {t(visitDetails.interestedFor)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderSoftSanctionContent = () => {
    if (softSanctionLoading) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.placeholderText}>Loading Soft Sanction Data...</Text>
        </View>
      );
    }

    if (softSanctionError) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Error: {softSanctionError}</Text>
        </View>
      );
    }

    if (!softSanctionData || !Array.isArray(softSanctionData) || softSanctionData.length === 0) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No Soft Sanction Data Available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentContainer}>
        {softSanctionData.map((item, index) => {
          // Create title based on method_name and specific result value
          let title = item.method_name;
          let value = '';
          
          if (item.method_name === 'Turnover' && item.results['Final Limit']) {
            value = formatIndianNumber(String(item.results['Final Limit']));
          } else if (item.method_name === 'WC(Stock)' && item.results['Working Capital Gap']) {
            value = formatIndianNumber(String(item.results['Working Capital Gap']));
          } else if (item.method_name === 'Purchase' && item.results['Final Limit']) {
            value = formatIndianNumber(String(item.results['Final Limit']));
          }
          
          const cardTitle = value ? `${title} - ${value}` : title;
          const sectionKey = `softSanction_${item.id}`;

          return (
            <View key={item.id} style={styles.sectionContainer}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(sectionKey)}
                activeOpacity={0.7}>
                <Text style={styles.sectionTitle}>{cardTitle}</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => toggleSection(sectionKey)}
                    activeOpacity={0.7}>
                    {expanded === sectionKey ? (
                      <UpChevron height={16} width={16} />
                    ) : (
                      <View style={styles.rotatedChevron}>
                        <UpChevron height={16} width={16} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {expanded === sectionKey && (
                <View style={styles.sectionContent}>
                  {Object.entries(item.results).map(([key, value]) => (
                    <View key={key} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{key}</Text>
                      <Text style={styles.detailValue}>
                        {typeof value === 'number' ? formatIndianNumber(String(value)) : String(value)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderKycContent = () => {
    // Base URL for file downloads - using dynamic client ID and environment variable
    const clientId = route.params?.clientId || '6';
    // Use fallback URL if environment variable is not set
    const downloadBaseUrl = FILE_DOWNLOAD_URL || 'https://d2wayd1he5a7q1.cloudfront.net';
    const baseUrl = `${downloadBaseUrl}/KYC/client_${clientId}/`;
    
    if (kycDocumentsLoading) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.placeholderText}>Loading KYC Documents...</Text>
        </View>
      );
    }

    if (kycDocumentsError) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Error: {kycDocumentsError}</Text>
        </View>
      );
    }

    if (!kycDocumentsData) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No KYC Documents Available</Text>
        </View>
      );
    }

    // Process the API data into sections
    const kycSections = [];

    // Personal KYC Section
    if (kycDocumentsData.personalKyc && kycDocumentsData.personalKyc.length > 0) {
      const personalDocuments = kycDocumentsData.personalKyc.map(doc => {
        let name = '';
        let fileType = '';
        let fileName = '';
        
        if (doc.document_type === 'profile' && doc.filename_obj.profile) {
          name = 'Profile Photo';
          fileName = doc.filename_obj.profile.file_name;
          fileType = fileName.split('.').pop()?.toUpperCase() || 'PNG';
        } else if (doc.document_type === 'pan' && doc.filename_obj.pan) {
          name = 'PAN Card';
          fileName = doc.filename_obj.pan.file_name;
          fileType = fileName.split('.').pop()?.toUpperCase() || 'PNG';
        }
        
        const downloadUrl = `${baseUrl}${fileName}`;
        
        return {
          id: doc.id,
          name,
          type: fileType,
          date: moment(doc.uploaded_at).format('DD-MM-YYYY'),
          isVerified: true,
          fileName,
          downloadUrl,
        };
      }).filter(doc => doc.name); // Filter out empty documents

      if (personalDocuments.length > 0) {
        kycSections.push({
          title: 'Personal KYC',
          documents: personalDocuments,
        });
      }
    }

    // Business Documents Section
    if (kycDocumentsData.business && kycDocumentsData.business.length > 0) {
      const businessDocuments = kycDocumentsData.business.map(doc => {
        let name = '';
        let fileName = '';
        
        if (doc.filename_obj.udhyam) {
          name = 'Udhyam Certificate';
          fileName = doc.filename_obj.udhyam.file_name;
        }
        
        const fileType = fileName.split('.').pop()?.toUpperCase() || 'PDF';
        
        return {
          id: doc.id,
          name,
          type: fileType,
          date: moment(doc.uploaded_at).format('DD-MM-YYYY'),
          isVerified: true,
          fileName,
          downloadUrl: `${baseUrl}${fileName}`,
        };
      }).filter(doc => doc.name);

      if (businessDocuments.length > 0) {
        kycSections.push({
          title: 'Business Documents',
          documents: businessDocuments,
        });
      }
    }

    // Bank Statements Section
    if (kycDocumentsData.bankStatement && kycDocumentsData.bankStatement.length > 0) {
      const bankDocuments = kycDocumentsData.bankStatement.flatMap(bank => 
        bank.statement_file_names.map((fileName, index) => ({
          id: `${bank.id}_${index}`,
          name: `Bank Statements - ${bank.bank_name}`,
          type: 'PDF',
          date: moment(bank.uploaded_at).format('DD-MM-YYYY'),
          isVerified: true,
          fileName,
          downloadUrl: `${baseUrl}${fileName}`,
        }))
      );

      if (bankDocuments.length > 0) {
        kycSections.push({
          title: 'Bank Statements',
          documents: bankDocuments,
        });
      }
    }

    if (kycSections.length === 0) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No data in KYC Documents</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentContainer}>
        {kycSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.kycSection}>
            <Text style={styles.kycSectionTitle}>{section.title}</Text>
            <View style={styles.kycDocumentsGrid}>
              {section.documents.map((document, docIndex) => (
                <TouchableOpacity 
                  key={document.id} 
                  style={styles.kycDocumentCard}
                  onPress={() => handleFileDownload(document.downloadUrl, document.fileName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.kycDocumentHeader}>
                    {document.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedCheckmark}>✓</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.kycDocumentIcon}>
                    <View style={[
                      styles.fileTypeIcon,
                      { backgroundColor: document.type === 'JPG' || document.type === 'PNG' ? Colors.tertiaryBlue : Colors.red }
                    ]}>
                      <Text style={styles.fileTypeText}>{document.type}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.kycDocumentName}>{document.name}</Text>
                  <Text style={styles.kycDocumentDate}>{document.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalContent();
      case 'softSanction':
        return renderSoftSanctionContent();
      case 'kyc':
        return renderKycContent();
      default:
        return renderPersonalContent();
    }
  };

  return (
    <Container>
      <AppBar
        title="Client Details"
        onPressLeftIcon={() => navigation.goBack()}
        leftIconContainerStyle={{padding: scaleWidth(4)}}
        renderLeftIcon={
          <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
        }
      />
      
      {/* Profile Header - Keep exactly as-is */}
      <View style={[styles.sectionContainer, styles.imageContainer, styles.profileHeaderContainer]}>
        <View style={styles.imageCircle}>
          {(() => {
            // Get profile image from API response
            let profileImage = null;
            
            // First try: clientProfile.personalKyc (processed data)
            if (clientProfile?.personalKyc) {
              profileImage = clientProfile.personalKyc.find(
                (doc: any) => doc.filename_obj?.profile?.file_name
              )?.filename_obj?.profile?.file_name;
            }
            
            // Second try: clientProfile.data.personalKyc (raw API response)
            const clientProfileAny = clientProfile as any;
            if (!profileImage && clientProfileAny?.data?.personalKyc) {
              profileImage = clientProfileAny.data.personalKyc.find(
                (doc: any) => doc.filename_obj?.profile?.file_name
              )?.filename_obj?.profile?.file_name;
            }
            
            if (profileImage && !profileImageError) {
              const clientId = route.params?.clientId || '6';
              // Get base URL from .env file, fallback to hardcoded URL if not available
              const baseUrl = (FILE_DOWNLOAD_URL && FILE_DOWNLOAD_URL.trim() !== '') 
                ? FILE_DOWNLOAD_URL 
                : 'https://d2wayd1he5a7q1.cloudfront.net';
              // Construct URL: baseUrl + /KYC/ + client_${id}/ + filename
              const profileImageUrl = `${baseUrl}/KYC/client_${clientId}/${profileImage}`;
              
              return (
                <Image 
                  source={{ uri: profileImageUrl }} 
                  style={styles.userImage}
                  onError={() => setProfileImageError(true)}
                  onLoad={() => setProfileImageError(false)}
                />
              );
            } else {
              // Fallback to default image
              return <Image source={UserImg} style={styles.userImage} />;
            }
          })()}
        </View>
        <Text style={styles.profileName}>{t(basicDetails.firmName)}</Text>
        <Text style={styles.profileId}>
          ID: {route.params?.clientId ?? '-'}
        </Text>
        <View style={styles.additionalInfoContainer}>
          <View style={styles.additionalInfoRow}>
            <Text style={styles.additionalInfoLabel}>Source of Lead:</Text>
            <Text style={styles.additionalInfoValue}>
              {clientProfile?.source_of_lead || basicDetails.sourceOfLead || (clientProfileError ? 'API Error' : '-')}
            </Text>
          </View>
          <View style={styles.additionalInfoRow}>
            <Text style={styles.additionalInfoLabel}>File By:</Text>
            <Text style={styles.additionalInfoValue}>
              {clientProfile?.file_by || basicDetails.filedBy || (clientProfileError ? 'API Error' : '-')}
            </Text>
          </View>
        </View>
      </View>

      {/* Custom Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Tab Content */}
      {renderTabContent()}
      <Modal transparent visible={loader || clientProfileLoading || softSanctionLoading || kycDocumentsLoading}>
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
  tabContent: {
    flex: 1,
    backgroundColor: Colors.LimeGray,
  },
  tabContentContainer: {
    paddingBottom: scaleHeight(100), // Add bottom padding for better scrolling
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.LimeGray,
    paddingHorizontal: scaleWidth(16),
  },
  placeholderText: {
    fontSize: scaleFont(18),
    fontWeight: FontWeight.Medium,
    color: Colors.graybase,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(24),
  },
  profileHeaderContainer: {
    marginBottom: scaleHeight(8), // Reduced bottom margin for less space above tab bar
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
  additionalInfoContainer: {
    marginTop: scaleHeight(16),
    width: '100%',
  },
  additionalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(4),
  },
  additionalInfoLabel: {
    fontSize: scaleFont(12),
    fontWeight: FontWeight.Medium,
    color: Colors.graybase,
    flexShrink: 0,
  },
  additionalInfoValue: {
    fontSize: scaleFont(12),
    fontWeight: FontWeight.SemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'right',
    marginLeft: scaleWidth(8),
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
  // KYC specific styles
  kycSection: {
    marginBottom: scaleHeight(24),
  },
  kycSectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: FontWeight.Bold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
  },
  kycDocumentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scaleWidth(16),
    gap: scaleWidth(12),
  },
  kycDocumentCard: {
    width: (scaleWidth(375) - scaleWidth(44)) / 2, // 2 cards per row with gaps
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.LimeGray,
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
    position: 'relative',
  },
  kycDocumentHeader: {
    position: 'absolute',
    top: scaleHeight(8),
    right: scaleWidth(8),
    zIndex: 1,
  },
  verifiedBadge: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckmark: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontWeight: FontWeight.Bold,
  },
  kycDocumentIcon: {
    alignItems: 'center',
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(12),
  },
  fileTypeIcon: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTypeText: {
    color: Colors.white,
    fontSize: scaleFont(12),
    fontWeight: FontWeight.Bold,
  },
  kycDocumentName: {
    fontSize: scaleFont(14),
    fontWeight: FontWeight.Medium,
    color: Colors.darkblack,
    textAlign: 'center',
    marginBottom: scaleHeight(8),
  },
  kycDocumentDate: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    textAlign: 'center',
  },
});
