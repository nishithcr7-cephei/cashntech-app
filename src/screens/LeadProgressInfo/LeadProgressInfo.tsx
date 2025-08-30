import Colors from '@constants/Colors';
import fontWeight from '@constants/FontWeight';
import { ILeadProgressResponseDatum } from '@store/client';
import {scaleFont, scaleHeight} from '@utils/Scale';
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
import {clientActions, clientSelector} from '@store/client';
import {decryptConditionally} from '@utils/crypto';
import { useRoute, useNavigation } from '@react-navigation/native';
import clientApi from '@services/api/client.api';
import { Container, AppBar } from '@components/index';

interface StatusItem {
  status: string;
  date: string;
  remark: string;
  tat: string;
}

export const LeadProgressInfo = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { clientId } = route.params as { clientId: string | number };

  const [progressData, setProgressData] = useState<ILeadProgressResponseDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientApi.getLeadDesProgress(clientId.toString()).then(({ data, error }) => {
      if (!error && data) {
        setProgressData(data.data ?? []);
      } else {
        setError('Failed to fetch lead progress data');
      }
      setLoading(false);
    });
  }, [clientId]);

  

 

  return (
    <Container>
      <AppBar title="Lead Progress Info" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Lead Progress Status</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          {/* All Basic Details */}
          <Text style={styles.label}>
            <Text style={styles.bold}>Status :</Text> {progressData[0]?.lead_progress_status ?? 'N/A'}
          </Text>
          <Text style={styles.label}>
            <Text style={styles.bold}>Date :</Text> {progressData[0]?.created_at ? new Date(progressData[0].created_at).toLocaleDateString('en-GB') : 'N/A'}
          </Text>
          <Text style={styles.label}>
            <Text style={styles.bold}>Current Status :</Text> {progressData[0]?.current_status ?? 'N/A'}
          </Text>
          <Text style={styles.label}>
            <Text style={styles.bold}>Remark :</Text> {progressData[0]?.remark ?? 'N/A'}
          </Text>
          <Text style={styles.label}>
            <Text style={styles.bold}>TAT :</Text> {progressData[0]?.turn_around_time ?? 'N/A'}
          </Text>
        </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Add Progress Status</Text>
       
      </View>
      <TouchableOpacity style={styles.readMoreButton} onPress={() => navigation.goBack()}>
        <Text style={styles.readMoreText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
    </Container>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.LimeGray,
  },
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
    marginTop: scaleHeight(10),
    padding: 16,
    backgroundColor: Colors.LimeGray,
    paddingBottom: 40,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#FFC107',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  tagText: {
    color: '#000',
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c00',
    marginBottom: 8,
  },
  label: {
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  statusBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  readMoreButton: {
    position: 'absolute',
    bottom: 15,
    right: 10,
  },
  readMoreText: {
    color: Colors.tertiaryBlue,
    textDecorationLine: 'underline',
    fontWeight: fontWeight.SemiBold,
  },
});

