/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {LeftChevronCircle} from '@assets/Icons';
import {Container, AppBar} from '@components/index';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeNavigatorType, SoftNavigatorType} from '@type/NavigatorTypes';
import {scaleFont} from '@utils/Scale';
import fontWeight from '@constants/FontWeight';
import {Colors, FontWeight} from '@constants/index';
import {TurnoverMethodCard} from '@components/UGRO-TurnoverMethod/TurnoverMethodCard';
import softApi from '@services/api/soft.api';
import Config from 'react-native-config';
import RNFS from 'react-native-fs';
import {Platform} from 'react-native';
import Toast from 'react-native-toast-message';
import {PermissionsAndroid, Linking} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import softSelector from '@store/softsan/soft.selector';
import {getSoftSanctionResult, clearSoftSanctionResult} from '@store/softsan/soft.slice';

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
  const dispatch = useDispatch();
  const {clientId, method, bank, product, clientName} = (route.params || {}) as {
    clientId: string;
    method: string;
    bank: string;
    product?: string;
    clientName?: string;
  };
  
  // Redux selectors
  const softSanctionResult = useSelector(softSelector.getSoftSanctionResult);
  const softSanctionResultLoading = useSelector(softSelector.getSoftSanctionResultLoading);
  const softSanctionResultError = useSelector(softSelector.getSoftSanctionResultError);
  
  const [result, setResult] = useState<any>(null);
  const [currentMethod, setCurrentMethod] = useState<string>('');

  // Indian number formatting with decimal rounding
  const formatIndianNumber = (num: number | string): string => {
    if (num === null || num === undefined) return '';
    const str = typeof num === 'number' ? num.toString() : String(num).replace(/,/g, '');
    if (!/^\d+(\.\d+)?$/.test(str)) return String(num);
    
    // Parse the number and round to 1 decimal place
    const parsedNum = parseFloat(str);
    const roundedNum = Math.round(parsedNum * 10) / 10;
    const roundedStr = roundedNum.toString();
    
    const [intPart, decimalPart] = roundedStr.split('.');
    const reversed = intPart.split('').reverse();
    let formatted = '';
    for (let i = 0; i < reversed.length; i++) {
      if (i === 3 || i === 5 || i === 7 || i === 9) {
        formatted = ',' + formatted;
      }
      formatted = reversed[i] + formatted;
    }
    
    // Only include decimal if it's not .0
    const finalDecimal = decimalPart && decimalPart !== '0' ? decimalPart : '';
    return finalDecimal ? `${formatted}.${finalDecimal}` : formatted;
  };

  // Function to format labels with proper capitalization
  const formatLabel = (label: string): string => {
    // Handle specific labels with custom formatting
    if (label.toLowerCase().includes('projected to for credit period')) {
      return 'Projected TO for Credit Period';
    }
    if (label.toLowerCase().includes('credit period offered')) {
      return 'Credit Period Offered';
    }
    if (label.toLowerCase().includes('existing w/c limits')) {
      return 'Existing W/C Limits';
    }
    if (label.toLowerCase().includes('monthly turnover')) {
      return 'Monthly Turnover';
    }
    if (label.toLowerCase().includes('last 12 m turnover')) {
      return 'Last 12 M Turnover';
    }
    if (label.toLowerCase().includes('projected turnover')) {
      return 'Projected Turnover';
    }
    if (label.toLowerCase().includes('20% of projected to')) {
      return '20% of Projected TO';
    }
    if (label.toLowerCase().includes('final limit')) {
      return 'Final Limit';
    }
    
    // Default: capitalize first letter of each word
    return label.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  useEffect(() => {
    let sanitizedMethod = method || '';
    if (/turnover/i.test(sanitizedMethod)) {
      sanitizedMethod = 'Turnover';
    } else if (/purchase/i.test(sanitizedMethod)) {
      sanitizedMethod = 'Purchase';
    } else if (/wc/i.test(sanitizedMethod)) {
      sanitizedMethod = 'WC(Stock)';
    }
    
    // Clear previous result if method has changed
    if (currentMethod && currentMethod !== sanitizedMethod) {
      dispatch(clearSoftSanctionResult());
      setResult(null);
    }
    
    // Update current method
    setCurrentMethod(sanitizedMethod);
    
    if (clientId && sanitizedMethod && bank) {
      // Clear any existing result first to prevent conflicts
      dispatch(clearSoftSanctionResult());
      dispatch(getSoftSanctionResult({
        clientId,
        method: sanitizedMethod,
        bank
      }));
    }
  }, [clientId, method, bank, currentMethod, dispatch]);

  // Handle Redux result
  useEffect(() => {
    if (softSanctionResult) {
      setResult(softSanctionResult);
    }
  }, [softSanctionResult]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clear the result when component unmounts to prevent stale data
      dispatch(clearSoftSanctionResult());
    };
  }, [dispatch]);

  // Clear Redux state when screen is focused to prevent navigation conflicts
  useFocusEffect(
    useCallback(() => {
      // Clear any existing result when screen is focused
      dispatch(clearSoftSanctionResult());
    }, [dispatch])
  );

  // Use Redux loading and error states
  const loading = softSanctionResultLoading;
  const error = softSanctionResultError;

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


  // Function to generate filename
  const generateFileName = () => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    
    // Clean client name for filename (remove special characters)
    const cleanClientName = (clientName || 'Client').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ');
    const fileName = `${cleanClientName}-${dateStr}.xlsx`;
    
    
    return fileName;
  };

  const handleDownload = async () => {
    try {
      const exportProduct = product || productName;
      let exportMethod = method || methodName;
      let exportBank = bank || bankName;
      
      // Sanitize method to backend-expected tokens
      if (/turnover/i.test(exportMethod)) {
        exportMethod = 'Turnover';
      } else if (/purchase/i.test(exportMethod)) {
        exportMethod = 'Purchase';
      } else if (/wc/i.test(exportMethod)) {
        exportMethod = 'WC(Stock)';
      }
      
      // Debug logging for troubleshooting
      console.log('Download parameters:', {
        clientId,
        exportMethod,
        exportProduct,
        exportBank,
        method,
        product,
        bank,
        methodName,
        productName,
        bankName
      });
      
      if (!clientId || !exportMethod || !exportProduct || ! exportBank) {
        const missingFields = [];
        if (!clientId) missingFields.push('Client ID');
        if (!exportMethod) missingFields.push('Method');
        if (!exportProduct) missingFields.push('Product');
        if (!exportBank) missingFields.push('Bank');
        
        Alert.alert('Error', `Missing required data for export:\n${missingFields.join(', ')}`);
        return;
      }
      
      // Use API function with token authentication
      const {url, headers} = await softApi.softSanctionExportDownload(
        clientId,
        exportMethod,
        exportProduct,
        exportBank,
      );
      
      console.log('Download URL:', url);
      console.log('Download headers:', headers);
      
      const fileName = generateFileName();
      let filePath = '';
      let showPath = '';
      
      if (Platform.OS === 'android') {
        const androidVersion = Number(Platform.Version);
        console.log('Android version:', androidVersion);
        
        // For Android 13+ (API 33+), use MANAGE_EXTERNAL_STORAGE if needed
        if (androidVersion >= 33) {
          // For Android 13+, we might not need explicit permissions for Downloads folder
          filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          showPath = 'Downloads folder';
        } else if (androidVersion <= 29) {
          // For Android 10 and below, request WRITE_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'App needs access to your storage to download the file',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Denied',
              'Storage permission is required to download files. Please enable it in device settings.',
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Open Settings', onPress: () => Linking.openSettings()},
              ],
            );
            return;
          }
          filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          showPath = 'Downloads folder';
        } else {
          // For Android 11-12, try Downloads folder without permission request
          filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          showPath = 'Downloads folder';
        }
      } else {
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        showPath = 'App private folder';
      }

      console.log('Downloading file to:', filePath);
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        headers: headers,  // Include authentication headers
      }).promise;

      console.log('Download result:', downloadResult);

      if (downloadResult.statusCode === 200) {
        Toast.show({
          type: 'success',
          text1: 'Download complete',
          text2: `File "${fileName}" saved to ${showPath}.`,
        });
      } else {
        console.error('Download failed with status:', downloadResult.statusCode);
        Toast.show({
          type: 'error',
          text1: 'Download failed',
          text2:
            `Download failed with status ${downloadResult.statusCode}. If this happens again, please contact the Admin team.`,
        });
      }
    } catch (e) {
      console.error('Download error:', e);
      let errorMsg = 'Unknown error';
      const err: any = e;
      if (err && typeof err === 'object' && 'message' in err) {
        errorMsg = err.message;
        if (err.code) {
          errorMsg += ` (Code: ${err.code})`;
        }
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
      
      console.error('Final error message:', errorMsg);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
        ) : (results || result) ? (
          <View style={styles.dynamicCard}>
            <TouchableOpacity
              style={styles.downloadIconContainer}
              onPress={handleDownload}>
              <Image
                source={require('../../assets/Images/download.png')}
                style={styles.downloadIcon}
              />
            </TouchableOpacity>
            {results ? Object.entries(results).map(([label, value]) => {
              const isNumeric =
                typeof value === 'number' ||
                (typeof value === 'string' && /^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(value));
              const displayValue = isNumeric ? formatIndianNumber(value as any) : String(value);
              return (
                <View key={label} style={styles.resultRow}>
                  <Text>
                    <Text style={styles.resultLabel}>{formatLabel(label)}:</Text>
                    <Text style={styles.resultValue}> {displayValue}</Text>
                  </Text>
                </View>
              );
            }) : (
              <Text style={styles.resultRow}>Data available for download</Text>
            )}
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  downloadIcon: {
    width: 20,
    height: 20,
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
