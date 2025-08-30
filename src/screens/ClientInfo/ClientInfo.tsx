import {Filter, Plus, Search} from '@assets/Icons';
import {AppBar, ClientCard, Container, FilterDropdown} from '@components/index';
import {ClientScreens, Colors, FontWeight} from '@constants/index';
import {DrawerScreenProps} from '@react-navigation/drawer';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {ClientCardReadMore} from '@screens/ReadMore/ClientCardReadMore';
import {clientActions, clientSelector} from '@store/client';
import {ClientNavigatorType, HomeNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useCallback, useState, useEffect, useRef} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import clientApi from '@services/api/client.api';
import {decryptLocation} from '@utils/crypto';

type NavigationType = CompositeScreenProps<
  NativeStackScreenProps<ClientNavigatorType>,
  DrawerScreenProps<HomeNavigatorType>
>;

type ClientInfoProps = {
  navigation: NavigationType['navigation'];
};

export const ClientInfo: React.FC<ClientInfoProps> = ({navigation}) => {
  const [showReadMore, setShowReadMore] = useState(false);
  const [readMoreClientId, setReadMoreClientId] = useState<number | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const stopBackPress = useRef(false);

  const dispatch = useDispatch();
  const clientsData = useSelector(clientSelector.getClientList);
  const loading = useSelector(clientSelector.getBasicDetailLoading); // This is actually clientLoader

  const callGetClients = () => {
    dispatch(clientActions.getClients());
  };

  const onPressReadMore = useCallback((clientId: number) => {
    setReadMoreClientId(clientId);
    setShowReadMore(true);
  }, []);

  const onPressFAB = () => {
    dispatch(clientActions.resetAllClientFormData());
    navigation.navigate(ClientScreens.FormSelectionScreen);
  };

  const onPressCard = (client: any) => {
    (navigation.navigate as any)(ClientScreens.ClientLeadInfoTab, {
      clientId: client.id,
      client_name: client.client_name,
      firm_name: client.firm_name,
      initiator: client.user
        ? `${client.user.first_name} ${client.user.last_name}`
        : '',
    });
  };

  const onEdit = (clientId: number) => {
    (navigation.navigate as any)(ClientScreens.FormSelectionScreen, {
      clientId,
      fromScreen: 'ClientInfo',
      isEdit: true,
    });
  };

  // Safe decrypt function for search
  const safeDecrypt = (value: any) => {
    if (!value) return '';
    try {
      // Check if the value looks like encrypted data
      const isEncrypted = /^[A-Za-z0-9+/=]+$/.test(value) && value.length > 20;
      if (isEncrypted) {
        const decrypted = decryptLocation(value);
        return decrypted || value;
      }
      return value;
    } catch (error) {
      return value || '';
    }
  };

  // Safe search function that handles encrypted fields
  const searchInClientData = (item: any, query: string) => {
    try {
      const searchLower = query.toLowerCase();

      // Search in basic fields
      if (item.id?.toString().toLowerCase().includes(searchLower)) return true;

      // Search in potentially encrypted fields with safe decryption
      const clientName = safeDecrypt(item.client_name);
      if (clientName.toLowerCase().includes(searchLower)) return true;

      const firmName = safeDecrypt(item.firm_name);
      if (firmName.toLowerCase().includes(searchLower)) return true;

      const city = safeDecrypt(item.city);
      if (city.toLowerCase().includes(searchLower)) return true;

      const bankName = safeDecrypt(item.bank_name);
      if (bankName.toLowerCase().includes(searchLower)) return true;

      const location = safeDecrypt(item.location);
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
      console.log('Search error for item:', item.id, error);
      return false;
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      callGetClients();
    }, []),
  );

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
        setFilteredClients(data.data as any);
      } else {
        setFilteredClients([]);
      }
    } catch (error) {
      setFilteredClients([]);
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
      const response = await clientApi.getAllClients();
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
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
          }}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      ) : (
        <>
          {showReadMore ? (
            <>
              {readMoreClientId !== null && (
                <ClientCardReadMore
                  onPressReadLess={() => setShowReadMore(false)}
                  clientId={readMoreClientId}
                />
              )}
            </>
          ) : (
            <>
              <View style={styles.RowContainer}>
                <View style={styles.subRowContainer}>
                  <Text style={styles.subRowContainerTxt}>Clients</Text>
                  <View style={styles.Badge}>
                    <Text style={styles.badgeText}>
                      {(() => {
                        if (searchQuery) {
                          const searchFiltered = filteredClients.filter(
                            (item: any) =>
                              searchInClientData(item, searchQuery),
                          );
                          return searchFiltered.length;
                        }
                        if (
                          isFilterOpen ||
                          filteredClients.length !== clientsData.length
                        ) {
                          return filteredClients.length;
                        }
                        return clientsData.length;
                      })()}
                    </Text>
                  </View>
                </View>
                <View style={styles.Searchbox}>
                  <Search height={12} width={12} />
                  <TextInput
                    style={styles.input}
                    placeholder="Search Clients"
                    placeholderTextColor={Colors.balancedGray}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <View style={styles.filterBox}>
                  <TouchableOpacity
                    onPress={() => setIsFilterOpen(prev => !prev)}>
                    <Filter height={12} width={12} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* FilterDropdown */}
              {isFilterOpen && (
                <TouchableWithoutFeedback
                  onPress={() => setIsFilterOpen(false)}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      zIndex: 999,
                      justifyContent: 'flex-start',
                      alignItems: 'flex-end',
                    }}>
                    <View
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                      }}
                    />
                    <View style={{zIndex: 1000}}>
                      <FilterDropdown
                        selectedFilters={selectedFilters}
                        enabledFilters={enabledFilters}
                        onSetSelectedFilters={setSelectedFilters}
                        onSetEnabledFilters={setEnabledFilters}
                        onApply={handleApplyFilter}
                        onClear={() => {
                          setSelectedFilters({
                            location: '',
                            initiator: '',
                            source: '',
                          });
                          setEnabledFilters({
                            location: false,
                            initiator: false,
                            source: false,
                          });
                          callGetClients();
                        }}
                        onSetIsFilterOpen={setIsFilterOpen}
                        locations={locationOptions}
                        initiators={initiatorOptions}
                        sources={sourceOptions}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              )}

              <View style={styles.cardList}>
                {filterLoading ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <ActivityIndicator
                      size="large"
                      color={Colors.primaryColor}
                    />
                  </View>
                ) : (
                  <FlatList
                    data={
                      searchQuery
                        ? filteredClients.filter((item: any) =>
                            searchInClientData(item, searchQuery),
                          )
                        : filteredClients
                    }
                    renderItem={({item}) => (
                      <ClientCard
                        data={item}
                        onPressReadMore={() => onPressReadMore(item.id)}
                        onPressCard={() => onPressCard(item)}
                        onEdit={onEdit}
                        onDelete={() => callGetClients()}
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
                )}
              </View>
              <TouchableOpacity style={styles.plusButton} onPress={onPressFAB}>
                <Plus height={24} width={24} />
              </TouchableOpacity>
            </>
          )}
        </>
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
    fontSize: scaleFont(12),
  },
  cardList: {
    flex: 1,
    padding: 16,
  },
  plusButton: {
    position: 'absolute',
    bottom: scaleHeight(60),
    right: 30,
    backgroundColor: Colors.tertiaryBlue,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingDropdown: {
    position: 'absolute',
    top: scaleHeight(120),
    right: scaleWidth(10),
    width: scaleWidth(220),
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    elevation: 6,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    marginTop: 6,
    marginLeft: 10,
    marginRight: 60,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    elevation: 2,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    gap: 6,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.6,
    borderBottomColor: '#E4E7EC',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#98A2B3',
    borderRadius: 3,
    marginRight: 10,
  },
  checkedBox: {
    backgroundColor: Colors.primaryColor,
  },
  dropdownText: {
    flex: 1,
    fontSize: scaleFont(13),
    fontWeight: '500',
    color: '#344054',
  },
  arrow: {
    fontSize: 16,
    color: '#D0D5DD',
  },
  dropdownButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    gap: 16,
  },
  clearBtn: {
    fontSize: scaleFont(12),
    color: '#D92D20',
    fontWeight: '600',
  },
  applyBtn: {
    fontSize: scaleFont(12),
    color: '#027A48',
    fontWeight: '600',
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
});
