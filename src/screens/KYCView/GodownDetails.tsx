import {RightCheckmark} from '@assets/Icons';
import {
  AppBar,
  Container,
  CustomDropdown,
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
import React, {useMemo, useState, useEffect} from 'react';
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

export const GodownDetails = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'GodownDetails'>>();
  const [uploadType, setUploadType] = useState<
    'agreementCopy' | 'electricityBill' | null
  >(null);
  const [ownershipStatus, setOwnershipStatus] = useState<string | undefined>(
    undefined,
  );
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [nameofOwner, setnameofOwner] = useState('');
  const [agreementCopy, setAgreementCopy] = useState<
    DocumentPickerResponse | undefined
  >();
  const [electricityBill, setElectricityBill] = useState<
    DocumentPickerResponse | undefined
  >();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Existing godown data states
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageName, setExistingImageName] = useState<string>('');
  const [imageRemoved, setImageRemoved] = useState(false);

  const allDocumentOptions = [
    {label: 'Ebill', value: 'Ebill'},
    {label: 'Rent Agreement', value: 'Rent Agreement'},
    {label: 'Index 2', value: 'Index 2'},
    {label: 'Gas Receipt', value: 'Gas Receipt'},
    {label: 'House Tax Receipt', value: 'House Tax Receipt'},
  ];

  const filteredDocumentOptions = useMemo(() => {
    if (ownershipStatus === 'owned') {
      return allDocumentOptions.filter(item => item.value !== 'Rent Agreement');
    }
    return allDocumentOptions;
  }, [ownershipStatus]);

  const [errors, setErrors] = useState({
    nameofOwner: false,
    ownershipStatus: false,
    agreementCopy: false,
    electricityBill: false,
  });

  const dispatch = useDispatch();
  
  // Redux state
  const {personalKycLoading, personalKycData, personalKycError} = useSelector(
    (state: RootState) => state.kyc
  );

  // Fetch existing godown data using Redux Saga
  const fetchExistingGodown = () => {
    console.log('🔍 fetchExistingGodown called with params:', params);
    if (!params?.clientID) {
      console.log('❌ No clientID found, returning early');
      return;
    }
    
    console.log('🚀 Dispatching getBusinessKycRequest with:', {
      clientId: params.clientID.toString(),
      docType: 'godown'
    });
    console.log('🏢🏢🏢 DISPATCHING BUSINESS KYC REQUEST FOR GODOWN 🏢🏢🏢');
    
    dispatch(kycActions.getBusinessKycRequest({
      clientId: params.clientID.toString(),
      docType: 'godown'
    }));
  };

  // Handle Redux state changes
  useEffect(() => {
    console.log('📊 useEffect triggered - personalKycData:', personalKycData);
    console.log('⏳ personalKycLoading:', personalKycLoading);
    console.log('❌ personalKycError:', personalKycError);
    
    if (personalKycData && personalKycData.length > 0) {
      console.log('✅ Found personalKycData, processing...');
      const godownRecords = personalKycData;
      
      // Process main applicant (first record)
      if (godownRecords.length > 0) {
        const mainApplicantData = godownRecords[0];
        console.log('📄 mainApplicantData:', mainApplicantData);
        console.log('📁 filename_obj:', mainApplicantData.filename_obj);
        
        const fileName = (mainApplicantData.filename_obj as any)?.godown?.file_name;
        const nameOfOwner = (mainApplicantData.filename_obj as any)?.godown?.name_of_owner;
        const ownershipStatusValue = (mainApplicantData.filename_obj as any)?.godown?.ownership_status;
        const docType = (mainApplicantData.filename_obj as any)?.godown?.doc_type;
        
        console.log('🔍 Extracted data:', { fileName, nameOfOwner, ownershipStatusValue, docType });
        
        if (fileName) {
          console.log('✅ Found fileName, setting up existing data...');
          // Construct full image URL for main applicant
          const fullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
          console.log('🖼️ Setting image URL:', fullImageUrl);
          
          setExistingImageUrl(fullImageUrl);
          setExistingImageName(fileName);
          
          // Pre-fill form fields if available
          if (nameOfOwner) {
            console.log('📝 Setting name:', nameOfOwner);
            setnameofOwner(nameOfOwner);
          }
          if (ownershipStatusValue) {
            console.log('🏠 Setting ownership status:', ownershipStatusValue);
            setOwnershipStatus(ownershipStatusValue);
          }
          if (docType) {
            console.log('📄 Setting document type:', docType);
            setDocumentType(docType);
          }
        } else {
          console.log('❌ No fileName found in data');
        }
      }
      
      // Set edit mode if any existing data is found
      console.log('🔄 Setting edit mode to true');
      setIsEditMode(true);
    } else if (personalKycData && personalKycData.length === 0) {
      console.log('📭 No data found, setting edit mode to false');
      setIsEditMode(false);
    } else {
      console.log('❓ personalKycData is null or undefined');
    }
  }, [personalKycData, params?.clientID]);

  // Handle error state
  useEffect(() => {
    if (personalKycError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch existing godown data',
        position: 'top',
      });
    }
  }, [personalKycError]);

  // Fetch existing godown data on component mount
  useEffect(() => {
    console.log('🏁 Component mount useEffect triggered, params?.clientID:', params?.clientID);
    fetchExistingGodown();
  }, [params?.clientID]);

  const openPdfInBrowser = (fileName: string) => {
    const pdfUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
    Linking.openURL(pdfUrl).catch(err => {
      console.error('Failed to open PDF:', err);
      Alert.alert('Error', 'Failed to open PDF document');
    });
  };

  const handleSubmit = () => {
    const selectedFile =
      ownershipStatus === 'rented' ? agreementCopy : electricityBill;

    if (
      !nameofOwner || 
      !ownershipStatus || 
      !documentType ||
      (!selectedFile && !existingImageUrl)
    ) {
      setErrors({
        nameofOwner: !nameofOwner,
        ownershipStatus: !ownershipStatus,
        agreementCopy: ownershipStatus === 'rented' && !agreementCopy && !existingImageUrl,
        electricityBill: ownershipStatus === 'owned' && !electricityBill && !existingImageUrl,
      });

      let missingFields = [];

      if (!nameofOwner) missingFields.push('Name of Owner');
      if (!ownershipStatus) missingFields.push('Ownership Status');
      if (!documentType) missingFields.push('Document Type');

      if (ownershipStatus === 'rented' && !agreementCopy && !existingImageUrl) {
        missingFields.push('Agreement Copy');
      } else if (ownershipStatus === 'owned' && !electricityBill && !existingImageUrl) {
        missingFields.push('Electricity Bill');
      }

      Alert.alert(
        'Missing Fields',
        `Please provide the following:\n${missingFields.join('\n')}`,
      );
      return;
    }

    setErrors({
      nameofOwner: false,
      ownershipStatus: false,
      agreementCopy: false,
      electricityBill: false,
    });

    const payload = {
      doc: selectedFile ? {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name,
      } : {
        uri: '',
        name: '',
        type: 'application/pdf',
      },
      clientId: Number(params.clientID),
      uploaded_by: getUserFullName(),
      params: 'Godown',
      client_name: nameofOwner,
      name_of_owner: nameofOwner,
      ownership_status: ownershipStatus,
      doc_type: documentType,
    };

    setLoading(true);
    dispatch(kycActions.uploadGoDownRequest(payload));
    
    // Simulate API call delay and handle success
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: isEditing ? 'Document Updated' : 'Document Uploaded',
        text2: `${nameofOwner}'s document ${isEditing ? 'updated' : 'submitted'} successfully`,
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
    setnameofOwner('');
    setAgreementCopy(undefined);
    setElectricityBill(undefined);
    setExistingImageUrl(null);
    setExistingImageName('');
    setImageRemoved(false);
    setIsEditMode(false);
    setIsEditing(false);
    setOwnershipStatus(undefined);
    setDocumentType(null);
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
        <Text style={styles.Subheader}>Upload Godown Details</Text>
      </View>
      <ScrollView style={styles.mainContainer} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Go Down Details</Text>

          <>
            <CustomDropdown
              label="Ownership Status"
              data={[
                {label: 'Rented', value: 'rented'},
                {label: 'Owned', value: 'owned'},
              ]}
              value={ownershipStatus ?? undefined}
              onChange={val => {
                setOwnershipStatus(val);
                setDocumentType(null);
              }}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />

            <CustomDropdown
              label="Document"
              data={filteredDocumentOptions}
              value={documentType ?? undefined}
              onChange={val => setDocumentType(val)}
              containerStyle={{marginBottom: scaleHeight(20)}}
            />
          </>

          <Input
            label="Name of Owner"
            value={nameofOwner}
            onChangeText={text => {
              setnameofOwner(text);
              if (errors.nameofOwner)
                setErrors(prev => ({...prev, nameofOwner: false}));
            }}
            containerStyle={[
              {marginBottom: scaleHeight(20)},
              errors.nameofOwner && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 5,
              },
            ]}
          />

          {personalKycLoading ? (
            <View style={styles.imageContainer}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Loading existing godown document...</Text>
            </View>
          ) : existingImageUrl && !imageRemoved && !agreementCopy && !electricityBill ? (
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
                  setAgreementCopy(undefined);
                  setElectricityBill(undefined);
                  setErrors({...errors, agreementCopy: false, electricityBill: false});
                }}>
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setUploadType(
                    ownershipStatus === 'rented'
                      ? 'agreementCopy'
                      : 'electricityBill',
                  );
                  setIsVisible(true);
                }}>
                <Text style={styles.changeImageText}>Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : ownershipStatus && (
            <>
              {(() => {
                const selectedFile =
                  ownershipStatus === 'rented'
                    ? agreementCopy
                    : electricityBill;
                const label =
                  ownershipStatus === 'rented'
                    ? 'Upload Agreement Copy'
                    : 'Upload Electricity Bill';

                return !selectedFile ? (
                  <View>
                    <DashedButton
                      label={label}
                      onPress={() => {
                        setUploadType(
                          ownershipStatus === 'rented'
                            ? 'agreementCopy'
                            : 'electricityBill',
                        );
                        setIsVisible(true);
                      }}
                      containerStyle={
                        (ownershipStatus === 'rented' && errors.agreementCopy) ||
                        (ownershipStatus === 'owned' && errors.electricityBill)
                          ? {borderColor: Colors.red}
                          : undefined
                      }
                    />
                    {(ownershipStatus === 'rented' && errors.agreementCopy) ||
                     (ownershipStatus === 'owned' && errors.electricityBill) ? (
                      <Text style={styles.errorText}>Document is required</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    <View style={styles.thumbnailContainer}>
                      <TouchableOpacity
                        onPress={() => openPdfInBrowser(selectedFile.name || 'document.pdf')}
                        style={styles.existingImageContainer}>
                        <View style={styles.pdfIconContainer}>
                          <Text style={styles.pdfIcon}>📄</Text>
                          <Text style={styles.pdfText}>PDF Document</Text>
                          <Text style={styles.fileNameText}>{selectedFile.name}</Text>
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.tapToViewText}>Tap to open PDF in browser</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        if (ownershipStatus === 'rented') {
                          setAgreementCopy(undefined);
                        } else {
                          setElectricityBill(undefined);
                        }
                      }}>
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </>
          )}

          <UploadModal
            visible={isVisible}
            allowedFileTypes={['pdf']}
            onClose={file => {
              if (file) {
                setUploading(true);
                setTimeout(() => {
                  switch (uploadType) {
                    case 'agreementCopy':
                      setAgreementCopy(file);
                      if (errors.agreementCopy)
                        setErrors(prev => ({
                          ...prev,
                          agreementCopy: false,
                        }));
                      break;
                    case 'electricityBill':
                      setElectricityBill(file);
                      if (errors.electricityBill)
                        setErrors(prev => ({
                          ...prev,
                          electricityBill: false,
                        }));
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
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
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