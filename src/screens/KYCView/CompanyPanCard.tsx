import {RightCheckmarkWhite} from '@assets/Icons';
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
import {kycActions, IuploadCompanyPanPayload, kycSelector} from '@store/kyc';
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
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const CompanyPanCard = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'CompanyPanCard'>>();
  const [uploadType, setUploadType] = useState<
    'frontPanImage' | 'backPanImage' | null
  >(null);
  const [namePan, setNamePan] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [frontPanImage, setFrontPanImage] = useState<
    DocumentPickerResponse | undefined
  >();

  // Existing document states
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageName, setExistingImageName] = useState<string>('');
  const [imageRemoved, setImageRemoved] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [errors, setErrors] = useState({
    namePan: false,
    panNumber: false,
    panNumberFormat: false,
    frontPanImage: false,
  });

  const dispatch = useDispatch();
  const personalKycData = useSelector(kycSelector.getPersonalKycData);
  const personalKycLoading = useSelector(kycSelector.getPersonalKycLoading);
  const companyPanData = useSelector(kycSelector.getCompanyPanData);
  const companyPanLoading = useSelector(kycSelector.getCompanyPanLoading);
  const companyPanError = useSelector(kycSelector.getCompanyPanError);

  // Load existing data when component mounts
  useEffect(() => {
    if (params.clientID) {
      console.log('Loading business KYC company PAN data for client:', params.clientID);
      // Clear any previous upload data to prevent false success toasts
      dispatch(kycActions.clearCompanyPan());
      dispatch(kycActions.getBusinessKycRequest({
        clientId: params.clientID.toString(),
        docType: 'company_pan'
      }));
    }
  }, [params.clientID, dispatch]);

  // Update form when data is loaded
  useEffect(() => {
    console.log('Business KYC Data:', personalKycData);
    console.log('Business KYC Loading:', personalKycLoading);
    
    if (personalKycData && personalKycData.length > 0) {
      // For business KYC, look for documents with company_pan in filename_obj
      const companyPanDoc = personalKycData.find(
        (doc: any) => doc.filename_obj && doc.filename_obj.company_pan
      );
      
      console.log('Company PAN Doc:', companyPanDoc);
      
      if (companyPanDoc?.filename_obj) {
        const filenameObj = companyPanDoc.filename_obj as any;
        if (filenameObj.company_pan) {
          const panData = filenameObj.company_pan;
          console.log('PAN Data:', panData);
          setNamePan(panData.name_as_per_pan || '');
          setPanNumber(panData.pan_number || '');
          
          // Set existing document data
          if (panData.file_name) {
            const fullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${panData.file_name}`;
            setExistingImageUrl(fullImageUrl);
            setExistingImageName(panData.file_name);
          }
        }
      }
      
      // Set edit mode if any existing data is found
      setIsEditMode(true);
    } else if (!personalKycLoading && personalKycData && personalKycData.length === 0) {
      console.log('No company PAN data found for this client');
      setIsEditMode(false);
    } else {
      console.log('❓ personalKycData is null or undefined');
    }
  }, [personalKycData, personalKycLoading]);

  // Handle upload success
  useEffect(() => {
    if (companyPanData && !companyPanLoading && hasUploaded) {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: isEditing ? 'Document Updated' : 'Document Uploaded',
        text2: `${namePan}'s Company PAN document ${isEditing ? 'updated' : 'submitted'} successfully`,
        position: 'top',
      });
      handleClear();
      setHasUploaded(false); // Reset the flag
    }
  }, [companyPanData, companyPanLoading, namePan, hasUploaded, isEditing]);

  // Handle upload error
  useEffect(() => {
    if (companyPanError && !companyPanLoading && hasUploaded) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: companyPanError,
        position: 'top',
      });
      setHasUploaded(false); // Reset the flag
    }
  }, [companyPanError, companyPanLoading, hasUploaded]);

  const openPdfInBrowser = (fileName: string) => {
    const pdfUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
    Linking.openURL(pdfUrl).catch(err => {
      console.error('Failed to open PDF:', err);
      Alert.alert('Error', 'Failed to open PDF document');
    });
  };

  const isValidPANFormat = (pan: string): boolean => {
    if (!pan || pan.length !== 10) return false;

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const handleSubmit = () => {
    if (!namePan || !panNumber || !frontPanImage) {
      setErrors({
        namePan: !namePan,
        panNumber: !panNumber,
        panNumberFormat: !panNumber || !isValidPANFormat(panNumber),
        frontPanImage: !frontPanImage,
      });

      let missingFields = [];
      if (!namePan) missingFields.push('Name as Pan');
      if (!panNumber) missingFields.push('Pan Number');
      if (panNumber && !isValidPANFormat(panNumber))
        missingFields.push('Invalid PAN Number Format');
      if (!frontPanImage) missingFields.push('Upload Pan Image');

      Alert.alert(
        'Missing Fields',
        `Please provide the following:\n${missingFields.join('\n')}`,
      );
      return;
    }

    setErrors({
      namePan: false,
      panNumber: false,
      panNumberFormat: false,
      frontPanImage: false,
    });

    setLoading(true);
    setHasUploaded(true); // Set flag to indicate user initiated upload
    
    // Dispatch the upload request
    dispatch(kycActions.uploadCompanyPanRequest({
      clientId: Number(params.clientID),
      uploaded_by: getUserFullName(),
      docDetails: {
        name_as_per_pan: namePan,
        pan_number: panNumber,
      },
      doc: [{
        name: frontPanImage.name ?? `CompanyPan_${Date.now()}.pdf`,
        type: frontPanImage.type ?? 'application/pdf',
        uri: frontPanImage.uri,
      }],
    }));
  };

  const handleClear = () => {
    setNamePan('');
    setPanNumber('');
    setFrontPanImage(undefined);
    setExistingImageUrl(null);
    setExistingImageName('');
    setImageRemoved(false);
    setIsEditMode(false);
    setIsEditing(false);
  };

  return (
    <Container>
      {(loading || uploading || personalKycLoading) && (
        <View style={styles.centeredLoader} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
      <AppBar title="Client Information Master" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Kyc Document</Text>
      </View>
      <View style={styles.container}>
        {/* Main Applicant Section */}
        <Text style={styles.sectionTitle}>Company PAN Card</Text>
        <Input
          label="Name as per PAN"
          value={namePan}
          onChangeText={text => {
            setNamePan(text);
            if (errors.namePan && text.trim()) {
              setErrors(prev => ({...prev, namePan: false}));
            }
          }}
          containerStyle={[
            {marginBottom: scaleHeight(24)},
            errors.namePan && {
              borderColor: Colors.red,
              borderWidth: 1,
              borderRadius: 5,
            },
          ]}
        />
        <Input
          label="PAN Number"
          value={panNumber}
          onChangeText={text => {
            const formatted = text.toUpperCase().slice(0, 10);
            setPanNumber(formatted);

            if (errors.panNumber && formatted.trim()) {
              setErrors(prev => ({...prev, panNumber: false}));
            }
            if (errors.panNumberFormat && isValidPANFormat(formatted)) {
              setErrors(prev => ({...prev, panNumberFormat: false}));
            }
          }}
          autoCapitalize="characters"
          containerStyle={[
            {marginBottom: scaleHeight(24)},
            (errors.panNumber || errors.panNumberFormat) && {
              borderColor: Colors.red,
              borderWidth: 1,
              borderRadius: 5,
            },
          ]}
        />
        {errors.panNumberFormat && panNumber.length === 10 && (
          <Text style={styles.errorText}>
            Invalid PAN format. Expected: ABCDE1234F (5 letters + 4 digits + 1
            letter)
          </Text>
        )}

        {personalKycLoading ? (
          <View style={styles.imageContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading existing PAN document...</Text>
          </View>
        ) : existingImageUrl && !imageRemoved && !frontPanImage ? (
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
                setFrontPanImage(undefined);
                setErrors({...errors, frontPanImage: false});
              }}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={() => {
                setUploadType('frontPanImage');
                setIsVisible(true);
              }}>
              <Text style={styles.changeImageText}>Change Document</Text>
            </TouchableOpacity>
          </View>
        ) : frontPanImage ? (
          <View style={styles.imageContainer}>
            <View style={styles.thumbnailContainer}>
              <TouchableOpacity
                onPress={() => openPdfInBrowser(frontPanImage.name || 'document.pdf')}
                style={styles.existingImageContainer}>
                <View style={styles.pdfIconContainer}>
                  <Text style={styles.pdfIcon}>📄</Text>
                  <Text style={styles.pdfText}>PDF Document</Text>
                  <Text style={styles.fileNameText}>{frontPanImage.name}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => {
                setFrontPanImage(undefined);
              }}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <DashedButton
            label="Upload Company PAN Document"
            onPress={() => {
              setUploadType('frontPanImage');
              setIsVisible(true);
            }}
            containerStyle={
              errors.frontPanImage ? {borderColor: Colors.red} : undefined
            }
          />
        )}

        <UploadModal
          visible={isVisible}
          allowedFileTypes={['pdf']}
          onClose={file => {
            if (file) {
              setUploading(true);
              setTimeout(() => {
                switch (uploadType) {
                  case 'frontPanImage':
                    setFrontPanImage(file);
                    if (errors.frontPanImage)
                      setErrors(prev => ({...prev, frontPanImage: false}));
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
              <RightCheckmarkWhite width={12} height={12} />
            </TouchableOpacity>
          </View>
        </View>
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
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginVertical: 10,
    marginBottom: scaleHeight(20),
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    marginTop: scaleHeight(30),
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
  centeredLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
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