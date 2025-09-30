import {Filter, Plus, Search} from '@assets/Icons';
import {AppBar, ClientCard, Container, FilterModal} from '@components/index';
import {ClientScreens, Colors, FontWeight} from '@constants/index';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {clientActions, clientSelector} from '@store/client';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {LeadSourceType, SectorType} from './ClientInfo.type';
import {userSelector, UserState} from '@store/user';
import {decryptLocation, decryptConditionally} from '@utils/crypto';
import ClientApis from '@services/api/client.api';

type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType, ClientScreens.ClientInfo>,
  DrawerScreenProps<HomeNavigatorType>
>;

export const ClientInfo: React.FC<NavigationType> = ({navigation}) => {
  const {first_name, last_name}: UserState = useSelector(
    userSelector.getUserInfo,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<
    Record<string, string[]>
  >({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [apiFilteredClients, setApiFilteredClients] = useState<any[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const stopBackPress = useRef(false);
  const clientApi = ClientApis;
  const dispatch = useDispatch();
  const clientsData = useSelector(clientSelector.getClientList);
  const cityList = useSelector(clientSelector.getCityList);
  const loading = useSelector(clientSelector.getClientLoader);

  // Debug logging
  console.log('ClientInfo Debug:', {
    clientsDataLength: clientsData?.length || 0,
    clientsData: clientsData,
    loading,
    searchQuery,
    appliedFilters
  });

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clientsData;
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    return clientsData.filter((client: any) => {
      const firmName = client.firm_name ?? '';
      return firmName.trim().toLowerCase().includes(lowerCaseQuery);
    });
  }, [clientsData, searchQuery, apiFilteredClients]);

  const filterData = useMemo(() => {
    const listOfSectors = Object.values(SectorType);
    const listOfLeadSources = Object.values(LeadSourceType);
    return {
      City: cityList,
      Sector: listOfSectors,
      'Source of lead': listOfLeadSources,
    };
  }, [cityList]);

  useEffect(() => {
    dispatch(clientActions.getCityList());
  }, [dispatch]);

  useEffect(() => {
    callGetClients();
  }, [appliedFilters, dispatch]);

  const callGetClients = () => {
    try {
      dispatch(clientActions.getClients(appliedFilters));
    } catch (error) {
      console.error('Error calling getClients:', error);
    }
  };

  const onPressFAB = () => {
    dispatch(clientActions.resetAllClientFormData());
    navigation.navigate(ClientScreens.FormSelectionScreen);
  };

  const onPressCard = (clientId: number) => {
    navigation.navigate(ClientScreens.ProfileScreen, {clientId});
  };

  const onEdit = (clientId: number) => {
    dispatch(clientActions.prepareClientForEdit(clientId));
    navigation.navigate(ClientScreens.FormSelectionScreen);
  };
  
  const onDelete = (clientId: number) => {
    dispatch(
      clientActions.deleteClientRequest({
        id: clientId,
        deleted_by: first_name + ' ' + last_name,
      }),
    );
  };

  const onAssignTask = (clientId: number) => {
    // Navigate to ClientLeadInfoTab for task assignment
    const client = clientsData.find(client => client.id === clientId);
    navigation.navigate(ClientScreens.ClientLeadInfoTab, {
      clientId: clientId.toString(),
      client_name: client?.firm_name, // Using firm_name as client_name since client_name doesn't exist
      firm_name: client?.firm_name,
      initiator: client?.user 
        ? `${client.user.first_name || ''} ${client.user.last_name || ''}`.trim()
        : undefined,
    });
  };

  // Safe search function that handles encrypted fields
  const searchInClientData = (item: any, query: string) => {
    try {
      const searchLower = query.toLowerCase();

      // Search in basic fields
      if (item.id?.toString().toLowerCase().includes(searchLower)) return true;

      // Search in potentially encrypted fields with safe decryption
      const clientName = decryptConditionally(item.client_name || '');
      if (clientName.toLowerCase().includes(searchLower)) return true;

      const firmName = decryptConditionally(item.firm_name || '');
      if (firmName.toLowerCase().includes(searchLower)) return true;

      const city = decryptConditionally(item.city || '');
      if (city.toLowerCase().includes(searchLower)) return true;

      const bankName = decryptConditionally(item.bank_name || '');
      if (Array.isArray(bankName)) {
        if (bankName.some(bank => bank.toLowerCase().includes(searchLower))) return true;
      } else if (bankName.toLowerCase().includes(searchLower)) {
        return true;
      }

      const location = decryptConditionally(item.location || '');
      if (location.toLowerCase().includes(searchLower)) return true;

      // Search in plain text fields
      if (item.source_of_lead?.toLowerCase().includes(searchLower)) return true;
      if (item.reference_details?.toLowerCase().includes(searchLower))
        return true;
      if (item.monthly_turnover?.toString().includes(searchLower)) return true;
      if (item.estimated_funding_required?.toString().includes(searchLower))
        return true;
      if (item.financier_name?.toLowerCase().includes(searchLower)) return true;

      return false;
    } catch (error) {
      return false;
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      callGetClients();
    }, []),
  );

  // Keep the visible list in sync with fetched clients when not filtering/searching
  // useEffect(() => {
  //   if (!isFilterOpen && !searchQuery) {
  //     setFilteredClients(clientsData);
  //   }
  // }, [clientsData, isFilterOpen, searchQuery]);

  // Handle back button when Read More is shown
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (stopBackPress.current) {
          stopBackPress.current = false;
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, []);

  // Update filtered clients when clientsData changes
  // useEffect(() => {
  //   setFilteredClients(clientsData);

  //   // Mark that data has been loaded at least once
  //   if (!loading && !hasLoadedOnce) {
  //     setHasLoadedOnce(true);
  //   }
  // }, [clientsData, loading, hasLoadedOnce]);

  // useEffect(() => {
  //   if (!isFilterOpen) {
  //     setFilteredClients(clientsData);
  //   }
  // }, [clientsData, isFilterOpen]);

  const handleApplyFilter = async () => {
    setFilterLoading(true);
    const payload = {
      locations: selectedFilters.location ? [selectedFilters.location] : [],
      firstNames: [],
      lastNames: [],
      sourceOfLead: selectedFilters.source ? [selectedFilters.source] : [],
    };
    try {
      const {data} = await clientApi.FilterBox(payload);
      if (data && data.statusCode === 200 && Array.isArray(data.data)) {
        setApiFilteredClients(data.data as any);
      } else {
        setApiFilteredClients([]);
      }
    } catch (error) {
      setApiFilteredClients([]);
    } finally {
      setFilterLoading(false);
    }
  };

  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    initiator: '',
    source: '',
  });

  const [enabledFilters, setEnabledFilters] = useState({
    location: false,
    initiator: false,
    source: false,
  });

  const [locationOptions, setLocationOptions] = useState<
    {label: string; value: string}[]
  >([]);
  const [initiatorOptions, setInitiatorOptions] = useState<
    {label: string; value: string | number}[]
  >([]);
  const [sourceOptions, setSourceOptions] = useState<
    {label: string; value: string}[]
  >([]);

  const fetchLocations = async () => {
    try {
      const response = await clientApi.getLocations();
      if (response?.data) {
        const options = response.data
          .map((enc: string) => ({
            label: decryptLocation(enc),
            value: enc,
          }))
          .filter((opt: {label: string; value: string}) => opt.label);
        setLocationOptions(options);
      }
    } catch (e) {
      setLocationOptions([]);
    }
  };

  const fetchInitiators = async () => {
    try {
      const response = await clientApi.getSalesmanList();
      if (response?.data) {
        const options = response.data.map((item: any) => ({
          label: `${item.first_name} ${item.last_name}`.trim(),
          value: item.id,
        }));
        setInitiatorOptions(options);
      }
    } catch (e) {
      setInitiatorOptions([]);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await clientApi.getClientsFilter({});
      const dataArr = response?.data?.data;
      if (dataArr && Array.isArray(dataArr)) {
        const uniqueSources = Array.from(
          new Set(
            dataArr
              .map((item: any) => item.source_of_lead)
              .filter((src: string) => !!src),
          ),
        );
        const options = uniqueSources.map((src: string) => ({
          label: src,
          value: src,
        }));
        setSourceOptions(options);
      }
    } catch (e) {
      setSourceOptions([]);
    }
  };

  useEffect(() => {
    if (isFilterOpen) {
      fetchLocations();
      fetchInitiators();
      fetchSources();
    }
  }, [isFilterOpen]);

  function getDisplayLocation(location: string): string {
    if (!location) return '';
    if (/^[a-zA-Z ]+$/.test(location)) return location;
    return decryptLocation(location);
  }
  return (
    <Container>
      <AppBar title="Client Information Master" navigation={navigation} />
      <View style={styles.subContainer}>
        <Text style={styles.Subheader}>Client Information</Text>
      </View>
      <View style={{flex: 1}}>
        {/* Client List Header with search and filter */}
        <View style={styles.RowContainer}>
          <View style={styles.subRowContainer}>
            <Text style={styles.subRowContainerTxt}>Clients</Text>
            <View style={styles.Badge}>
              <Text style={styles.badgeText}>{clientsData.length}</Text>
            </View>
          </View>
          <View style={styles.Searchbox}>
            <Search height={12} width={12} />
            <TextInput
              style={styles.input}
              placeholder="Search by Firm name"
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
        {/* Client List */}
        <View style={styles.cardList}>
          <FlatList
            data={filteredClients}
            contentContainerStyle={{paddingBottom: scaleHeight(56)}}
            renderItem={({item}) => (
              <ClientCard
                key={item.id.toString()}
                data={item}
                onPressCard={onPressCard}
                onEdit={onEdit}
                onDelete={onDelete}
                onAssignTask={onAssignTask}
              />
            )}
            refreshing={loading}
            onRefresh={callGetClients}
            ListEmptyComponent={
              <Text style={styles.emptyList}>
                {loading ? 'Loading clients...' : 'No Clients Found'}
              </Text>
            }
          />
        </View>
      </View>

      {/* Filter Model */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        filterData={filterData}
      />

      {/* FAB to add client */}
      <TouchableOpacity style={styles.plusButton} onPress={onPressFAB}>
        <Plus height={24} width={24} />
      </TouchableOpacity>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  subContainer: {
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
  cardList: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 10,
  },
  plusButton: {
    position: 'absolute',
    bottom: scaleHeight(40),
    right: 30,
    backgroundColor: Colors.tertiaryBlue,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  loader: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
