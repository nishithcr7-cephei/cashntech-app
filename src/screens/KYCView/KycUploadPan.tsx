import {RightCheckmarkWhite} from '@assets/Icons';
import {
  Container,
  AppBar,
  Input,
  DashedButton,
  UploadModal,
  DateNTimePicker,
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
import moment from 'moment';
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

export const KycUplaodPan = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState<
    'mainFront' | 'mainBack' | 'coFront' | 'coBack' | null
  >(null);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'KycUploadDoc'>>();
  const [namePan, setNamePan] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dateofBirth, setDateofBirth] = useState('');
  const [frontImage, setFrontImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [coApplicantNamePan, setCoApplicantNamePan] = useState('');
  const [coApplicantPanNumber, setCoApplicantPanNumber] = useState('');
  const [coApplicantDateofBirth, setCoApplicantDateofBirth] = useState('');
  const [coApplicantFrontImage, setCoApplicantFrontImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [showCoApplicant, setShowCoApplicant] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Existing PAN data states
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageName, setExistingImageName] = useState<string>('');
  const [imageRemoved, setImageRemoved] = useState(false);
  
  // Co-applicant existing data states
  const [coApplicantExistingImageUrl, setCoApplicantExistingImageUrl] = useState<string | null>(null);
  const [coApplicantExistingImageName, setCoApplicantExistingImageName] = useState<string>('');
  const [coApplicantImageRemoved, setCoApplicantImageRemoved] = useState(false);

  const [errors, setErrors] = useState({
    namePan: false,
    panNumber: false,
    panNumberFormat: false,
    dateofBirth: false,
    dateofBirthAge: false,
    coApplicantNamePan: false,
    coApplicantPanNumber: false,
    coApplicantPanNumberFormat: false,
    coApplicantDateofBirth: false,
    coApplicantDateofBirthAge: false,
    frontImage: false,
    coApplicantFrontImage: false,
  });

  const dispatch = useDispatch();
  
  // Redux state
  const {personalKycLoading, personalKycData, personalKycError} = useSelector(
    (state: RootState) => state.kyc
  );

  // Fetch existing PAN data using Redux Saga
  const fetchExistingPan = () => {
    if (!params?.clientID) {
      return;
    }
    
    dispatch(kycActions.getPersonalKycRequest({
      clientId: params.clientID.toString(),
      docType: 'pan'
    }));
  };

  // Handle Redux state changes
  useEffect(() => {
    if (personalKycData && personalKycData.length > 0) {
      const panRecords = personalKycData;
      
      // Process main applicant (first record)
      if (panRecords.length > 0) {
        const mainApplicantData = panRecords[0];
        
        const fileName = mainApplicantData.filename_obj?.pan?.file_name;
        const nameAsPerPan = mainApplicantData.filename_obj?.pan?.name_as_per_pan;
        const panNumber = mainApplicantData.filename_obj?.pan?.pan_number;
        const dob = mainApplicantData.filename_obj?.pan?.dob;
        
        if (fileName) {
          // Construct full image URL for main applicant
          const fullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
          
          setExistingImageUrl(fullImageUrl);
          setExistingImageName(fileName);
          
          // Pre-fill form fields if available
          if (nameAsPerPan) {
            setNamePan(nameAsPerPan);
          }
          if (panNumber) {
            setPanNumber(panNumber);
          }
          if (dob) {
            setDateofBirth(dob);
          }
        }
      }
      
      // Process co-applicant (second record if exists)
      if (panRecords.length > 1) {
        const coApplicantData = panRecords[1];
        
        const coFileName = coApplicantData.filename_obj?.pan?.file_name;
        const coNameAsPerPan = coApplicantData.filename_obj?.pan?.name_as_per_pan;
        const coPanNumber = coApplicantData.filename_obj?.pan?.pan_number;
        const coDob = coApplicantData.filename_obj?.pan?.dob;
        
        if (coFileName) {
          // Construct full image URL for co-applicant
          const coFullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${coFileName}`;
          
          setCoApplicantExistingImageUrl(coFullImageUrl);
          setCoApplicantExistingImageName(coFileName);
          
          // Pre-fill co-applicant form fields if available
          if (coNameAsPerPan) {
            setCoApplicantNamePan(coNameAsPerPan);
          }
          if (coPanNumber) {
            setCoApplicantPanNumber(coPanNumber);
          }
          if (coDob) {
            setCoApplicantDateofBirth(coDob);
          }
          
          // Show co-applicant section if data exists
          setShowCoApplicant(true);
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
        text2: 'Failed to fetch existing PAN data',
        position: 'top',
      });
    }
  }, [personalKycError]);

  // Fetch existing PAN data on component mount
  useEffect(() => {
    fetchExistingPan();
  }, [params?.clientID]);

  const isValidPANFormat = (pan: string): boolean => {
    if (!pan || pan.length !== 10) return false;

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const isValidAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return false;
    
    const today = moment();
    const dob = moment(dateOfBirth, 'DD-MM-YYYY');
    const age = today.diff(dob, 'years');
    
    return age >= 18 && age <= 60;
  };

  const handleSubmit = () => {
    if (
      !namePan ||
      !panNumber ||
      !dateofBirth ||
      !isValidAge(dateofBirth) ||
      (!frontImage && !existingImageUrl) ||
      (showCoApplicant &&
        (!coApplicantNamePan ||
          !coApplicantPanNumber ||
          !coApplicantDateofBirth ||
          !isValidAge(coApplicantDateofBirth) ||
          (!coApplicantFrontImage && !coApplicantExistingImageUrl)))
    ) {
      setErrors({
        namePan: !namePan,
        panNumber: !panNumber,
        panNumberFormat: !panNumber || !isValidPANFormat(panNumber),
        dateofBirth: !dateofBirth,
        dateofBirthAge: Boolean(dateofBirth && !isValidAge(dateofBirth)),
        frontImage: !frontImage && !existingImageUrl,

        // Co-applicant validations only if shown
        coApplicantNamePan: showCoApplicant ? !coApplicantNamePan : false,
        coApplicantPanNumber: showCoApplicant ? !coApplicantPanNumber : false,
        coApplicantPanNumberFormat:
          showCoApplicant && coApplicantPanNumber
            ? !isValidPANFormat(coApplicantPanNumber)
            : false,
        coApplicantDateofBirth: showCoApplicant
          ? !coApplicantDateofBirth
          : false,
        coApplicantDateofBirthAge: showCoApplicant ? Boolean(coApplicantDateofBirth && !isValidAge(coApplicantDateofBirth)) : false,
        coApplicantFrontImage: showCoApplicant ? (!coApplicantFrontImage && !coApplicantExistingImageUrl) : false,
      });

      let missingFields = [];
      if (!namePan) missingFields.push('Name as per PAN');
      if (!panNumber) missingFields.push('PAN Number');
      if (panNumber && !isValidPANFormat(panNumber))
        missingFields.push('Invalid PAN Number Format');
      if (!dateofBirth) missingFields.push('Date of Birth');
      if (dateofBirth && !isValidAge(dateofBirth))
        missingFields.push('Age must be between 18 and 60 years');
      if (!frontImage && !existingImageUrl) missingFields.push('Front Image');

      if (showCoApplicant) {
        if (!coApplicantNamePan) missingFields.push('Co-Applicant Name');
        if (!coApplicantPanNumber)
          missingFields.push('Co-Applicant PAN Number');
        if (coApplicantPanNumber && !isValidPANFormat(coApplicantPanNumber))
          missingFields.push('Invalid Co-Applicant PAN Number Format');
        if (!coApplicantDateofBirth)
          missingFields.push('Co-Applicant Date of Birth');
        if (coApplicantDateofBirth && !isValidAge(coApplicantDateofBirth))
          missingFields.push('Co-Applicant age must be between 18 and 60 years');
        if (!coApplicantFrontImage && !coApplicantExistingImageUrl)
          missingFields.push('Co-Applicant Front Image');
      }

      Alert.alert(
        'Missing Fields',
        `Please provide the Following:\n${missingFields.join('\n')}`,
      );
      return;
    }

    setErrors({
      namePan: false,
      panNumber: false,
      panNumberFormat: false,
      dateofBirth: false,
      dateofBirthAge: false,
      coApplicantNamePan: false,
      coApplicantPanNumber: false,
      coApplicantPanNumberFormat: false,
      coApplicantDateofBirth: false,
      coApplicantDateofBirthAge: false,
      frontImage: false,
      coApplicantFrontImage: false,
    });

    const allFieldsFilled =
      namePan &&
      panNumber &&
      isValidPANFormat(panNumber) &&
      dateofBirth &&
      isValidAge(dateofBirth) &&
      (frontImage || existingImageUrl) &&
      (!showCoApplicant ||
        (coApplicantNamePan &&
          coApplicantPanNumber &&
          isValidPANFormat(coApplicantPanNumber) &&
          coApplicantDateofBirth &&
          isValidAge(coApplicantDateofBirth) &&
          (coApplicantFrontImage || coApplicantExistingImageUrl)));

    if (allFieldsFilled) {
      const payload = {
        clientId: Number(params.clientID),
        uploaded_by: getUserFullName(),
        doc: [
          {
            name_as_per_pan: namePan,
            pan_number: panNumber,
            dob: dateofBirth,
          },
          ...(showCoApplicant
            ? [
                {
                  name_as_per_pan: coApplicantNamePan,
                  pan_number: coApplicantPanNumber,
                  dob: coApplicantDateofBirth,
                },
              ]
            : []),
        ],
        files: [
          ...(frontImage ? [{
            uri: frontImage.uri,
            name: frontImage.name ?? Date.now().toString(),
            type: frontImage.type ?? 'image/png',
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
        ],
      };

      setLoading(true);
      dispatch(kycActions.uploadPanRequest(payload));
      
      // Simulate API call delay and handle success
      setTimeout(() => {
        setLoading(false);
        Toast.show({
          type: 'success',
          text1: isEditing ? 'Document Updated' : 'Document Uploaded',
          text2: `${namePan}'s document ${isEditing ? 'updated' : 'submitted'} successfully`,
          position: 'top',
        });
        
        // Clear form and navigate back
        handleClear();
        navigation.goBack();
      }, 1500);
    } else {
      // Please fill all required PAN details and upload images
    }
  };

  const handleClear = () => {
    setNamePan('');
    setPanNumber('');
    setDateofBirth('');
    setFrontImage(undefined);
    setCoApplicantNamePan('');
    setCoApplicantPanNumber('');
    setCoApplicantDateofBirth('');
    setCoApplicantFrontImage(undefined);
    setExistingImageUrl(null);
    setExistingImageName('');
    setImageRemoved(false);
    setCoApplicantExistingImageUrl(null);
    setCoApplicantExistingImageName('');
    setCoApplicantImageRemoved(false);
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
        <Text style={styles.Subheader}>Upload PAN Card Details</Text>
      </View>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Main Applicant Section */}
        <Text style={styles.sectionTitle}>Main Applicant PAN Card Details</Text>
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
          label="PAN number"
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

        <DateNTimePicker
          label="Date of Birth"
          value={dateofBirth}
          onConfirm={date => {
            const formatted = moment(date).format('DD-MM-YYYY');
            setDateofBirth(formatted);
            if (errors.dateofBirth) {
              setErrors(prev => ({...prev, dateofBirth: false}));
            }
            if (errors.dateofBirthAge && isValidAge(formatted)) {
              setErrors(prev => ({...prev, dateofBirthAge: false}));
            }
          }}
          datePickerProps={{
            mode: 'date',
            maximumDate: new Date(),
          }}
        />
        {errors.dateofBirthAge && dateofBirth && (
          <Text style={styles.errorText}>
            Age must be between 18 and 60 years
          </Text>
        )}

        {personalKycLoading ? (
          <View style={styles.imageContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading existing PAN image...</Text>
          </View>
        ) : existingImageUrl && !imageRemoved && !frontImage ? (
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
              label="Upload Front side of PAN"
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

        {/* {backImage ? (
          <Text>File Name: {backImage.name}</Text>
        ) : (
          <DashedButton
            label="Upload Back side of PAN"
            onPress={() => {
              setUploadType('mainBack');
              setIsVisible(true);
            }}
            containerStyle={
              errors.backImage ? {borderColor: Colors.red} : undefined
            }
          />
        )} */}

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
              Co Applicant PAN Card Details
            </Text>
            <Input
              label="Name as per PAN"
              value={coApplicantNamePan}
              onChangeText={text => {
                setCoApplicantNamePan(text);
                if (errors.coApplicantNamePan && text.trim()) {
                  setErrors(prev => ({...prev, coApplicantNamePan: false}));
                }
              }}
              containerStyle={[
                {marginBottom: scaleHeight(24)},
                errors.coApplicantNamePan && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 5,
                },
              ]}
            />
            <Input
              label="PAN number"
              value={coApplicantPanNumber}
              onChangeText={text => {
                const formatted = text.toUpperCase().slice(0, 10);
                setCoApplicantPanNumber(formatted);

                if (errors.coApplicantPanNumber && formatted.trim()) {
                  setErrors(prev => ({...prev, coApplicantPanNumber: false}));
                }
                if (
                  errors.coApplicantPanNumberFormat &&
                  isValidPANFormat(formatted)
                ) {
                  setErrors(prev => ({
                    ...prev,
                    coApplicantPanNumberFormat: false,
                  }));
                }
              }}
              autoCapitalize="characters"
              containerStyle={[
                {marginBottom: scaleHeight(24)},
                (errors.coApplicantPanNumber ||
                  errors.coApplicantPanNumberFormat) && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 5,
                },
              ]}
            />
            {errors.coApplicantPanNumberFormat &&
              coApplicantPanNumber.length === 10 && (
                <Text style={styles.errorText}>
                  Invalid PAN format. Expected: ABCDE1234F (5 letters + 4 digits
                  + 1 letter)
                </Text>
              )}
            <DateNTimePicker
              label="Date of Birth"
              value={coApplicantDateofBirth}
              onConfirm={date => {
                const formatted = moment(date).format('DD-MM-YYYY');
                setCoApplicantDateofBirth(formatted);
                if (errors.coApplicantDateofBirth) {
                  setErrors(prev => ({...prev, coApplicantDateofBirth: false}));
                }
                if (errors.coApplicantDateofBirthAge && isValidAge(formatted)) {
                  setErrors(prev => ({...prev, coApplicantDateofBirthAge: false}));
                }
              }}
              datePickerProps={{
                mode: 'date',
                maximumDate: new Date(),
              }}
            />
            {errors.coApplicantDateofBirthAge && coApplicantDateofBirth && (
              <Text style={styles.errorText}>
                Age must be between 18 and 60 years
              </Text>
            )}
            {personalKycLoading ? (
              <View style={styles.imageContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading existing PAN image...</Text>
              </View>
            ) : coApplicantExistingImageUrl && !coApplicantImageRemoved && !coApplicantFrontImage ? (
              <View style={styles.imageContainer}>
                <View style={styles.thumbnailContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FullImage', {imageUrl: coApplicantExistingImageUrl})}
                    style={styles.existingImageContainer}>
                    <Image
                      source={{uri: coApplicantExistingImageUrl}}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setCoApplicantImageRemoved(true);
                    setCoApplicantExistingImageName('');
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
                  label="Upload Front side of PAN"
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
          </>
        )}

        <UploadModal
          visible={isVisible}
          allowedFileTypes={['jpg', 'png']}
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
                  case 'coFront':
                    setCoApplicantFrontImage(file);
                    if (errors.coApplicantFrontImage)
                      setErrors(prev => ({
                        ...prev,
                        coApplicantFrontImage: false,
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
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    paddingBottom: scaleHeight(40),
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