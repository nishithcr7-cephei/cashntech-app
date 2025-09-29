/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState, useMemo} from 'react';
import {AppBar, Container, KycDocumentCard, FilterModal} from '@components/index';
import {Filter, Search} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {useDispatch, useSelector} from 'react-redux';
import {kycActions, kycSelector} from '@store/kyc';
import FontWeight from '@constants/FontWeight';
import {decryptUtility} from '@utils/crypto';
import kycApi from '@services/api/kyc.api';
import {downloadFile, showDownloadSuccessAlert, showDownloadErrorAlert} from '@utils/downloadUtils';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const KycDocument = () => {
  const navigation = useNavigation<KycNavigationType>();

  const dispatch = useDispatch();
  const KycData = useSelector(kycSelector.getKycDetailsData);
  const KycLoading = useSelector(kycSelector.getKycDetailsLoading);

  const callGetKYC = () => {
    dispatch(kycActions.getKycDetailsRequest({
      byIntent: {
        intent: ["High", "Medium"]
      }
    }));
  };
  useEffect(() => {
    callGetKYC();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [initiatorOptions, setInitiatorOptions] = useState<string[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [downloadingClientId, setDownloadingClientId] = useState<string | null>(null);

  // Prepare filter data
  const filterData = {
    'City': cityOptions,
    'Initiator': initiatorOptions,
    'Source': sourceOptions,
    'Sector': sectorOptions,
    'Month/Year': [], // Will be handled specially
  };

  // Build filter options from KYC data
  useEffect(() => {
    if (KycData && Array.isArray(KycData) && KycData.length > 0) {
      const cities = new Set<string>();
      const initiators = new Set<string>();
      const sources = new Set<string>();
      const sectors = new Set<string>();
      
      KycData.forEach((item: any) => {
        // Add cities
        const city = decryptUtility(item.city || '');
        if (city) cities.add(city);
        
        // Add initiators (file_by field)
        if (item.file_by) initiators.add(item.file_by);
        
        // Add sources
        if (item.source_of_lead) sources.add(item.source_of_lead);
        
        // Add sectors
        if (item.sector) sectors.add(item.sector);
      });
      
      setCityOptions(Array.from(cities));
      setInitiatorOptions(Array.from(initiators));
      setSourceOptions(Array.from(sources));
      setSectorOptions(Array.from(sectors));
    }
  }, [KycData]);
  
  // Decrypt and filter KYC data
  const filteredKYC = useMemo(() => {
    // Ensure KycData is an array
    const safeKycData = Array.isArray(KycData) ? KycData : [];
    
    let filtered = safeKycData;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.trim().toLowerCase();
      
      filtered = filtered.filter(item => {
        const decryptedFirmName = decryptUtility(item.firm_name || '');
        const decryptedCity = decryptUtility(item.city || '');
        const decryptedBankName = item.bank_name ? decryptUtility(item.bank_name) : '';
        
        return (
          item.clientId?.toString().toLowerCase().includes(lowerCaseQuery) ||
          decryptedFirmName.toLowerCase().includes(lowerCaseQuery) ||
          decryptedCity.toLowerCase().includes(lowerCaseQuery) ||
          item.source_of_lead?.toLowerCase().includes(lowerCaseQuery) ||
          item.monthly_turnover?.toString().toLowerCase().includes(lowerCaseQuery) ||
          item.sector?.toLowerCase().includes(lowerCaseQuery) ||
          item.intent?.toLowerCase().includes(lowerCaseQuery) ||
          item.file_by?.toLowerCase().includes(lowerCaseQuery)
        );
      });
    }
    
    // Apply other filters
    if (appliedFilters['City'] && appliedFilters['City'].length > 0) {
      filtered = filtered.filter(item => {
        const city = decryptUtility(item.city || '');
        return appliedFilters['City'].includes(city);
      });
    }
    
    if (appliedFilters['Initiator'] && appliedFilters['Initiator'].length > 0) {
      filtered = filtered.filter(item => {
        const initiator = item.file_by || '';
        return appliedFilters['Initiator'].includes(initiator);
      });
    }
    
    if (appliedFilters['Source'] && appliedFilters['Source'].length > 0) {
      filtered = filtered.filter(item => {
        const source = item.source_of_lead || '';
        return appliedFilters['Source'].includes(source);
      });
    }
    
    if (appliedFilters['Sector'] && appliedFilters['Sector'].length > 0) {
      filtered = filtered.filter(item => {
        const sector = item.sector || '';
        return appliedFilters['Sector'].includes(sector);
      });
    }
    
    if (appliedFilters['Month/Year'] && appliedFilters['Month/Year'].length > 0) {
      filtered = filtered.filter(item => {
        const createdAt = item.created_at;
        if (!createdAt) return false;
        
        const itemDate = new Date(createdAt);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1; // getMonth() returns 0-11
        
        return appliedFilters['Month/Year'].some((monthYear: string) => {
          // monthYear format: "2025-08" (year-month)
          const [year, month] = monthYear.split('-').map(Number);
          return itemYear === year && itemMonth === month;
        });
      });
    }
    
    return filtered;
  }, [KycData, searchQuery, appliedFilters]);

  const handleDownload = async (clientId: string) => {
    try {
      setDownloadingClientId(clientId);
      
      // Call the API to get the zip file
      const {data: blobData, error} = await kycApi.downloadKycDocuments(clientId);
      
      if (error || !blobData) {
        showDownloadErrorAlert(error?.message || 'Failed to download documents');
        return;
      }
      
      // Download the file to device
      const result = await downloadFile(blobData, `KYC_Documents_${clientId}.zip`, clientId);
      
      if (result.success && result.filePath) {
        showDownloadSuccessAlert(result.filePath);
      } else {
        showDownloadErrorAlert(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      showDownloadErrorAlert(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloadingClientId(null);
    }
  };

  return (
    <Container>
      <AppBar title="KYC Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Select Lead for KYC</Text>
      </View>
      <View style={styles.RowContainer}>
        <View style={styles.subRowContainer}>
          <Text style={styles.subRowContainerTxt}>Leads</Text>
          <View style={styles.Badge}>
            <Text style={styles.badgeText}>{filteredKYC.length}</Text>
          </View>
        </View>
        <View style={styles.Searchbox}>
          <Search height={12} width={12} />
          <TextInput
            style={styles.input}
            placeholder="Search By Firm Name"
            placeholderTextColor={Colors.balancedGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <View style={styles.filterBox}>
            <Filter height={12} width={12} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        filterData={filterData}
      />

      <View style={styles.cardList}>
        <FlatList
          data={filteredKYC}
          refreshing={KycLoading}
          onRefresh={callGetKYC}
          contentContainerStyle={{paddingBottom: scaleHeight(56)}}
          ListEmptyComponent={
            <Text style={styles.emptyList}>
              {KycLoading ? 'Loading KYC data...' : 'No KYC data Found'}
            </Text>
          }
          renderItem={({item, index}) => (
            <KycDocumentCard
              data={item}
              index={index}
              onPress={() =>
                navigation.navigate('KYCFormSelection', {
                  clientID: item.clientId,
                })
              }
              onDownload={() => handleDownload(item.clientId.toString())}
              isDownloading={downloadingClientId === item.clientId.toString()}
            />
          )}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  Subcontainer: {
    backgroundColor: '#fff',
  },
  emptyList: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    color: Colors.SteelGray,
    textAlign: 'center',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  RowContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  subRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subRowContainerTxt: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.darkblack,
  },
  Badge: {
    backgroundColor: Colors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: Colors.SteelGray,
  },
  Searchbox: {
    flex: 1,
    flexDirection: 'row',
    height: scaleHeight(29),
    marginLeft: 5,
    marginTop: 2,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderWidth: 1,
    borderRadius: 3,
    gap: 16,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(14),
    includeFontPadding: false,
    paddingVertical: 0,
  },
  filterBox: {
    width: scaleWidth(32),
    height: scaleHeight(30),
    backgroundColor: Colors.primaryColor,
    marginLeft: scaleWidth(8),
    padding: 10,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardList: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 10,
  },
});