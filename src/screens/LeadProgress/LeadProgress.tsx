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
import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {
  AppBar,
  Container,
  FilterModal,
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
  leadActions,
  leadSelector,
  ILeadProgressResponseDatum,
} from '@store/lead';
import FontWeight from '@constants/FontWeight';
import leadApi from '@services/api/lead.api';
import {decryptLocation, decryptConditionally} from '@utils/crypto';

type LeadNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<LeadNavigatorType>
>;


export const LeadProgress = () => {
  const navigation = useNavigation<LeadNavigationType>();
  const [showReadMore, setShowReadMore] = useState(false);
  const [progressStatusData, setProgressStatusData] = useState<Array<any>>([]);
  const [currentLeadData, setCurrentLeadData] =
    useState<ILeadProgressResponseDatum | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [initiatorOptions, setInitiatorOptions] = useState<string[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);

  const onPressReadMore = (
    leadId: string,
    item: ILeadProgressResponseDatum,
  ) => {
    dispatch(
      leadActions.getLeadDesciption({
        payload: leadId,
        callbackSuccess: (progressData: any[]) => {
          setShowReadMore(true);
          setCurrentLeadData(item);
          setProgressStatusData(progressData);
        },
      }),
    );
  };

  const dispatch = useDispatch();
  const leadData = useSelector(leadSelector.getLeadProgress);
  const leadLoading = useSelector(leadSelector.getLeadLoader);
  
  // Debug logs
  console.log('LeadProgress: State debug:', {
    leadLoading,
    leadDataLength: leadData?.length || 0,
    showReadMore
  });
  const callgetleads = () => {
    console.log('LeadProgress: Calling getLead action');
    dispatch(leadActions.getLead());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(leadActions.getLead());
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
        dispatch(leadActions.setLeadList([]));
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeout);
  }, []);

  // Build filter options from lead data (similar to VisitDetail pattern)
  useEffect(() => {
    if (leadData && leadData.length > 0) {
      // Build dynamic filter options from actual data
      const cities = new Set<string>();
      const initiators = new Set<string>();
      const sources = new Set<string>();
      const sectors = new Set<string>();
      
      leadData.forEach((item: any) => {
        // Add cities
        const city = decryptConditionally(item.city || '');
        if (city) cities.add(city);
        
        // Add initiators
        if (item.file_by) initiators.add(item.file_by);
        
        // Add sources
        if (item.source_of_lead) sources.add(item.source_of_lead);
        
        // Add sectors
        const sector = (item.sector ?? '').toString().trim();
        if (sector) sectors.add(sector);
      });
      
      setCityOptions(Array.from(cities));
      setInitiatorOptions(Array.from(initiators));
      setSourceOptions(Array.from(sources));
      setSectorOptions(Array.from(sectors));
    }
  }, [leadData]);

  // Prepare filter data for FilterModal
  const filterData = {
    'City': cityOptions,
    'Initiator': initiatorOptions,
    'Source': sourceOptions,
    'Sector': sectorOptions,
    'Month/Year': [], // Will be handled specially by MonthYearFilter component
  };

  // Filtered leads based on search and applied filters (similar to VisitDetail pattern)
  const filteredLeads = useMemo(() => {
    if (!leadData || leadData.length === 0) return [];
    
    let filtered = [...leadData];
    
    // Apply search filter
    if (searchText) {
      const term = searchText.toLowerCase();
      filtered = filtered.filter((item: any) => {
        const clientName = decryptConditionally(item.client_name || '').toLowerCase();
        const city = decryptConditionally(item.city || '').toLowerCase();
        const source = (item.source_of_lead || '').toLowerCase();
        const initiator = (item.file_by || '').toLowerCase();
        const sector = (item.sector || '').toString().toLowerCase();
        
        return (
          clientName.includes(term) ||
          city.includes(term) ||
          source.includes(term) ||
          initiator.includes(term) ||
          sector.includes(term)
        );
      });
    }
    
    // Apply filters
    if (appliedFilters['City'] && appliedFilters['City'].length > 0) {
      filtered = filtered.filter((item: any) => {
        const city = decryptConditionally(item.city || '');
        return appliedFilters['City'].includes(city);
      });
    }
    
    if (appliedFilters['Initiator'] && appliedFilters['Initiator'].length > 0) {
      filtered = filtered.filter((item: any) => {
        const initiator = item.file_by || '';
        return appliedFilters['Initiator'].includes(initiator);
      });
    }
    
    if (appliedFilters['Source'] && appliedFilters['Source'].length > 0) {
      filtered = filtered.filter((item: any) => {
        const source = item.source_of_lead || '';
        return appliedFilters['Source'].includes(source);
      });
    }
    
    if (appliedFilters['Sector'] && appliedFilters['Sector'].length > 0) {
      filtered = filtered.filter((item: any) => {
        const sector = (item.sector ?? '').toString().trim();
        return appliedFilters['Sector'].includes(sector);
      });
    }
    
    if (appliedFilters['Month/Year'] && appliedFilters['Month/Year'].length > 0) {
      filtered = filtered.filter((item: any) => {
        // Use created_at date for Month/Year filtering
        const dateToUse = item.created_at;
        if (!dateToUse) return false;
        
        const leadDate = new Date(dateToUse);
        const leadYear = leadDate.getFullYear();
        const leadMonth = leadDate.getMonth() + 1; // getMonth() returns 0-11
        
        return appliedFilters['Month/Year'].some((monthYear: string) => {
          // monthYear format: "2025-08" (year-month)
          const [year, month] = monthYear.split('-').map(Number);
          return leadYear === year && leadMonth === month;
        });
      });
    }
    
    return filtered;
  }, [leadData, searchText, appliedFilters]);

  const onCardPress = (item: ILeadProgressResponseDatum) => {
    navigation.navigate('LeadProgressInfo' as any, { clientId: item.id });
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
                  {filteredLeads.length}
                </Text>
              </View>
            </View>
            <View style={styles.Searchbox}>
              <Search height={12} width={12} />
              <TextInput
                style={styles.input}
                placeholder="Search by Firm Name"
                placeholderTextColor={Colors.balancedGray}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            

            <TouchableOpacity onPress={() => setShowFilterModal(true)}>
              <View style={styles.Filterbox}>
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

          <View style={styles.Cardlist}>
            <FlatList
              data={filteredLeads}
              keyExtractor={item => item.id.toString()}
              renderItem={({item, index}) => (
                <LeadProgressCard
                  data={item}
                  index={index}
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
    height: scaleHeight(40),
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
