import {RightCheckmarkWhite} from '@assets/Icons';
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
import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/app/store';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const ResidenceDetail = () => {
  const navigation = useNavigation<KycNavigationType>();

  const [ownershipStatus, setOwnershipStatus] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'ResidenceDetail'>>();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadType, setUploadType] = useState<
    'agreementCopy' | 'electricityBill' | null
  >(null);
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
  
  // Existing residence data states
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

  // Fetch existing residence data using Redux Saga
  const fetchExistingResidence = () => {
    if (!params?.clientID) {
      return;
    }
    
    dispatch(kycActions.getPersonalKycRequest({
      clientId: params.clientID.toString(),
      docType: 'residence'
    }));
  };

  // Handle Redux state changes
  useEffect(() => {
    if (personalKycData && personalKycData.length > 0) {
      const residenceRecords = personalKycData;
      
      // Process residence data (first record)
      if (residenceRecords.length > 0) {
        const residenceData = residenceRecords[0];
        
        const fileName = residenceData.filename_obj?.residence?.filename; // Updated to match API response
        const nameOfOwner = residenceData.filename_obj?.residence?.name_of_owner;
        const ownershipStatusValue = residenceData.filename_obj?.residence?.ownership_status;
        
        if (fileName) {
          // Construct full image URL
          const fullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
          
          setExistingImageUrl(fullImageUrl);
          setExistingImageName(fileName);
          
          // Pre-fill form fields if available
          if (nameOfOwner) {
            setnameofOwner(nameOfOwner);
          }
          if (ownershipStatusValue) {
            setOwnershipStatus(ownershipStatusValue);
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
        text2: 'Failed to fetch existing residence data',
        position: 'top',
      });
    }
  }, [personalKycError]);

  // Fetch existing residence data on component mount
  useEffect(() => {
    fetchExistingResidence();
  }, [params?.clientID]);

  const handleSubmit = () => {
    const selectedFile =
      ownershipStatus === 'rented' ? agreementCopy : electricityBill;

    if (!nameofOwner || !ownershipStatus || (!selectedFile && !existingImageUrl)) {
      setErrors({
        nameofOwner: !nameofOwner,
        ownershipStatus: !ownershipStatus,
        agreementCopy: ownershipStatus === 'rented' && !agreementCopy && !existingImageUrl,
        electricityBill: ownershipStatus === 'owned' && !electricityBill && !existingImageUrl,
      });

      let missingFields = [];

      if (!nameofOwner) missingFields.push('Name of Owner');
      if (!ownershipStatus) missingFields.push('Ownership Status');

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
        uri: null,
        type: null,
        name: null,
      },
      clientId: Number(params.clientID),
      uploaded_by: getUserFullName(),
      params: 'residenceProof',
      client_name: nameofOwner,
      name_of_owner: nameofOwner,
      ownership_status: ownershipStatus,
    };

    setLoading(true);
    dispatch(kycActions.uploadResidenceRequest(payload));
    
    // Simulate API call delay and handle success
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: isEditing ? 'Document Updated' : 'Document Uploaded',
        text2: `${nameofOwner}'s document ${isEditing ? 'updated' : 'submitted'} successfully`,
        position: 'top',
      });
      
      // Clear form and navigate back
      handleClear();
      navigation.goBack();
    }, 1500);
  };

  const handleClear = () => {
    setnameofOwner('');
    setAgreementCopy(undefined);
    setElectricityBill(undefined);
    setOwnershipStatus(null);
    setDocumentType(null);
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
          <View>
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
            </View>
          </View>
        </View>
      )}
      <AppBar title="KYC Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Upload Residence Details</Text>
      </View>
      <ScrollView 
        contentContainerStyle={styles.mainContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Residence Details</Text>

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

          {ownershipStatus && (
            <>
              {personalKycLoading ? (
                <View style={styles.imageContainer}>
                  <ActivityIndicator size="large" color={Colors.primaryColor} />
                  <Text style={styles.loadingText}>Loading existing residence document...</Text>
                </View>
              ) : existingImageUrl && !imageRemoved && !(ownershipStatus === 'rented' ? agreementCopy : electricityBill) ? (
                <View style={styles.imageContainer}>
                  <View style={styles.thumbnailContainer}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('FullImage', {imageUrl: existingImageUrl})}
                      style={styles.existingImageContainer}>
                      <Image
                        source={{uri: existingImageUrl}}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImageRemoved(true);
                      setExistingImageName('');
                      if (ownershipStatus === 'rented') {
                        setAgreementCopy(undefined);
                      } else {
                        setElectricityBill(undefined);
                      }
                      setErrors({...errors, 
                        agreementCopy: false, 
                        electricityBill: false
                      });
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
                    <Text style={styles.changeImageText}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (ownershipStatus === 'rented' ? agreementCopy : electricityBill) ? (
                <View style={styles.imageContainer}>
                  <View style={styles.thumbnailContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        const imageUri = (ownershipStatus === 'rented' ? agreementCopy : electricityBill)?.uri;
                        if (imageUri) {
                          navigation.navigate('FullImage', {imageUrl: imageUri});
                        }
                      }}
                      style={styles.existingImageContainer}>
                      <Image
                        source={{uri: (ownershipStatus === 'rented' ? agreementCopy : electricityBill)?.uri || ''}}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
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
              ) : (
                <View>
                  <DashedButton
                    label={
                      ownershipStatus === 'rented'
                        ? 'Upload Agreement Copy'
                        : 'Upload Electricity Bill'
                    }
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
                  <Text style={styles.errorText}>Document is required</Text>
                </View>
              )}
            </>
          )}

          <UploadModal
            visible={isVisible}
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
                <RightCheckmarkWhite width={12} height={12} />
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
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
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
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderColor: '#ccc',
    zIndex: 1000,
    elevation: 5,
  },
  labelText: {
    fontSize: 16,
  },
  image_arrow: {
    width: 17,
    height: 20,
    margin: 1,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginVertical: 10,
    marginBottom: scaleHeight(16),
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bbb',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#888',
  },
  uploadText: {
    fontSize: 13,
    color: '#666',
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    marginTop: scaleHeight(30),
    marginBottom: scaleHeight(20),
    paddingBottom: scaleHeight(10),
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
  existingImage: {
    width: scaleWidth(220),
    height: scaleHeight(120),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  fileNameText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    marginBottom: scaleHeight(10),
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
  errorText: {
    color: Colors.red,
    fontSize: scaleFont(12),
    marginTop: 4,
    marginBottom: scaleHeight(8),
  },
});