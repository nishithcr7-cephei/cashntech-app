import React, {useEffect, useState, useCallback} from 'react';
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
import {Container, AppBar, FilterModal} from '@components/index';
import Colors from '@constants/Colors';
import {Filter, Search} from '@assets/Icons';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';
import visitApi from '@services/api/visit.api';
import {decryptLocation} from '@utils/crypto';
import {dropDownData} from '@screens/CreateClientForm/CreateClientForm.type';

type VisitItem = {
  id: number;
  visit_date_time?: string;
  salesperson?: string;
  client_firm_name?: string;
  visit_type?: string;
  visit_number?: number;
  visit_remark?: string;
  sector?: string | null;
  client?: { id?: number; source_of_lead?: string; city?: string; sector?: string | null };
};

export const VisitDetail = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<VisitItem[]>([]);
  const [filtered, setFiltered] = useState<VisitItem[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [initiatorOptions, setInitiatorOptions] = useState<string[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const {data} = await visitApi.postVisitDetailsList();
      const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const list: VisitItem[] = normalizeVisitItems(raw);
      setRows(list);
      setFiltered(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await visitApi.getLocations();
      const raw = response?.data;
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const options = (arr as string[])
        .map((enc: string) => decryptLocation(enc))
        .filter((label: string) => label);
      setCityOptions(options);
    } catch (e) {
      setCityOptions([]);
    }
  };

  const fetchInitiators = async () => {
    try {
      const response = await visitApi.getSalesmanList();
      const raw = response?.data;
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const options = (arr as any[]).map((item: any) => {
        const name = `${item.first_name || ''} ${item.last_name || ''}`.trim();
        return name;
      }).filter((name: string) => name);
      setInitiatorOptions(options);
    } catch (e) {
      setInitiatorOptions([]);
    }
  };

  const fetchSources = () => {
    const options = dropDownData.sourceOfLead as {label: string; value: string}[];
    const sourceList = (options || []).map(opt => opt.label);
    setSourceOptions(sourceList);
  };

  const fetchSectors = () => {
    const sectorList = dropDownData.sector.map(opt => opt.label);
    setSectorOptions(sectorList);
  };

  useEffect(() => {
    fetchLocations();
    fetchInitiators();
    fetchSources();
    fetchSectors();
  }, []);

  const filterData = {
    City: cityOptions,
    Initiator: initiatorOptions,
    Source: sourceOptions,
    Sector: sectorOptions,
  };

  useEffect(() => {
    if (!searchText && Object.keys(appliedFilters).length === 0) {
      setFiltered(rows);
    } else {
      let filteredData = rows;
      
      // Apply search filter
      if (searchText) {
        const term = searchText.toLowerCase();
        filteredData = filteredData.filter(it => {
          const firm = decryptLocation(it.client_firm_name || '').toLowerCase();
          const city = decryptLocation(it.client?.city || '').toLowerCase();
          const visitNo = (it.visit_number != null ? String(it.visit_number) : '').toLowerCase();
          return firm.includes(term) || city.includes(term) || visitNo.includes(term);
        });
      }
      
      // Apply other filters
      if (appliedFilters.City && appliedFilters.City.length > 0) {
        filteredData = filteredData.filter(it => {
          const city = decryptLocation(it.client?.city || '');
          return appliedFilters.City.includes(city);
        });
      }
      
      if (appliedFilters.Initiator && appliedFilters.Initiator.length > 0) {
        filteredData = filteredData.filter(it => {
          const initiator = it.salesperson || '';
          return appliedFilters.Initiator.includes(initiator);
        });
      }
      
      if (appliedFilters.Source && appliedFilters.Source.length > 0) {
        filteredData = filteredData.filter(it => {
          const source = it.client?.source_of_lead || '';
          return appliedFilters.Source.includes(source);
        });
      }
      
      if (appliedFilters.Sector && appliedFilters.Sector.length > 0) {
        filteredData = filteredData.filter(it => {
          const sector = (it.sector ?? it.client?.sector ?? '').toString().trim();
          return appliedFilters.Sector.includes(sector);
        });
      }
      
      setFiltered(filteredData);
    }
  }, [searchText, rows, appliedFilters]);

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB') : 'N/A');

  const normalizeVisitItems = (items: any[]): VisitItem[] => {
    if (!Array.isArray(items)) return [];
    return items.map(rec => {
      if (Array.isArray(rec?.visit) && rec.visit.length > 0) {
        const v0 = rec.visit[0] || {};
        return {
          id: v0.id ?? rec.id,
          visit_date_time: v0.visit_date_time,
          salesperson: v0.salesperson,
          client_firm_name: v0.client_firm_name,
          visit_type: v0.visit_type,
          visit_number: v0.visit_number,
          visit_remark: v0.visit_remark,
          sector: rec.sector ?? null,
          client: {
            id: rec.id,
            source_of_lead: rec.source_of_lead,
            city: rec.city,
            sector: rec.sector ?? null,
          },
        } as VisitItem;
      }
      return {
        id: rec.id,
        visit_date_time: rec.visit_date_time,
        salesperson: rec.salesperson,
        client_firm_name: rec.client_firm_name,
        visit_type: rec.visit_type,
        visit_number: rec.visit_number,
        visit_remark: rec.visit_remark,
        sector: rec.sector ?? null,
        client: rec.client,
      } as VisitItem;
    });
  };

  const VisitCard = React.memo(({item, index}: {item: VisitItem; index: number}) => {
    const firmName = decryptLocation(item.client_firm_name || '');
    const city = decryptLocation(item.client?.city || '');
    const source = item.client?.source_of_lead || 'N/A';
    const sector = (item.sector ?? item.client?.sector ?? '').toString().trim() || 'N/A';
    
    return (
      <View style={styles.card}>
        <Text style={styles.label}>
          <Text style={styles.bold}>ID :</Text> 
          <Text style={styles.value}>{item.id ?? 'N/A'}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>S.no :</Text> 
          <Text style={styles.value}>{index + 1}</Text>
        </Text>
        <Text style={styles.label}>
          <Text style={styles.bold}>Firm Name :</Text> 
          <Text style={styles.value}>{firmName}</Text>
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
          <Text style={styles.bold}>Sector :</Text> 
          <Text style={styles.value}>{sector}</Text>
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
          <View style={styles.badge}><Text style={styles.badgeText}>{filtered.length}</Text></View>
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

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primaryColor} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{padding: 16}}
          ListEmptyComponent={<Text style={styles.empty}>No Visit Details Found</Text>}
          onRefresh={fetchList}
          refreshing={loading}
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


