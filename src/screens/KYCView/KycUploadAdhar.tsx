import {RightCheckmark, RightCheckmarkWhite} from '@assets/Icons';
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
import {scaleWidth, scaleHeight, scaleFont} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import {FILE_DOWNLOAD_URL} from '@config/config';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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

export const KycUploadAdhar = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'KycUploadDoc'>>();
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState<
    'mainFront' | 'mainBack' | 'coFront' | 'coBack' | null
  >(null);
  const [nameAdhar, setNameAdhar] = useState('');
  const [adharNumber, setAdharNumber] = useState('');
  const [frontImage, setFrontImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [backImage, setBackImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [coApplicantNameAdhar, setCoApplicantNameAdhar] = useState('');
  const [coApplicantAdharNumber, setCoApplicantAdharNumber] = useState('');
  const [coApplicantFrontImage, setCoApplicantFrontImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [coApplicantBackImage, setCoApplicantBackImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [showCoApplicant, setShowCoApplicant] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Existing Aadhar data states
  const [existingFrontImageUrl, setExistingFrontImageUrl] = useState<string | null>(null);
  const [existingBackImageUrl, setExistingBackImageUrl] = useState<string | null>(null);
  const [existingFrontImageName, setExistingFrontImageName] = useState<string>('');
  const [existingBackImageName, setExistingBackImageName] = useState<string>('');
  const [frontImageRemoved, setFrontImageRemoved] = useState(false);
  const [backImageRemoved, setBackImageRemoved] = useState(false);
  
  // Co-applicant existing data states
  const [coApplicantExistingFrontImageUrl, setCoApplicantExistingFrontImageUrl] = useState<string | null>(null);
  const [coApplicantExistingBackImageUrl, setCoApplicantExistingBackImageUrl] = useState<string | null>(null);
  const [coApplicantExistingFrontImageName, setCoApplicantExistingFrontImageName] = useState<string>('');
  const [coApplicantExistingBackImageName, setCoApplicantExistingBackImageName] = useState<string>('');
  const [coApplicantFrontImageRemoved, setCoApplicantFrontImageRemoved] = useState(false);
  const [coApplicantBackImageRemoved, setCoApplicantBackImageRemoved] = useState(false);

  const [errors, setErrors] = useState({
    nameAdhar: false,
    adharNumber: false,
    adharNumberFormat: false,
    frontImage: false,
    backImage: false,
    coApplicantNameAdhar: false,
    coApplicantAdharNumber: false,
    coApplicantAdharNumberFormat: false,
    coApplicantFrontImage: false,
    coApplicantBackImage: false,
  });

  const dispatch = useDispatch();
  
  // Redux state
  const {personalKycLoading, personalKycData, personalKycError} = useSelector(
    (state: RootState) => state.kyc
  );
  const isValidAadhaar = (num: string) => /^\d{12}$/.test(num);

  // Fetch existing Aadhar data using Redux Saga
  const fetchExistingAadhar = () => {
    if (!params?.clientID) {
      return;
    }
    
    dispatch(kycActions.getPersonalKycRequest({
      clientId: params.clientID.toString(),
      docType: 'aadhar'
    }));
  };

  // Handle Redux state changes
  useEffect(() => {
    if (personalKycData && personalKycData.length > 0) {
      const aadharRecords = personalKycData;
      
      // Process main applicant (first record)
      if (aadharRecords.length > 0) {
        const mainApplicantData = aadharRecords[0];
        
        const frontFileName = mainApplicantData.filename_obj?.aadhar?.aadhar_front_filename;
        const backFileName = mainApplicantData.filename_obj?.aadhar?.aadhar_back_filename;
        const nameAsPerAadhar = mainApplicantData.filename_obj?.aadhar?.name_as_per_aadhar;
        const aadharNumber = mainApplicantData.filename_obj?.aadhar?.aadhar_number;
        
        if (frontFileName) {
          // Construct full image URL for main applicant front
          const fullFrontImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${frontFileName}`;
          setExistingFrontImageUrl(fullFrontImageUrl);
          setExistingFrontImageName(frontFileName);
        }
        
        if (backFileName) {
          // Construct full image URL for main applicant back
          const fullBackImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${backFileName}`;
          setExistingBackImageUrl(fullBackImageUrl);
          setExistingBackImageName(backFileName);
        }
        
        // Pre-fill form fields if available
        if (nameAsPerAadhar) {
          setNameAdhar(nameAsPerAadhar);
        }
        if (aadharNumber) {
          setAdharNumber(aadharNumber);
        }
      }
      
      // Process co-applicant (second record if exists)
      if (aadharRecords.length > 1) {
        const coApplicantData = aadharRecords[1];
        
        const coFrontFileName = coApplicantData.filename_obj?.aadhar?.aadhar_front_filename;
        const coBackFileName = coApplicantData.filename_obj?.aadhar?.aadhar_back_filename;
        const coNameAsPerAadhar = coApplicantData.filename_obj?.aadhar?.name_as_per_aadhar;
        const coAadharNumber = coApplicantData.filename_obj?.aadhar?.aadhar_number;
        
        if (coFrontFileName) {
          // Construct full image URL for co-applicant front
          const coFullFrontImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${coFrontFileName}`;
          setCoApplicantExistingFrontImageUrl(coFullFrontImageUrl);
          setCoApplicantExistingFrontImageName(coFrontFileName);
        }
        
        if (coBackFileName) {
          // Construct full image URL for co-applicant back
          const coFullBackImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${coBackFileName}`;
          setCoApplicantExistingBackImageUrl(coFullBackImageUrl);
          setCoApplicantExistingBackImageName(coBackFileName);
        }
        
        // Pre-fill co-applicant form fields if available
        if (coNameAsPerAadhar) {
          setCoApplicantNameAdhar(coNameAsPerAadhar);
        }
        if (coAadharNumber) {
          setCoApplicantAdharNumber(coAadharNumber);
        }
        
        // Show co-applicant section if data exists
        setShowCoApplicant(true);
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
        text2: 'Failed to fetch existing Aadhar data',
        position: 'top',
      });
    }
  }, [personalKycError]);

  // Fetch existing Aadhar data on component mount
  useEffect(() => {
    fetchExistingAadhar();
  }, [params?.clientID]);

  const handleSubmit = () => {
    if (
      !nameAdhar ||
      !adharNumber ||
      !isValidAadhaar(adharNumber) ||
      (!frontImage && !existingFrontImageUrl) ||
      (!backImage && !existingBackImageUrl) ||
      (showCoApplicant &&
        (!coApplicantNameAdhar ||
          !coApplicantAdharNumber ||
          !isValidAadhaar(coApplicantAdharNumber) ||
          (!coApplicantFrontImage && !coApplicantExistingFrontImageUrl) ||
          (!coApplicantBackImage && !coApplicantExistingBackImageUrl)))
    ) {
      setErrors({
        nameAdhar: !nameAdhar,
        adharNumber: !adharNumber,
        adharNumberFormat: !adharNumber || !isValidAadhaar(adharNumber),
        frontImage: !frontImage && !existingFrontImageUrl,
        backImage: !backImage && !existingBackImageUrl,
        coApplicantNameAdhar: showCoApplicant ? !coApplicantNameAdhar : false,
        coApplicantAdharNumber: showCoApplicant
          ? !coApplicantAdharNumber
          : false,
        coApplicantAdharNumberFormat:
          showCoApplicant && coApplicantAdharNumber
            ? !isValidAadhaar(coApplicantAdharNumber)
            : false,
        coApplicantFrontImage: showCoApplicant ? (!coApplicantFrontImage && !coApplicantExistingFrontImageUrl) : false,
        coApplicantBackImage: showCoApplicant ? (!coApplicantBackImage && !coApplicantExistingBackImageUrl) : false,
      });

      let missingFields = [];
      if (!nameAdhar) missingFields.push('Name as per Aadhar');
      if (!adharNumber) missingFields.push('Aadhaar Number');
      if (adharNumber && !isValidAadhaar(adharNumber))
        missingFields.push('Invalid Aadhaar Number (12 digits required)');
      if (!frontImage && !existingFrontImageUrl) missingFields.push('Front Image');
      if (!backImage && !existingBackImageUrl) missingFields.push('Back Image');

      if (showCoApplicant) {
        if (!coApplicantNameAdhar) missingFields.push('Co-applicant Name');
        if (!coApplicantAdharNumber)
          missingFields.push('Co-applicant Aadhaar Number');
        if (coApplicantAdharNumber && !isValidAadhaar(coApplicantAdharNumber))
          missingFields.push('Invalid Co-applicant Aadhaar Number');
        if (!coApplicantFrontImage && !coApplicantExistingFrontImageUrl)
          missingFields.push('Co-applicant Front Image');
        if (!coApplicantBackImage && !coApplicantExistingBackImageUrl)
          missingFields.push('Co-applicant Back Image');
      }

      Alert.alert(
        'Missing Fields',
        `Please provide the Following:\n${missingFields.join('\n')}`,
      );
      return;
    }

    setErrors({
      nameAdhar: false,
      adharNumber: false,
      adharNumberFormat: false,
      frontImage: false,
      backImage: false,
      coApplicantNameAdhar: false,
      coApplicantAdharNumber: false,
      coApplicantAdharNumberFormat: false,
      coApplicantFrontImage: false,
      coApplicantBackImage: false,
    });

    const allFieldsFilled =
      nameAdhar &&
      adharNumber &&
      isValidAadhaar(adharNumber) &&
      (frontImage || existingFrontImageUrl) &&
      (backImage || existingBackImageUrl) &&
      (!showCoApplicant ||
        (coApplicantNameAdhar &&
          coApplicantAdharNumber &&
          isValidAadhaar(coApplicantAdharNumber) &&
          (coApplicantFrontImage || coApplicantExistingFrontImageUrl) &&
          (coApplicantBackImage || coApplicantExistingBackImageUrl)));

    if (allFieldsFilled) {
      const payload = {
        clientId: Number(params.clientID),
        uploaded_by: getUserFullName(),
        // Aadhaar details for both applicant and co-applicant
        doc: [
          {
            name_as_per_aadhar: nameAdhar,
            aadhar_number: adharNumber,
          },
          ...(showCoApplicant
            ? [
                {
                  name_as_per_aadhar: coApplicantNameAdhar,
                  aadhar_number: coApplicantAdharNumber,
                },
              ]
            : []),
        ],
        // Files: front/back of applicant and co-applicant Aadhaar
        files: [
          ...(frontImage ? [{
            uri: frontImage.uri,
            name: frontImage.name ?? Date.now().toString(),
            type: frontImage.type ?? 'image/png',
          }] : []),
          ...(backImage ? [{
            uri: backImage.uri,
            name: backImage.name ?? Date.now().toString(),
            type: backImage.type ?? 'image/png',
          }] : []),
          ...(showCoApplicant && coApplicantFrontImage
            ? [
                {
                  uri: coApplicantFrontImage.uri,
                  name: coApplicantFrontImage.name ?? Date.now().toString(),
                  type: coApplicantFrontImage.type ?? 'image/png',
                },
              ]
            : []),
          ...(showCoApplicant && coApplicantBackImage
            ? [
                {
                  uri: coApplicantBackImage.uri,
                  name: coApplicantBackImage.name ?? Date.now().toString(),
                  type: coApplicantBackImage.type ?? 'image/png',
                },
              ]
            : []),
        ],
      };

      setLoading(true);
      dispatch(kycActions.uploadAdharRequest(payload));
      
      // Simulate API call delay and handle success
      setTimeout(() => {
        setLoading(false);
        Toast.show({
          type: 'success',
          text1: isEditing ? 'Document Updated' : 'Document Uploaded',
          text2: `${nameAdhar}'s document ${isEditing ? 'updated' : 'submitted'} successfully`,
          position: 'top',
        });
        
        // Clear form and navigate back
        handleClear();
        navigation.goBack();
      }, 1500);
    } else {
      // Please fill all required Aadhar Details and upload images
    }
  };

  const handleClear = () => {
    setNameAdhar('');
    setAdharNumber('');
    setFrontImage(undefined);
    setBackImage(undefined);
    setCoApplicantNameAdhar('');
    setCoApplicantAdharNumber('');
    setCoApplicantFrontImage(undefined);
    setCoApplicantBackImage(undefined);
    setExistingFrontImageUrl(null);
    setExistingBackImageUrl(null);
    setExistingFrontImageName('');
    setExistingBackImageName('');
    setFrontImageRemoved(false);
    setBackImageRemoved(false);
    setCoApplicantExistingFrontImageUrl(null);
    setCoApplicantExistingBackImageUrl(null);
    setCoApplicantExistingFrontImageName('');
    setCoApplicantExistingBackImageName('');
    setCoApplicantFrontImageRemoved(false);
    setCoApplicantBackImageRemoved(false);
    setShowCoApplicant(false);
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
        <Text style={styles.Subheader}>Upload Aadhar Card Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>
          Main Applicant Aadhar Card Details
        </Text>
        <Input
          label="Name as per Aadhar Card"
          value={nameAdhar}
          onChangeText={text => {
            setNameAdhar(text);
            if (errors.nameAdhar && text.trim()) {
              setErrors(prev => ({...prev, nameAdhar: false}));
            }
          }}
          containerStyle={[
            {marginBottom: scaleHeight(24)},
            errors.nameAdhar && {
              borderColor: Colors.red,
              borderWidth: 1,
              borderRadius: 5,
            },
          ]}
        />
        <Input
          label="Aadhar number"
          value={adharNumber}
          onChangeText={text => {
            const formatted = text.replace(/[^\d]/g, '').slice(0, 12);
            setAdharNumber(formatted);
            if (errors.adharNumber && formatted.trim()) {
              setErrors(prev => ({...prev, adharNumber: false}));
            }
            if (errors.adharNumberFormat && isValidAadhaar(formatted)) {
              setErrors(prev => ({...prev, adharNumberFormat: false}));
            }
          }}
          keyboardType="numeric"
          containerStyle={[
            {marginBottom: scaleHeight(24)},
            (errors.adharNumber || errors.adharNumberFormat) && {
              borderColor: Colors.red,
              borderWidth: 1,
              borderRadius: 5,
            },
          ]}
        />
        {errors.adharNumberFormat && adharNumber.length === 12 && (
          <Text style={styles.errorText}>
            Invalid Aadhaar number. Must be 12 digits.
          </Text>
        )}

        {personalKycLoading ? (
          <View style={styles.imageContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading existing Aadhar image...</Text>
          </View>
        ) : existingFrontImageUrl && !frontImageRemoved && !frontImage ? (
          <View style={styles.imageContainer}>
            <View style={styles.thumbnailContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FullImage', {imageUrl: existingFrontImageUrl})}
                style={styles.existingImageContainer}>
                <Image
                  source={{uri: existingFrontImageUrl}}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => {
                setFrontImageRemoved(true);
                setExistingFrontImageName('');
                setFrontImage(undefined);
                setErrors({...errors, frontImage: false});
              }}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={() => {
                setUploadType('mainFront');
                setIsVisible(true);
              }}>
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : frontImage ? (
          <View style={styles.imageContainer}>
            <View style={styles.thumbnailContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FullImage', {imageUrl: frontImage.uri})}
                style={styles.existingImageContainer}>
                <Image
                  source={{uri: frontImage.uri}}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setFrontImage(undefined)}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <DashedButton
              label="Upload Front side of Aadhar"
              onPress={() => {
                setUploadType('mainFront');
                setIsVisible(true);
              }}
              containerStyle={
                errors.frontImage ? {borderColor: Colors.red} : undefined
              }
            />
            <Text style={styles.errorText}>Document is required</Text>
          </View>
        )}

        {personalKycLoading ? (
          <View style={styles.imageContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading existing Aadhar image...</Text>
          </View>
        ) : existingBackImageUrl && !backImageRemoved && !backImage ? (
          <View style={styles.imageContainer}>
            <View style={styles.thumbnailContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FullImage', {imageUrl: existingBackImageUrl})}
                style={styles.existingImageContainer}>
                <Image
                  source={{uri: existingBackImageUrl}}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => {
                setBackImageRemoved(true);
                setExistingBackImageName('');
                setBackImage(undefined);
                setErrors({...errors, backImage: false});
              }}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={() => {
                setUploadType('mainBack');
                setIsVisible(true);
              }}>
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : backImage ? (
          <View style={styles.imageContainer}>
            <View style={styles.thumbnailContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FullImage', {imageUrl: backImage.uri})}
                style={styles.existingImageContainer}>
                <Image
                  source={{uri: backImage.uri}}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setBackImage(undefined)}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <DashedButton
              label="Upload Back side of Aadhar"
              onPress={() => {
                setUploadType('mainBack');
                setIsVisible(true);
              }}
              containerStyle={
                errors.backImage ? {borderColor: Colors.red} : undefined
              }
            />
            <Text style={styles.errorText}>Document is required</Text>
          </View>
        )}

        {!showCoApplicant && (
          <TouchableOpacity
            onPress={() => setShowCoApplicant(true)}
            style={styles.addCoApplicantButton}>
            <Text style={styles.addCoApplicantText}>Add Co-Applicant</Text>
            <Text style={styles.addCoApplicantPlus}>＋</Text>
          </TouchableOpacity>
        )}

        {showCoApplicant && (
          <>
            <Text style={styles.sectionTitle}>
              Co-Applicant Aadhar Card Details
            </Text>
            <Input
              label="Name as per Aadhar"
              value={coApplicantNameAdhar}
              onChangeText={text => {
                setCoApplicantNameAdhar(text);
                if (errors.coApplicantNameAdhar && text.trim()) {
                  setErrors(prev => ({...prev, coApplicantNameAdhar: false}));
                }
              }}
              containerStyle={[
                {marginBottom: scaleHeight(24)},
                errors.coApplicantNameAdhar && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 5,
                },
              ]}
            />
            <Input
              label="Aadhar number"
              value={coApplicantAdharNumber}
              onChangeText={text => {
                const formatted = text.replace(/[^\d]/g, '').slice(0, 12);
                setCoApplicantAdharNumber(formatted);
                if (errors.coApplicantAdharNumber && formatted.trim()) {
                  setErrors(prev => ({...prev, coApplicantAdharNumber: false}));
                }
                if (
                  errors.coApplicantAdharNumberFormat &&
                  isValidAadhaar(formatted)
                ) {
                  setErrors(prev => ({
                    ...prev,
                    coApplicantAdharNumberFormat: false,
                  }));
                }
              }}
              keyboardType="numeric"
              containerStyle={[
                {marginBottom: scaleHeight(24)},
                (errors.coApplicantAdharNumber ||
                  errors.coApplicantAdharNumberFormat) && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 5,
                },
              ]}
            />
            {errors.coApplicantAdharNumberFormat &&
              coApplicantAdharNumber.length === 12 && (
                <Text style={styles.errorText}>
                  Invalid Aadhaar format. Must be 12 digits.
                </Text>
              )}
            {personalKycLoading ? (
              <View style={styles.imageContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading existing Aadhar image...</Text>
              </View>
            ) : coApplicantExistingFrontImageUrl && !coApplicantFrontImageRemoved && !coApplicantFrontImage ? (
              <View style={styles.imageContainer}>
                <View style={styles.thumbnailContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FullImage', {imageUrl: coApplicantExistingFrontImageUrl})}
                    style={styles.existingImageContainer}>
                    <Image
                      source={{uri: coApplicantExistingFrontImageUrl}}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setCoApplicantFrontImageRemoved(true);
                    setCoApplicantExistingFrontImageName('');
                    setCoApplicantFrontImage(undefined);
                    setErrors({...errors, coApplicantFrontImage: false});
                  }}>
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => {
                    setUploadType('coFront');
                    setIsVisible(true);
                  }}>
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : coApplicantFrontImage ? (
              <View style={styles.imageContainer}>
                <View style={styles.thumbnailContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FullImage', {imageUrl: coApplicantFrontImage.uri})}
                    style={styles.existingImageContainer}>
                    <Image
                      source={{uri: coApplicantFrontImage.uri}}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setCoApplicantFrontImage(undefined)}>
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <DashedButton
                  label="Upload Front side of Aadhar"
                  onPress={() => {
                    setUploadType('coFront');
                    setIsVisible(true);
                  }}
                  containerStyle={
                    errors.coApplicantFrontImage
                      ? {borderColor: Colors.red}
                      : undefined
                  }
                />
                <Text style={styles.errorText}>Document is required</Text>
              </View>
            )}
            {personalKycLoading ? (
              <View style={styles.imageContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading existing Aadhar image...</Text>
              </View>
            ) : coApplicantExistingBackImageUrl && !coApplicantBackImageRemoved && !coApplicantBackImage ? (
              <View style={styles.imageContainer}>
                <View style={styles.thumbnailContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FullImage', {imageUrl: coApplicantExistingBackImageUrl})}
                    style={styles.existingImageContainer}>
                    <Image
                      source={{uri: coApplicantExistingBackImageUrl}}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setCoApplicantBackImageRemoved(true);
                    setCoApplicantExistingBackImageName('');
                    setCoApplicantBackImage(undefined);
                    setErrors({...errors, coApplicantBackImage: false});
                  }}>
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => {
                    setUploadType('coBack');
                    setIsVisible(true);
                  }}>
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : coApplicantBackImage ? (
              <View style={styles.imageContainer}>
                <View style={styles.thumbnailContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FullImage', {imageUrl: coApplicantBackImage.uri})}
                    style={styles.existingImageContainer}>
                    <Image
                      source={{uri: coApplicantBackImage.uri}}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setCoApplicantBackImage(undefined)}>
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <DashedButton
                  label="Upload Back side of Aadhar"
                  onPress={() => {
                    setUploadType('coBack');
                    setIsVisible(true);
                  }}
                  containerStyle={
                    errors.coApplicantBackImage
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
          allowedFileTypes={['jpg', 'jpeg', 'png']}
          onClose={file => {
            if (file) {
              setUploading(true);
              setTimeout(() => {
                switch (uploadType) {
                  case 'mainFront':
                    setFrontImage(file);
                    if (errors.frontImage)
                      setErrors(prev => ({...prev, frontImage: false}));
                    break;
                  case 'mainBack':
                    setBackImage(file);
                    if (errors.backImage)
                      setErrors(prev => ({...prev, backImage: false}));
                    break;
                  case 'coFront':
                    setCoApplicantFrontImage(file);
                    if (errors.coApplicantFrontImage)
                      setErrors(prev => ({
                        ...prev,
                        coApplicantFrontImage: false,
                      }));
                    break;
                  case 'coBack':
                    setCoApplicantBackImage(file);
                    if (errors.coApplicantBackImage)
                      setErrors(prev => ({
                        ...prev,
                        coApplicantBackImage: false,
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
            {/* <TouchableOpacity
              style={[styles.saveButton, {backgroundColor: Colors.white}]}
              activeOpacity={0.7}>
              <Text style={[styles.saveText, {color: Colors.green}]}>Save</Text>
            </TouchableOpacity> */}
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
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
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
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginVertical: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#B0B0B0',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: Colors.LimeGray,
  },
  uploadText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontWeight: fontWeight.Medium,
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
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#888',
  },
  buttonRow: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  footerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
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
  addCoApplicantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2.5,
    borderColor: Colors.graybase,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    alignSelf: 'flex-start', // prevents full width
    marginTop: scaleHeight(24),
    minWidth: scaleWidth(140), // keeps it compact but wide enough
  },
  addCoApplicantText: {
    fontSize: scaleFont(14),
    color: '#7A7A7A',
    fontWeight: fontWeight.Medium,
  },
  addCoApplicantPlus: {
    fontSize: scaleFont(16),
    color: '#7A7A7A',
    fontWeight: fontWeight.Bold,
    marginLeft: scaleWidth(6),
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
});