import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Container, AppBar} from '@components/index';
import {LeftChevron} from '@assets/Icons';
import Colors from '@constants/Colors';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import FontWeight from '@constants/FontWeight';
import {decryptLocation} from '@utils/crypto';
import {
  getVisitDetailsListRequest,
} from '@store/visit/visit.slice';
import {
  selectVisitDetailsLoading,
} from '@store/visit/visit.selector';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, DocNavigatorType} from '@type/NavigatorTypes';

type DocNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<DocNavigatorType>
>;

interface SubVisitDetailRouteParams {
  clientId: string;
  clientName: string;
  visitData: {
    id: number;
    source_of_lead: string;
    city: string;
    sector: string | null;
    created_at: string;
    visit: any[];
  };
}

interface SubVisitItem {
  id: number;
  visit_date_time: string;
  salesperson: string;
  client_firm_name: string;
  visit_type: string;
  visit_number: number | null;
  visit_remark: string | null;
  client: number;
}

export const SubVisitDetail = () => {
  const navigation = useNavigation<DocNavigationType>();
  const route = useRoute();
  const dispatch = useDispatch();
  const {clientId, clientName, visitData} = route.params as SubVisitDetailRouteParams;

  // Redux selectors
  const visitDetailsLoading = useSelector(selectVisitDetailsLoading);

  // Get the specific client's visit data
  const clientVisitData = useMemo(() => {
    if (!visitData || !visitData.visit) return null;
    
    // Sort visits by visit_date_time (newest first) and exclude the first one (which is shown in main list)
    const sortedVisits = [...visitData.visit]
      .sort((a, b) => {
        const dateA = a.visit_date_time ? new Date(a.visit_date_time).getTime() : 0;
        const dateB = b.visit_date_time ? new Date(b.visit_date_time).getTime() : 0;
        return dateB - dateA;
      })
      .slice(1); // Remove the first visit (latest one shown in main list)
    
    return {
      ...visitData,
      visit: sortedVisits
    };
  }, [visitData]);

  const fetchVisitDetails = () => {
    dispatch(getVisitDetailsListRequest());
  };

  useEffect(() => {
    fetchVisitDetails();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // Go back to previous screen (VisitDetail) without re-mounting
      navigation.goBack();
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB') : 'N/A');
  
  const formatCreatedAt = (iso?: string) => {
    if (!iso) return 'N/A';
    const date = new Date(iso);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const VisitCard = React.memo(({item, index}: {item: SubVisitItem; index: number}) => {
    const firmName = decryptLocation(item.client_firm_name || '');
    const city = decryptLocation(visitData.city || '');
    const source = visitData.source_of_lead || 'N/A';
    const sector = visitData.sector || 'N/A';
    
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
          <Text style={styles.value}>{formatCreatedAt(visitData.created_at)}</Text>
        </Text>
      </View>
    );
  });

  const renderSubVisitItem = ({item, index}: {item: SubVisitItem; index: number}) => {
    return (
      <TouchableOpacity
        onPress={() => {
          // Navigate to UpdateVisitDetails for individual visit update
          (navigation as any).navigate('UpdateVisitDetails', {
            visitId: String(item.id),
            visit_date_time: item.visit_date_time,
            salesperson: item.salesperson,
            client_firm_name: item.client_firm_name,
            visit_type: item.visit_type,
            visit_number: item.visit_number,
            visit_remark: item.visit_remark,
          });
        }}>
        <VisitCard item={item} index={index} />
      </TouchableOpacity>
    );
  };

  const subVisits = clientVisitData?.visit || [];

  return (
    <Container>
      <AppBar 
        title="Sub Visit Detail" 
        navigation={navigation as any}
        renderLeftIcon={<LeftChevron height={20} width={20} />}
        onPressLeftIcon={() => {
          // Go back to previous screen (VisitDetail) without re-mounting
          navigation.goBack();
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.clientName}>{clientName}</Text>
        <Text style={styles.subVisitCount}>
          {subVisits.length} Sub Visit{subVisits.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {visitDetailsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={subVisits as SubVisitItem[]}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={renderSubVisitItem}
          contentContainerStyle={{padding: 16}}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Sub Visits Found</Text>
              <Text style={styles.emptySubText}>
                This client doesn't have any additional visits beyond the main visit.
              </Text>
            </View>
          }
          onRefresh={fetchVisitDetails}
          refreshing={visitDetailsLoading}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  clientName: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  subVisitCount: {
    fontSize: scaleFont(14),
    color: Colors.SteelGray,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 50 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: { 
    textAlign: 'center', 
    color: Colors.SteelGray, 
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    color: Colors.SteelGray,
    fontSize: scaleFont(14),
    opacity: 0.7,
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
});

export default SubVisitDetail;
