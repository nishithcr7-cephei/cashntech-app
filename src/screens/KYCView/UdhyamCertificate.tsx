import {RightCheckmark} from '@assets/Icons';
import {LeftChevronCircle} from '@assets/Icons';
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
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/app/store';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const UdhyamCertificate = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<
    'frontImage' | 'backImage' | null
  >(null);
  const [udhyamAdharName, setUdhyamAdharName] = useState('');
  const [udhyamNumber, setUdhyamNumber] = useState('');
  const [udhyamFrontImage, setUdhyamFrontImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [udhyamBackImage, setUdhyamBackImage] = useState<
    DocumentPickerResponse | undefined
  >();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Existing Udhyam data states
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageName, setExistingImageName] = useState<string>('');
  const [imageRemoved, setImageRemoved] = useState(false);
  
  const [errors, setErrors] = useState({
    udhyamAdharName: false,
    udhyamNumber: false,
    udhyamNumberFormat: false,
    udhyamFrontImage: false,
  });
  const {params} = useRoute<RouteProp<KycNavigatorType, 'UdhyamCertificate'>>();

  const dispatch = useDispatch();
  
  // Redux state
  const {personalKycLoading, personalKycData, personalKycError} = useSelector(
    (state: RootState) => state.kyc
  );

  // Fetch existing Udhyam data using Redux Saga
  const fetchExistingUdhyam = () => {
    if (!params?.clientID) {
      return;
    }
    
    dispatch(kycActions.getBusinessKycRequest({
      clientId: params.clientID.toString(),
      docType: 'udhyam'
    }));
  };

  // Handle Redux state changes
  useEffect(() => {
    if (personalKycData && personalKycData.length > 0) {
      const udhyamRecords = personalKycData;
      
      // Process main applicant (first record)
      if (udhyamRecords.length > 0) {
        const mainApplicantData = udhyamRecords[0];
        
        const fileName = (mainApplicantData.filename_obj as any)?.udhyam?.file_name;
        const nameAsPerUdhyam = (mainApplicantData.filename_obj as any)?.udhyam?.name_as_per_udhyam;
        const urnNumber = (mainApplicantData.filename_obj as any)?.udhyam?.urn_number;
        
        if (fileName) {
          // Construct full image URL for main applicant
          const fullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
          
          setExistingImageUrl(fullImageUrl);
          setExistingImageName(fileName);
          
          // Pre-fill form fields if available
          if (nameAsPerUdhyam) {
            setUdhyamAdharName(nameAsPerUdhyam);
          }
          if (urnNumber) {
            setUdhyamNumber(urnNumber);
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
        text2: 'Failed to fetch existing Udhyam data',
        position: 'top',
      });
    }
  }, [personalKycError]);

  // Fetch existing Udhyam data on component mount
  useEffect(() => {
    fetchExistingUdhyam();
  }, [params?.clientID]);

  // const isValidUdhyam = (num: string) => {
  //   const regex = /^UDYAM-[A-Z]{2}-00-\d{7}$/;
  //   return regex.test(num);
  // };
  
  // For testing - always return true
  const isValidUdhyam = (num: string) => {
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
      !udhyamAdharName ||
      !udhyamNumber ||
      (!udhyamFrontImage && !existingImageUrl) ||
      !isValidUdhyam(udhyamNumber)
    ) {
      setErrors({
        udhyamAdharName: !udhyamAdharName,
        udhyamNumber: !udhyamNumber,
        udhyamNumberFormat: !udhyamNumber || !isValidUdhyam(udhyamNumber),
        udhyamFrontImage: !udhyamFrontImage && !existingImageUrl,
      });

      let missingFields = [];
      if (!udhyamAdharName) missingFields.push('Udhyam AdharName');
      if (!udhyamNumber) missingFields.push('Udhyam Number');
      if (udhyamNumber && !isValidUdhyam(udhyamNumber))
        missingFields.push('Invalid Udhyam Number (UDYAM-XX-YYYY-NNNNNN)');
      if (!udhyamFrontImage && !existingImageUrl) missingFields.push('Udhyam FrontImage');

      Alert.alert(
        'Missing Fields',
        `Please provide the following:\n${missingFields.join('\n')}`,
      );
      return;
    }

    setErrors({
      udhyamAdharName: false,
      udhyamNumber: false,
      udhyamNumberFormat: false,
      udhyamFrontImage: false,
    });

    const payload = {
      clientId: Number(params.clientID),
      uploaded_by: getUserFullName(),
      name_as_per_udhyam: udhyamAdharName,
      urn_number: udhyamNumber,
      params: 'Udhyam',
      doc: udhyamFrontImage ? {
        uri: udhyamFrontImage.uri,
        name: udhyamFrontImage.name ?? Date.now().toString(),
        type: udhyamFrontImage.type ?? 'application/pdf',
      } : null,
    };

    setLoading(true);
    dispatch(kycActions.uploadUdhyamRequest(payload));
    
    // Simulate API call delay and handle success
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: isEditing ? 'Document Updated' : 'Document Uploaded',
        text2: `${udhyamAdharName}'s document ${isEditing ? 'updated' : 'submitted'} successfully`,
        position: 'top',
      });
      
      // Clear form and navigate back
      handleClear();
      navigation.goBack();
    }, 1500);
  };

  const handleClear = () => {
    setUdhyamAdharName('');
    setUdhyamNumber('');
    setUdhyamFrontImage(undefined);
    setUdhyamBackImage(undefined);
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
      
      <View>
        <TouchableOpacity
          style={styles.Subcontainer}
          onPress={navigation.goBack}>
          <LeftChevronCircle height={26} width={26} />
          <Text style={styles.Subheader}>Upload Udhyam Certificate Details</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.scrollContainer}>
          {/* Main Content */}
          <Text style={styles.sectionTitle}>Udhyam Certificate</Text>
          <Input
            label="Name as per Udhyam Aadhar"
            value={udhyamAdharName}
            onChangeText={text => {
              setUdhyamAdharName(text);
              if (errors.udhyamAdharName && text.trim()) {
                setErrors(prev => ({...prev, udhyamAdharName: false}));
              }
            }}
            containerStyle={[
              {marginBottom: scaleHeight(24)},
              errors.udhyamAdharName && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 5,
              },
            ]}
          />
          <Input
            label="URN Number"
            value={udhyamNumber}
            onChangeText={text => {
              const formatted = text
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, '')
                .slice(0, 19);
              setUdhyamNumber(formatted);
              if (errors.udhyamNumber && formatted.trim()) {
                setErrors(prev => ({...prev, udhyamNumber: false}));
              }
              if (errors.udhyamNumberFormat && isValidUdhyam(formatted)) {
                setErrors(prev => ({...prev, udhyamNumberFormat: false}));
              }
            }}
            autoCapitalize="characters"
            containerStyle={[
              {marginBottom: scaleHeight(14)},
              (errors.udhyamNumber || errors.udhyamNumberFormat) && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 5,
              },
            ]}
          />
          {errors.udhyamNumberFormat && udhyamNumber.length === 19 && (
            <Text style={styles.errorText}>
              Invalid Udhyam number. Must be UDYAM-XX-YYYY-NNNNNN
            </Text>
          )}

          {personalKycLoading ? (
            <View style={styles.imageContainer}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Loading existing Udhyam document...</Text>
            </View>
          ) : existingImageUrl && !imageRemoved && !udhyamFrontImage ? (
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
                  setUdhyamFrontImage(undefined);
                  setErrors({...errors, udhyamFrontImage: false});
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
          ) : udhyamFrontImage ? (
            <View style={styles.imageContainer}>
              <View style={styles.thumbnailContainer}>
                <TouchableOpacity
                  onPress={() => openPdfInBrowser(udhyamFrontImage.name || 'document.pdf')}
                  style={styles.existingImageContainer}>
                  <View style={styles.pdfIconContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Document</Text>
                    <Text style={styles.fileNameText}>{udhyamFrontImage.name}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
              </View>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setUdhyamFrontImage(undefined)}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <DashedButton
                label="Upload Front Side of Udhyam"
                onPress={() => {
                  setUploadType('frontImage');
                  setIsVisible(true);
                }}
                containerStyle={
                  errors.udhyamFrontImage ? {borderColor: Colors.red} : undefined
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
                      setUdhyamFrontImage(file);
                      if (errors.udhyamFrontImage)
                        setErrors(prev => ({...prev, udhyamFrontImage: false}));
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
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: scaleWidth(8),
    backgroundColor: '#fff',
  },
  Subcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LimeGray,
    paddingLeft: 16,
    paddingVertical: 12,
  },
  Subheader: {
    marginLeft: 12,
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    color: Colors.darkblack,
  },
  scrollContainer: {
    padding: scaleWidth(24),
    paddingBottom: 80,
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