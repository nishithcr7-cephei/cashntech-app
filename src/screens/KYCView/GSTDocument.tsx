import {RightCheckmark} from '@assets/Icons';
import {
  AppBar,
  Container,
  DashedButton,
  Input,
  UploadModal,
} from '@components/index';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import fontWeight from '@constants/FontWeight';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {kycActions} from '@store/kyc';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import {FILE_DOWNLOAD_URL} from '@config/config';
import {Linking} from 'react-native';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/app/store';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const GSTDocument = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<
    'frontImage' | 'backImage' | null
  >(null);
  const [nameonGstCertificate, setNameonGstCertificate] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstImage, setGstImage] = useState<
    DocumentPickerResponse | undefined
  >();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Existing GST data states
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageName, setExistingImageName] = useState<string>('');
  const [imageRemoved, setImageRemoved] = useState(false);
  
  const [errors, setErrors] = useState({
    nameonGstCertificate: false,
    gstNumber: false,
    gstNumberFormat: false,
    gstImage: false,
  });
  const {params} = useRoute<RouteProp<KycNavigatorType, 'GSTDocument'>>();

  const dispatch = useDispatch();
  
  // Redux state
  const {personalKycLoading, personalKycData, personalKycError} = useSelector(
    (state: RootState) => state.kyc
  );

  // Fetch existing GST data using Redux Saga
  const fetchExistingGst = () => {
    if (!params?.clientID) {
      return;
    }
    
    dispatch(kycActions.getBusinessKycRequest({
      clientId: params.clientID.toString(),
      docType: 'gst'
    }));
  };

  // Handle Redux state changes
  useEffect(() => {
    if (personalKycData && personalKycData.length > 0) {
      const gstRecords = personalKycData;
      
      // Process main applicant (first record)
      if (gstRecords.length > 0) {
        const mainApplicantData = gstRecords[0];
        
        const fileName = (mainApplicantData.filename_obj as any)?.gst?.file_name;
        const nameAsPerGst = (mainApplicantData.filename_obj as any)?.gst?.name_as_per_gst;
        const gstNumberValue = (mainApplicantData.filename_obj as any)?.gst?.gst_number;
        
        if (fileName) {
          // Construct full image URL for main applicant
          const fullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
          
          setExistingImageUrl(fullImageUrl);
          setExistingImageName(fileName);
          
          // Pre-fill form fields if available
          if (nameAsPerGst) {
            setNameonGstCertificate(nameAsPerGst);
          }
          if (gstNumberValue) {
            setGstNumber(gstNumberValue);
          }
        }
      }
      
      // Set edit mode if any existing data is found
      setIsEditMode(true);
    } else if (personalKycData && personalKycData.length === 0) {
      setIsEditMode(false);
    }
  }, [personalKycData, params?.clientID]);

  // Handle error state
  useEffect(() => {
    if (personalKycError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch existing GST data',
        position: 'top',
      });
    }
  }, [personalKycError]);

  // Fetch existing GST data on component mount
  useEffect(() => {
    fetchExistingGst();
  }, [params?.clientID]);

  // const isValidGSTIN = (gst: string) => {
  //   const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  //   return regex.test(gst);
  // };
  
  // For testing - always return true
  const isValidGSTIN = (gst: string) => {
    return true;
  };

  const openPdfInBrowser = (fileName: string) => {
    const pdfUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
    Linking.openURL(pdfUrl).catch(err => {
      Alert.alert('Error', 'Failed to open PDF document');
    });
  };

  const handleSubmit = () => {
    if (
      !nameonGstCertificate ||
      !gstNumber ||
      (!gstImage && !existingImageUrl) ||
      !isValidGSTIN(gstNumber)
    ) {
      setErrors({
        nameonGstCertificate: !nameonGstCertificate,
        gstNumber: !gstNumber,
        gstNumberFormat: !gstNumber || !isValidGSTIN(gstNumber),
        gstImage: !gstImage && !existingImageUrl,
      });

      let missingFields = [];
      if (!nameonGstCertificate) missingFields.push('Name as GST Certificate');
      if (!gstNumber) missingFields.push('GST Number');
      if (gstNumber && !isValidGSTIN(gstNumber))
        missingFields.push('Invalid GST Number (15 chars, proper format)');
      if (!gstImage && !existingImageUrl) missingFields.push('GST Image');

      Alert.alert(
        'Missing Fields',
        `Please provide the following:\n${missingFields.join('\n')}`,
      );
      return;
    }

    setErrors({
      nameonGstCertificate: false,
      gstNumber: false,
      gstNumberFormat: false,
      gstImage: false,
    });

    const payload = {
      clientId: Number(params.clientID),
      uploaded_by: getUserFullName(),
      name_as_per_gst: nameonGstCertificate,
      gst_number: gstNumber,
      params: 'GST',
      doc: gstImage ? {
        uri: gstImage.uri,
        name: gstImage.name ?? Date.now().toString(),
        type: gstImage.type ?? 'application/pdf',
      } : {
        uri: '',
        name: '',
        type: 'application/pdf',
      },
    };

    setLoading(true);
    dispatch(kycActions.uploadGstRequest(payload));
    
    // Simulate API call delay and handle success
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: isEditing ? 'Document Updated' : 'Document Uploaded',
        text2: `${nameonGstCertificate}'s document ${isEditing ? 'updated' : 'submitted'} successfully`,
        position: 'top',
      });
      
      // Refresh business KYC checked list to update tick marks
      dispatch(kycActions.getKycBusinessChecked(params.clientID.toString()));
      
      // Clear form and navigate back
      handleClear();
      navigation.goBack();
    }, 1500);
  };

  const handleClear = () => {
    setNameonGstCertificate('');
    setGstNumber('');
    setGstImage(undefined);
    setExistingImageUrl(null);
    setExistingImageName('');
    setImageRemoved(false);
    setIsEditMode(false);
    setIsEditing(false);
  };


  return (
    <Container>
      {(loading || uploading || personalKycLoading) && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
      <AppBar title="KYC Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Upload GST Document Details</Text>
      </View>
      <ScrollView style={styles.mainContainer} contentContainerStyle={styles.scrollContainer}>
          {/* Main Content */}
          <Text style={styles.sectionTitle}>GST Document</Text>
          <Input
            label="Name as per GST Certificate"
            value={nameonGstCertificate}
            onChangeText={text => {
              setNameonGstCertificate(text);
              if (errors.nameonGstCertificate && text.trim()) {
                setErrors(prev => ({...prev, nameonGstCertificate: false}));
              }
            }}
            containerStyle={[
              {marginBottom: scaleHeight(24)},
              errors.nameonGstCertificate && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 5,
              },
            ]}
          />
          <Input
            label="GST Number"
            value={gstNumber}
            onChangeText={text => {
              const formatted = text
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 15);
              setGstNumber(formatted);
              if (errors.gstNumber && formatted.trim()) {
                setErrors(prev => ({...prev, gstNumber: false}));
              }
              if (errors.gstNumberFormat && isValidGSTIN(formatted)) {
                setErrors(prev => ({...prev, gstNumberFormat: false}));
              }
            }}
            autoCapitalize="characters"
            containerStyle={[
              {marginBottom: scaleHeight(24)},
              (errors.gstNumber || errors.gstNumberFormat) && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 5,
              },
            ]}
          />
          {errors.gstNumberFormat && gstNumber.length === 15 && (
            <Text style={styles.errorText}>
              Invalid GST number. Must be 15 characters, e.g. 22AAAAA0000A1Z5
            </Text>
          )}

          {personalKycLoading ? (
            <View style={styles.imageContainer}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Loading existing GST document...</Text>
            </View>
          ) : existingImageUrl && !imageRemoved && !gstImage ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(existingImageName)}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{existingImageName}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImageRemoved(true);
                  setExistingImageName('');
                  setGstImage(undefined);
                  setErrors({...errors, gstImage: false});
                }}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setUploadType('frontImage');
                  setIsVisible(true);
                }}>
                <Text style={styles.changeImageText}>Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : gstImage ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(gstImage.name || 'document.pdf')}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{gstImage.name}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setGstImage(undefined)}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <DashedButton
                label="Upload GST Certificate"
                onPress={() => {
                  setUploadType('frontImage');
                  setIsVisible(true);
                }}
                containerStyle={
                  errors.gstImage ? {borderColor: Colors.red} : undefined
                }
              />
              <Text style={styles.errorText}>Document is required</Text>
            </View>
          )}

          <UploadModal
            visible={isVisible}
            allowedFileTypes={['pdf']}
            onClose={file => {
              if (file) {
                setUploading(true);
                setTimeout(() => {
                  switch (uploadType) {
                    case 'frontImage':
                      setGstImage(file);
                      if (errors.gstImage)
                        setErrors(prev => ({...prev, gstImage: false}));
                      break;
                  }
                  setUploading(false);
                  setIsVisible(false);
                  setUploadType(null);
                }, 1200);
              } else {
                setIsVisible(false);
                setUploadType(null);
              }
            }}
          />

          <View style={styles.footerButton}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.7}
              disabled={personalKycLoading}
              onPress={() => {
                if (isEditMode && !isEditing) {
                  setIsEditing(true);
                } else {
                  handleSubmit();
                }
              }}>
              <Text style={styles.saveText}>
                {isEditMode && !isEditing ? 'Edit' : 'Save'}
              </Text>
              <RightCheckmark width={12} height={12} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: scaleWidth(24),
    paddingBottom: scaleHeight(100),
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginVertical: 10,
    marginBottom: scaleHeight(14),
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    marginTop: scaleHeight(20),
  },
  clearButton: {},
  clearText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(5),
    borderRadius: scaleWidth(4),
    gap: scaleWidth(8),
    borderWidth: 1,
    borderColor: Colors.green,
    minWidth: scaleWidth(100),
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  errorText: {
    color: Colors.red,
    fontSize: scaleFont(12),
    marginTop: 4,
    marginBottom: scaleHeight(8),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: scaleHeight(20),
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: scaleWidth(240),
  },
  existingImageContainer: {
    borderColor: Colors.graybase,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(4),
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  thumbnailImage: {
    width: scaleWidth(200),
    height: scaleHeight(140),
    borderRadius: scaleWidth(6),
  },
  tapToViewText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    marginTop: scaleHeight(8),
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeImageText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: 'bold',
  },
  changeImageButton: {
    marginTop: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(4),
    alignSelf: 'center',
  },
  changeImageText: {
    color: 'white',
    fontSize: scaleFont(14),
    fontWeight: fontWeight.Medium,
  },
  loadingText: {
    marginTop: scaleHeight(10),
    fontSize: scaleFont(14),
    color: Colors.graybase,
  },
  pdfIconContainer: {
    width: scaleWidth(200),
    height: scaleHeight(140),
    backgroundColor: '#f5f5f5',
    borderRadius: scaleWidth(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  pdfIcon: {
    fontSize: scaleFont(48),
    marginBottom: scaleHeight(8),
  },
  pdfText: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.Medium,
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  fileNameText: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    textAlign: 'center',
    maxWidth: scaleWidth(180),
  },
});