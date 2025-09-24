/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {AppBar, Container, KycDocumentCard} from '@components/index';
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterField, setActiveFilterField] = useState<
    'Location' | 'Initiator' | 'Source' | null
  >(null);

  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    initiator: '',
    source: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // Decrypt and filter KYC data
  const filteredKYC = React.useMemo(() => {
    // Ensure KycData is an array
    const safeKycData = Array.isArray(KycData) ? KycData : [];
    
    if (!searchQuery.trim()) return safeKycData;
    
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    
    return safeKycData.filter(item => {
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
  }, [KycData, searchQuery]);

  return (
    <Container>
      <AppBar title="Kyc Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Kyc Document</Text>
      </View>
      <View style={styles.RowContainer}>
        <View style={styles.subRowContainer}>
          <Text style={styles.subRowContainerTxt}>Leads</Text>
          <View style={styles.Badge}>
            <Text style={styles.badgeText}>{Array.isArray(KycData) ? KycData.length : 0}</Text>
          </View>
        </View>
        <View style={styles.Searchbox}>
          <Search height={12} width={12} />
          <TextInput
            style={styles.input}
            placeholder="Search Leads"
            placeholderTextColor={Colors.balancedGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity>
          <View style={styles.filterBox}>
            <Filter height={12} width={12} />
          </View>
        </TouchableOpacity>
      </View>

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