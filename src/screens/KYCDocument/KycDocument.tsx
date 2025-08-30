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
import {AppBar, Container, FilterDropdown, KycCard} from '@components/index';
import {Filter, Search} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {useDispatch, useSelector} from 'react-redux';
import {clientActions, clientSelector} from '@store/client';
import FontWeight from '@constants/FontWeight';

const KycData = [
  {
    clientId: '0001',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Complete',
  },
  {
    clientId: '0002',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Pending',
  },
  {
    clientId: '0003',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Complete',
  },
  {
    clientId: '0004',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    eligibiltyAmount: '25,00,000',
    intent: 'High',
    status: 'Pending',
  },
] as const;

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const KycDocument = () => {
  const navigation = useNavigation<KycNavigationType>();

  const dispatch = useDispatch();
  const KycData = useSelector(clientSelector.getClientList);

  const callGetKYC = () => {
    dispatch(clientActions.getClients());
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
  const filteredKYC = KycData.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.id?.toString().toLowerCase().includes(query) ||
      item.client_name?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query) ||
      item.source_of_lead?.toLowerCase().includes(query) ||
      item.reference_details?.toLowerCase().includes(query) ||
      item.monthly_turnover?.toLowerCase().includes(query) ||
      item.eligibiltyamount?.toString().includes(query) ||
      item.intent?.toLowerCase().includes(query)
    );
  });

  return (
    <Container>
      <AppBar title="Kyc Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Kyc Document</Text>
      </View>
      <View style={styles.RowContainer}>
        <View style={styles.Subrowcontainer}>
          <Text style={styles.Subrowcontainertxt}>Leads</Text>
          <View style={styles.Badge}>
            <Text style={styles.Badgetext}>{KycData.length}</Text>
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
          <View style={styles.Filterbox}>
            <Filter height={12} width={12} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.Cardlist}>
        <FlatList
          data={filteredKYC}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('KYCFormSelection', {clientID: item.id})
              }>
              <KycCard data={item} />
            </TouchableOpacity>
          )}
          refreshing={false}
          onRefresh={callGetKYC}
          ListEmptyComponent={
            <Text style={styles.emptyList}>No Kyc data Found</Text>
          }
          contentContainerStyle={{flexGrow: 1}}
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
    fontWeight: fontWeight.SemiBold,
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
  Subrowcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  Subrowcontainertxt: {
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
  Badgetext: {
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
    fontSize: scaleFont(12),
  },
  Filterbox: {
    width: scaleWidth(32),
    height: scaleHeight(30),
    backgroundColor: Colors.primaryColor,
    marginLeft: scaleWidth(8),
    padding: 10,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Cardlist: {
    flex: 1,
    padding: 16,
  },
});
