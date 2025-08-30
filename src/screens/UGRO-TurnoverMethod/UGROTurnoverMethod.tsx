/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  Linking,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {LeftChevronCircle} from '@assets/Icons';
import {Container, AppBar} from '@components/index';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {scaleFont} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';
import {Colors, FontWeight} from '@constants/index';
import {TurnoverMethodCard} from '@components/UGRO-TurnoverMethod/TurnoverMethodCard';
import clientApi from '@services/api/client.api';
import Config from 'react-native-config';
import RNFS from 'react-native-fs';
import {Platform} from 'react-native';
import Toast from 'react-native-toast-message';
import {PermissionsAndroid} from 'react-native';

type SoftInfoNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<SoftNavigatorType>
>;

type TurnoverMethod = {
  monthlyTurnover: string;
  last12MTurnover: string;
  projectedTurnover: string;
  creditPeriodOffered: string;
  projectedTO: string;
  projectedTOforCreditPeriod: string;
  existingWCLimits: string;
  finalLimit: string;
  actualEligibility: string;
  eligibilityasperTenor: string;
};

export const UGROTurnoverMethod = () => {
  const navigation = useNavigation<SoftInfoNavigationType>();
  const route = useRoute();
  const {clientId, method, bank, product} = (route.params || {}) as {
    clientId: string;
    method: string;
    bank: string;
    product?: string;
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    let sanitizedMethod = method || '';
    if (/turnover/i.test(sanitizedMethod)) {
      sanitizedMethod = 'Turnover';
    } else if (/purchase/i.test(sanitizedMethod)) {
      sanitizedMethod = 'Purchase';
    } else if (/wc/i.test(sanitizedMethod)) {
      sanitizedMethod = 'WC(Stock)';
    }
    const apiUrl = `/client-info-master/soft-sanction/result/${clientId}?method=${encodeURIComponent(
      sanitizedMethod,
    )}&bank=${encodeURIComponent(bank || '')}`;
    Alert.alert(
      'API Debug',
      `Client ID: ${clientId}\nmethod: ${sanitizedMethod}\nbank: ${bank}\nURL: ${apiUrl}`,
    );
    if (clientId && sanitizedMethod && bank) {
      setLoading(true);
      setError(null);
      clientApi
        .softSanctionResult(clientId, sanitizedMethod, bank)
        .then(res => {
          setResult(res.data);
          setLoading(false);
        })
        .catch(e => {
          setError('Failed to fetch result');
          setLoading(false);
        });
    }
  }, [clientId, method, bank]);

  let leads: TurnoverMethod[] = [];
  if (result && Array.isArray(result)) {
    leads = result.map((item: any) => ({
      monthlyTurnover: item.monthlyTurnover || '',
      last12MTurnover: item.last12MTurnover || '',
      projectedTurnover: item.projectedTurnover || '',
      creditPeriodOffered: item.creditPeriodOffered || '',
      projectedTO: item.projectedTO || '',
      projectedTOforCreditPeriod: item.projectedTOforCreditPeriod || '',
      existingWCLimits: item.existingWCLimits || '',
      finalLimit: item.finalLimit || '',
      actualEligibility: item.actualEligibility || '',
      eligibilityasperTenor: item.eligibilityasperTenor || '',
    }));
  }

  let results: Record<string, string> | null = null;
  if (result && result.data && result.data.results) {
    results = result.data.results;
  }

  let bankName = '',
    methodName = '',
    productName = '';
  if (result && result.data) {
    bankName = result.data.bank_name || '';
    methodName = result.data.method_name || '';
    productName = result.data.product_name || '';
  }

  const handleDownload = async () => {
    try {
      const exportProduct = product || productName;
      const exportMethod = method || methodName;
      if (!clientId || !exportMethod || !exportProduct) {
        Alert.alert('Error', 'Missing clientId, method, or product for export');
        return;
      }
      
      // Use API function with token authentication
      const {url, headers} = await clientApi.softSanctionExportDownload(
        clientId, 
        exportMethod, 
        exportProduct
      );
      
      let filePath = '';
      let showPath = '';
      if (Platform.OS === 'android') {
        filePath = `${RNFS.DownloadDirectoryPath}/dummy-test.pdf`;
        showPath = 'Downloads folder';
        const androidVersion = Number(Platform.Version);
        if (androidVersion <= 29) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'App needs access to your storage to download the file',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Denied',
              'Storage permission is required to download files.',
            );
            return;
          }
        }
      } else {
        filePath = `${RNFS.DocumentDirectoryPath}/dummy-test.pdf`;
        showPath = 'App private folder';
      }

      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        headers: headers,  // Include authentication headers
      }).promise;

      if (downloadResult.statusCode === 200) {
        Toast.show({
          type: 'success',
          text1: 'Download complete',
          text2: `File saved to ${showPath}.`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Download failed',
          text2:
            'Download failed. If this happens again, please contact the Admin team.',
        });
      }
    } catch (e) {
      let errorMsg = 'Unknown error';
      const err: any = e;
      if (err && typeof err === 'object' && 'message' in err) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else if (err && err.toString) {
        errorMsg = err.toString();
      }
      if (!errorMsg || errorMsg === 'Unknown error') {
        try {
          errorMsg = JSON.stringify(e);
        } catch (jsonErr) {
          errorMsg = 'Uncatchable error';
        }
      }
      Alert.alert('Download Error', errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Download failed',
        text2:
          'Download failed. If this happens again, please contact the Admin team.',
      });
    }
  };

  return (
    <Container>
      <AppBar title="Soft Sanction" navigation={navigation} />

      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Soft Sanction</Text>
      </View>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={navigation.goBack}>
          <LeftChevronCircle height={20} width={20} />
        </TouchableOpacity>
        {(bankName || methodName || productName) && (
          <Text
            style={styles.dynamicSummary}
            numberOfLines={1}
            ellipsizeMode="tail">
            {bankName ? `${bankName} ` : ''}
            {bankName && methodName ? ', ' : ''}
            {methodName ? `${methodName} ` : ''}
            {(bankName || methodName) && productName ? ', ' : ''}
            {productName ? `${productName} ` : ''}
          </Text>
        )}
      </View>
      <View style={styles.container}>
        {loading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text style={{color: 'red'}}>{error}</Text>
        ) : results ? (
          <View style={styles.dynamicCard}>
            <TouchableOpacity
              style={styles.downloadIconContainer}
              onPress={handleDownload}>
              <Image
                source={require('../../assets/Images/download.png')}
                style={styles.downloadIcon}
              />
            </TouchableOpacity>
            {Object.entries(results).map(([label, value]) => (
              <View key={label} style={styles.resultRow}>
                <Text>
                  <Text style={styles.resultLabel}>{label}:</Text>
                  <Text style={styles.resultValue}> {value}</Text>
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text>No results found.</Text>
        )}
      </View>
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
  Content: {
    margin: 15,
    flexDirection: 'row',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    marginBottom: 0,
  },
  backBtn: {
    marginRight: 10,
  },
  contentText: {
    fontSize: scaleFont(16),
    fontWeight: FontWeight.SemiBold,
  },
  container: {
    padding: 16,
    flex: 1,
  },
  dynamicCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderColor: '#eee',
    borderWidth: 1,
    position: 'relative',
  },
  downloadIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  downloadIcon: {
    width: 24,
    height: 24,
    tintColor: '#888',
  },
  resultRow: {
    marginBottom: 6,
  },
  resultLabel: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: scaleFont(15),
  },
  resultValue: {
    color: '#555',
    fontWeight: 'normal',
    fontSize: scaleFont(15),
  },
  infoText: {
    fontSize: scaleFont(15),
    color: '#222',
    marginBottom: 2,
    fontWeight: '600',
  },
  infoLine: {
    fontSize: scaleFont(15),
    color: '#222',
    fontWeight: '600',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  dynamicSummary: {
    fontSize: scaleFont(16),
    color: '#222',
    fontWeight: 'bold',
    flexShrink: 1,
    lineHeight: 22,
    textAlign: 'center',
  },
});
