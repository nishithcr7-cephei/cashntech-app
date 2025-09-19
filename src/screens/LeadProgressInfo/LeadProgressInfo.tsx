import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import { ILeadProgressResponseDatum, LeadProgress } from '@store/lead';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {API_URL} from '@config/config';
import {useDispatch, useSelector} from 'react-redux';
import {leadSelector} from '@store/lead';
import {decryptConditionally} from '@utils/crypto';
import { useRoute, useNavigation } from '@react-navigation/native';
import leadApi from '@services/api/lead.api';
import { Container, AppBar } from '@components/index';
import { LeftChevron } from '@assets/Icons';

interface StatusItem {
  status: string;
  date: string;
  remark: string;
  tat: string;
}

interface LeadProgressInfoProps {
  data?: ILeadProgressResponseDatum | null;
  progressStatusData?: LeadProgress[];
  onPressReadLess?: () => void;
}

export const LeadProgressInfo = ({ data, progressStatusData, onPressReadLess }: LeadProgressInfoProps) => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { clientId } = route.params as { clientId: string | number };

  const [progressData, setProgressData] = useState<LeadProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (progressStatusData && progressStatusData.length > 0) {
      // Use passed data if available, sort by ID ascending (12, 13, 14)
      const sortedData = [...progressStatusData].sort((a, b) => a.id - b.id);
      setProgressData(sortedData);
      setLoading(false);
    } else {
      // Otherwise fetch from API
      leadApi.getLeadDesProgress(clientId.toString()).then(({ data, error }) => {
        if (!error && data) {
          // Sort by ID ascending (12, 13, 14)
          const sortedData = [...(data.data ?? [])].sort((a, b) => a.id - b.id);
          setProgressData(sortedData);
        } else {
          setError('Failed to fetch lead progress data');
        }
        setLoading(false);
      });
    }
  }, [clientId, progressStatusData]);

  

 

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const renderProgressCard = (item: LeadProgress, index: number) => (
    <View key={item.id} style={styles.progressCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.statusText}>{item.lead_progress_status}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.current_status === 'Completed' ? '#4CAF50' : '#FF9800' }
        ]}>
          <Text style={styles.statusBadgeText}>{item.current_status}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(item.completed_at || item.created_at)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Remark:</Text>
          <Text style={styles.value}>{item.remark || '-'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>TAT:</Text>
          <Text style={styles.value}>{item.turn_around_time}</Text>
        </View>
        
        {item.done_by && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Done By:</Text>
            <Text style={styles.value}>{item.done_by}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <Container>
        <AppBar 
          title="Lead Progress Status" 
          navigation={navigation}
          renderLeftIcon={<LeftChevron height={20} width={20} />}
          onPressLeftIcon={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <AppBar 
          title="Lead Progress Status" 
          navigation={navigation}
          renderLeftIcon={<LeftChevron height={20} width={20} />}
          onPressLeftIcon={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <AppBar 
        title="Lead Progress Status" 
        navigation={navigation}
        renderLeftIcon={<LeftChevron height={20} width={20} />}
        onPressLeftIcon={() => navigation.goBack()}
      />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Total Turnaround Time / Lead Time</Text>
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {progressData.map((item, index) => renderProgressCard(item, index))}
        </View>
      </ScrollView>
    </Container>
  );
};
const styles = StyleSheet.create({
  Subcontainer: {
    backgroundColor: '#fff',
  },
  Subheader: {
    width: '100%',
    padding: 16,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    backgroundColor: Colors.LimeGray,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.LimeGray,
  },
  listContainer: {
    padding: 16,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusBadgeText: {
    fontSize: scaleFont(12),
    fontWeight: fontWeight.SemiBold,
    color: '#fff',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: scaleFont(14),
    fontWeight: fontWeight.SemiBold,
    color: '#333',
    width: 80,
    marginRight: 8,
  },
  value: {
    fontSize: scaleFont(14),
    color: '#666',
    flex: 1,
    flexWrap: 'wrap',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: scaleFont(14),
    color: '#FF0000',
    textAlign: 'center',
  },
});

