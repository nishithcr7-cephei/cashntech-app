import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {Container, AppBar, FilterModal} from '@components/index';
import Colors from '@constants/Colors';
import {Filter, Search} from '@assets/Icons';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';
import {decryptLocation} from '@utils/crypto';
import {
  getVisitDetailsListRequest,
  getSalesmanListRequest,
  getLocationsListRequest,
} from '@store/visit/visit.slice';
import {
  selectVisitDetailsList,
  selectVisitDetailsLoading,
  selectVisitDetailsError,
  selectSalesmanList,
  selectSalesmanLoading,
  selectSalesmanError,
  selectLocationsList,
  selectLocationsLoading,
  selectLocationsError,
} from '@store/visit/visit.selector';
import {RootState} from '@store/app/store';

type VisitItem = {
  id: number;
  visit_date_time?: string;
  salesperson?: string;
  client_firm_name?: string;
  visit_type?: string;
  visit_number?: number;
  visit_remark?: string;
  sector?: string | null;
  client?: { 
    id?: number; 
    source_of_lead?: string; 
    city?: string; 
    sector?: string | null;
    created_at?: string;
  };
};

export const VisitDetail = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Redux selectors
  const visitDetailsList = useSelector(selectVisitDetailsList);
  const visitDetailsLoading = useSelector(selectVisitDetailsLoading);
  const visitDetailsError = useSelector(selectVisitDetailsError);
  const salesmanList = useSelector(selectSalesmanList);
  const salesmanLoading = useSelector(selectSalesmanLoading);
  const salesmanError = useSelector(selectSalesmanError);
  const locationsList = useSelector(selectLocationsList);
  const locationsLoading = useSelector(selectLocationsLoading);
  const locationsError = useSelector(selectLocationsError);
  
  
  // Local state for UI
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [initiatorOptions, setInitiatorOptions] = useState<string[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);

  // Dispatch actions to fetch data
  const fetchList = () => {
    dispatch(getVisitDetailsListRequest());
  };

  const fetchLocations = () => {
    dispatch(getLocationsListRequest());
  };

  const fetchInitiators = () => {
    dispatch(getSalesmanListRequest());
  };


  // Dispatch actions on component mount
  useEffect(() => {
    fetchList();
    fetchLocations();
    fetchInitiators();
  }, []);

  // Helper function to normalize visit items
  const normalizeVisitItems = (items: any[]): VisitItem[] => {
    if (!Array.isArray(items)) return [];
    
    const flattenedItems: VisitItem[] = [];
    
    items.forEach((rec) => {
      if (Array.isArray(rec?.visit) && rec.visit.length > 0) {
        // Create a separate item for each visit
        rec.visit.forEach((visit: any) => {
          flattenedItems.push({
            id: visit.id ?? rec.id,
            visit_date_time: visit.visit_date_time,
            salesperson: visit.salesperson,
            client_firm_name: visit.client_firm_name,
            visit_type: visit.visit_type,
            visit_number: visit.visit_number,
            visit_remark: visit.visit_remark,
            sector: rec.sector ?? null,
            client: {
              id: rec.id,
              source_of_lead: rec.source_of_lead,
              city: rec.city,
              sector: rec.sector ?? null,
              created_at: rec.created_at,
            },
          } as VisitItem);
        });
      } else {
        // Handle records without visit array (fallback)
        flattenedItems.push({
          id: rec.id,
          visit_date_time: rec.visit_date_time,
          salesperson: rec.salesperson,
          client_firm_name: rec.client_firm_name,
          visit_type: rec.visit_type,
          visit_number: rec.visit_number,
          visit_remark: rec.visit_remark,
          sector: rec.sector ?? null,
          client: {
            ...rec.client,
            created_at: rec.created_at,
          },
        } as VisitItem);
      }
    });
    
    return flattenedItems;
  };

  // Prepare filter data
  const filterData = {
    'City': cityOptions,
    'Initiator': initiatorOptions,
    'Source': sourceOptions,
    'Sector': sectorOptions,
    'Month/Year': [], // Will be handled specially
  };

  // Filtered records based on search and filters (similar to ManageTask pattern)
  const filteredVisitDetails = useMemo(() => {
    if (!visitDetailsList || visitDetailsList.length === 0) return [];
    
    let filtered = normalizeVisitItems(visitDetailsList);
    
    // Apply search filter
    if (searchText) {
      const term = searchText.toLowerCase();
      filtered = filtered.filter((it: VisitItem) => {
        const firm = decryptLocation(it.client_firm_name || '').toLowerCase();
        const city = decryptLocation(it.client?.city || '').toLowerCase();
        const visitNo = (it.visit_number != null ? String(it.visit_number) : '').toLowerCase();
        const salesperson = (it.salesperson || '').toLowerCase();
        const visitType = (it.visit_type || '').toLowerCase();
        const remark = (it.visit_remark || '').toLowerCase();
        
        return (
          firm.includes(term) ||
          city.includes(term) ||
          visitNo.includes(term) ||
          salesperson.includes(term) ||
          visitType.includes(term) ||
          remark.includes(term)
        );
      });
    }
    
    // Apply other filters
    if (appliedFilters['City'] && appliedFilters['City'].length > 0) {
      filtered = filtered.filter((it: VisitItem) => {
        const city = decryptLocation(it.client?.city || '');
        return appliedFilters['City'].includes(city);
      });
    }
    
    if (appliedFilters['Initiator'] && appliedFilters['Initiator'].length > 0) {
      filtered = filtered.filter((it: VisitItem) => {
        const initiator = it.salesperson || '';
        return appliedFilters['Initiator'].includes(initiator);
      });
    }
    
    if (appliedFilters['Source'] && appliedFilters['Source'].length > 0) {
      filtered = filtered.filter((it: VisitItem) => {
        const source = it.client?.source_of_lead || '';
        return appliedFilters['Source'].includes(source);
      });
    }
    
    if (appliedFilters['Sector'] && appliedFilters['Sector'].length > 0) {
      filtered = filtered.filter((it: VisitItem) => {
        const sector = (it.sector ?? it.client?.sector ?? '').toString().trim();
        return appliedFilters['Sector'].includes(sector);
      });
    }
    
    if (appliedFilters['Month/Year'] && appliedFilters['Month/Year'].length > 0) {
      filtered = filtered.filter((it: VisitItem) => {
        // Use visit_date_time if available, otherwise fall back to created_at
        const dateToUse = it.visit_date_time || it.client?.created_at;
        if (!dateToUse) return false;
        
        const visitDate = new Date(dateToUse);
        const visitYear = visitDate.getFullYear();
        const visitMonth = visitDate.getMonth() + 1; // getMonth() returns 0-11
        
        return appliedFilters['Month/Year'].some((monthYear: string) => {
          // monthYear format: "2025-08" (year-month)
          const [year, month] = monthYear.split('-').map(Number);
          return visitYear === year && visitMonth === month;
        });
      });
    }
    
    return filtered;
  }, [visitDetailsList, searchText, appliedFilters]);

  // Build filter options from visit details (similar to ManageTask pattern)
  useEffect(() => {
    if (visitDetailsList && visitDetailsList.length > 0) {
      const list: VisitItem[] = normalizeVisitItems(visitDetailsList);
      
      // Build dynamic filter options from actual data
      const cities = new Set<string>();
      const initiators = new Set<string>();
      const sources = new Set<string>();
      const sectors = new Set<string>();
      
      list.forEach((item: VisitItem) => {
        // Add cities
        const city = decryptLocation(item.client?.city || '');
        if (city) cities.add(city);
        
        // Add initiators
        if (item.salesperson) initiators.add(item.salesperson);
        
        // Add sources
        if (item.client?.source_of_lead) sources.add(item.client.source_of_lead);
        
        // Add sectors
        const sector = (item.sector ?? item.client?.sector ?? '').toString().trim();
        if (sector) sectors.add(sector);
      });
      
      setCityOptions(Array.from(cities));
      setInitiatorOptions(Array.from(initiators));
      setSourceOptions(Array.from(sources));
      setSectorOptions(Array.from(sectors));
    }
  }, [visitDetailsList]);

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB') : 'N/A');
  
  const formatCreatedAt = (iso?: string) => {
    if (!iso) return 'N/A';
    const date = new Date(iso);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const VisitCard = React.memo(({item, index}: {item: VisitItem; index: number}) => {
    const firmName = decryptLocation(item.client_firm_name || '');
    const city = decryptLocation(item.client?.city || '');
    const source = item.client?.source_of_lead || 'N/A';
    const sector = (item.sector ?? item.client?.sector ?? '').toString().trim() || 'N/A';
    
    return (
      <View style={styles.card}>
        <Text style={styles.label}>
          <Text style={styles.bold}>Sr.No :</Text> 
          <Text style={styles.value}>{index + 1}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Firm Name :</Text> 
          <Text style={styles.value}>{firmName}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Sector :</Text> 
          <Text style={styles.value}>{sector}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>City :</Text> 
          <Text style={styles.value}>{city}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Source(D/H/C/O) :</Text> 
          <Text style={styles.value}>{source}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Initiator :</Text> 
          <Text style={styles.value}>{item.salesperson || 'N/A'}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Visit Date :</Text> 
          <Text style={styles.value}>{formatDate(item.visit_date_time)}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Visit Type :</Text> 
          <Text style={styles.value}>{item.visit_type || 'N/A'}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Visit Number :</Text> 
          <Text style={styles.value}>{item.visit_number ?? 'N/A'}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Remark :</Text> 
          <Text style={styles.value}>{item.visit_remark || 'N/A'}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Created At :</Text> 
          <Text style={styles.value}>{formatCreatedAt(item.client?.created_at)}</Text>
        </Text>
      </View>
    );
  });

  const renderItem = useCallback(({item, index}: {item: VisitItem; index: number}) => {
    return <VisitCard item={item} index={index} />;
  }, []);

  const keyExtractor = useCallback((item: VisitItem, index: number) => {
    const visitId = item?.id != null ? String(item.id) : 'na';
    const clientId = item?.client?.id != null ? String(item.client.id) : 'na';
    const firm = item?.client_firm_name || 'unknown';
    const dt = item?.visit_date_time || 'na';
    return `v-${visitId}-c-${clientId}-f-${firm}-d-${dt}-i-${index}`;
  }, []);

  return (
    <Container>
      <AppBar title="Visit Details" navigation={navigation as any} />
      <View style={styles.subContainer}>
        <Text style={styles.Subheader}>Assign Visit</Text>
      </View>
      <View style={styles.headerRow}>
               <View style={styles.headerLeft}>
                 <Text style={styles.headerTitle}>Visit Details</Text>
                 <View style={styles.badge}><Text style={styles.badgeText}>{filteredVisitDetails.length}</Text></View>
               </View>
        <View style={styles.searchBox}>
          <Search height={12} width={12} />
          <TextInput style={styles.input} placeholder="Search by Firm name" placeholderTextColor={Colors.balancedGray} value={searchText} onChangeText={setSearchText} />
        </View>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <View style={styles.filterBox}><Filter height={12} width={12} /></View>
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

      {visitDetailsLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primaryColor} /></View>
      ) : (
               <FlatList
                 data={filteredVisitDetails}
                 keyExtractor={keyExtractor}
                 renderItem={renderItem}
                 contentContainerStyle={{padding: 16}}
                 ListEmptyComponent={<Text style={styles.empty}>No Visit Details Found</Text>}
                 onRefresh={fetchList}
                 refreshing={visitDetailsLoading}
                 removeClippedSubviews={true}
                 maxToRenderPerBatch={10}
                 windowSize={10}
                 initialNumToRender={10}
               />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  subContainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  headerRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.darkblack,
  },
  badge: {
    backgroundColor: Colors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: Colors.SteelGray,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    height: scaleHeight(36),
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
    paddingTop: scaleHeight(8),
    textAlignVertical: 'center',
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
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    color: '#515151',
    marginBottom: 6,
  },
  bold: {
    fontWeight: 'bold',
  },
  value: {
    color: '#515151',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  empty: {
    textAlign: 'center',
    color: Colors.SteelGray,
    fontSize: scaleFont(16),
  },
});

export default VisitDetail;


