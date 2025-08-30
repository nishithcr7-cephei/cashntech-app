/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {
  AppBar,
  Container,
  FilterDropdown,
  LeadProgressCard,
} from '@components/index';
import {Filter, Search} from '@assets/Icons';
import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType, LeadNavigatorType} from '@type/NavigatorTypes';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {LeadProgressInfo} from '@screens/LeadProgressInfo/LeadProgressInfo';
import {useDispatch, useSelector} from 'react-redux';
import {
  clientActions,
  clientSelector,
  ILeadProgressResponseDatum,
} from '@store/client';
import FontWeight from '@constants/FontWeight';
import clientApi from '@services/api/client.api';
import {decryptLocation, decryptConditionally} from '@utils/crypto';

type LeadNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<LeadNavigatorType>
>;

const leadData = [
  {
    clientId: '0001',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    sanctionRequested: '25,00,000',
    processStart: '10-02-2023',
    status: 'Warm',
  },
  {
    clientId: '0002',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    sanctionRequested: '25,00,000',
    processStart: '10-02-2023',
    status: 'Hot',
  },
  {
    clientId: '0003',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    sanctionRequested: '25,00,000',
    processStart: '10-02-2023',
    status: 'Cold',
  },
  {
    clientId: '0004',
    clientName: 'S D Verma',
    location: 'Delhi',
    initiator: 'Delhi',
    sourceDHCO: 'Source D',
    referenceDetails: '9898923222',
    monthlyTurnover: '20,00,000',
    sanctionRequested: '25,00,000',
    processStart: '10-02-2023',
    status: 'Warm',
  },
] as const;

export const LeadProgress = () => {
  const navigation = useNavigation<LeadNavigationType>();
  const [showReadMore, setShowReadMore] = useState(false);
  const [progressStatusData, setProgressStatusData] = useState<Array<any>>([]);
  const [currentLeadData, setCurrentLeadData] =
    useState<ILeadProgressResponseDatum | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
  const [filterLoading, setFilterLoading] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState<ILeadProgressResponseDatum[]>([]);

  const onPressReadMore = (
    leadId: string,
    item: ILeadProgressResponseDatum,
  ) => {
    dispatch(
      clientActions.getLeadDesciption({
        payload: leadId,
        callbackSuccess: progressData => {
          setShowReadMore(true);
          setCurrentLeadData(item);
          setProgressStatusData(progressData);
        },
      }),
    );
  };

  const dispatch = useDispatch();
  const leadData = useSelector(clientSelector.getLeadProgress);
  const leadLoading = useSelector(clientSelector.getLeadLoader);
  
  // Debug logs
  console.log('LeadProgress: State debug:', {
    leadLoading,
    leadDataLength: leadData?.length || 0,
    showReadMore
  });
  const callgetleads = () => {
    console.log('LeadProgress: Calling getLead action');
    dispatch(clientActions.getLead());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(clientActions.getLead());
    } finally {
      setIsRefreshing(false);
    }
  };
  useEffect(() => {
    callgetleads();
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (leadLoading) {
        console.log('LeadProgress: Loading timeout reached, forcing stop');
        dispatch(clientActions.setLeadList([]));
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeout);
  }, []);

  // Filter functions
  const fetchLocations = async () => {
    try {
      // For leads, we'll get unique cities from the current leads data
      const uniqueCities = Array.from(
        new Set(
          leadData
            .map((item: any) => item.city)
            .filter((city: string) => !!city)
        )
      );
      const options = uniqueCities.map((city: string) => ({
        label: decryptConditionally(city),
        value: city,
      }));
      setLocationOptions(options);
    } catch (e) {
      setLocationOptions([]);
    }
  };

  const fetchInitiators = async () => {
    try {
      // For leads, we'll get unique initiators from the current leads data
      const uniqueInitiators = Array.from(
        new Set(
          leadData
            .map((item: any) => item.user)
            .filter((user: any) => !!user)
            .map((user: any) => `${user.first_name} ${user.last_name}`.trim())
        )
      );
      const options = uniqueInitiators.map((initiator: string) => ({
        label: initiator,
        value: initiator,
      }));
      setInitiatorOptions(options);
    } catch (e) {
      setInitiatorOptions([]);
    }
  };

  const fetchSources = async () => {
    try {
      // For leads, we'll get unique sources from the current leads data
      const uniqueSources = Array.from(
        new Set(
          leadData
            .map((item: any) => item.source_of_lead)
            .filter((src: string) => !!src)
        )
      );
      const options = uniqueSources.map((src: string) => ({
        label: src,
        value: src,
      }));
      setSourceOptions(options);
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

  const handleApplyFilter = async () => {
    setFilterLoading(true);
    try {
      // Filter leads data locally based on selected filters
      let filteredData = [...leadData];
      
      if (selectedFilters.location) {
        filteredData = filteredData.filter((item: any) => 
          item.city === selectedFilters.location
        );
      }
      
      if (selectedFilters.initiator) {
        filteredData = filteredData.filter((item: any) => {
          const userFullName = item.user ? `${item.user.first_name} ${item.user.last_name}`.trim() : '';
          return userFullName === selectedFilters.initiator;
        });
      }
      
      if (selectedFilters.source) {
        filteredData = filteredData.filter((item: any) => 
          item.source_of_lead === selectedFilters.source
        );
      }
      
      setFilteredLeads(filteredData);
    } catch (error) {
      console.log('Filter error:', error);
      setFilteredLeads([]);
    } finally {
      setFilterLoading(false);
    }
  };

  useEffect(() => {
    if (!isFilterOpen) {
      setFilteredLeads(leadData);
    }
  }, [leadData, isFilterOpen]);

  const onCardPress = (item: ILeadProgressResponseDatum) => {
    navigation.navigate('LeadProgressInfo', { clientId: item.id });
  };

  return (
    <Container>
      <AppBar title="Lead Progress" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Lead Progress Information</Text>
      </View>
      {leadLoading ? (
        <TouchableWithoutFeedback onPress={() => {
          console.log('LeadProgress: User tapped to dismiss loading');
          setIsLoading(false);
        }}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading Leads...</Text>
            <Text style={styles.tapToDismissText}>Tap anywhere to dismiss</Text>
          </View>
        </TouchableWithoutFeedback>
      ) : showReadMore ? (
        <LeadProgressInfo
          data={currentLeadData}
          progressStatusData={progressStatusData}
          onPressReadLess={() => {
            setShowReadMore(false);
            setCurrentLeadData(null);
          }}
        />
      ) : (
        <>
          <View style={styles.RowContainer}>
            <View style={styles.Subrowcontainer}>
              <Text style={styles.Subrowcontainertxt}>Leads</Text>
              <View style={styles.Badge}>
                <Text style={styles.Badgetext}>
                  {(() => {
                    if (isFilterOpen || filteredLeads.length !== leadData.length) {
                      return filteredLeads.length;
                    }
                    return leadData.length;
                  })()}
                </Text>
              </View>
            </View>
            <View style={styles.Searchbox}>
              <Search height={12} width={12} />
              <TextInput
                style={styles.input}
                placeholder="Search Leads"
                placeholderTextColor={Colors.balancedGray}
              />
            </View>
            

            <TouchableOpacity onPress={() => setIsFilterOpen(prev => !prev)}>
              <View style={styles.Filterbox}>
                <Filter height={12} width={12} />
              </View>
            </TouchableOpacity>
          </View>

          {/* FilterDropdown */}
          {isFilterOpen && (
            <TouchableWithoutFeedback onPress={() => setIsFilterOpen(false)}>
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
                      callgetleads();
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

          <View style={styles.Cardlist}>
            {filterLoading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
              </View>
            ) : (
              <FlatList
                data={
                  isFilterOpen || filteredLeads.length !== leadData.length
                    ? filteredLeads
                    : leadData
                }
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <LeadProgressCard
                    data={item}
                    onPress={() => onCardPress(item)}
                  />
                )}
                contentContainerStyle={{flexGrow: 1}}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                  <Text style={styles.emptyList}>No Leads Found</Text>
                }
              />
            )}
          </View>
        </>
      )}
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
    paddingHorizontal: 10,
  },
  input: {
    marginLeft: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontWeight: fontWeight.Medium,
  },
  tapToDismissText: {
    marginTop: 8,
    fontSize: scaleFont(12),
    color: Colors.balancedGray,
    fontWeight: fontWeight.Normal,
    fontStyle: 'italic',
  },
});
