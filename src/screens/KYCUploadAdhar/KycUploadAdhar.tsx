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
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {clientActions} from '@store/client';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleWidth, scaleHeight, scaleFont} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useDispatch} from 'react-redux';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const KycUploadAdhar = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);

  const [uploading, setUploading] = useState(false);
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

  const dispatch = useDispatch();

  const isValidAadhaar = (num: string) => /^\d{12}$/.test(num);

  const handleSubmit = () => {
    if (
      !nameAdhar ||
      !adharNumber ||
      !frontImage ||
      !backImage ||
      !coApplicantNameAdhar ||
      !coApplicantAdharNumber ||
      !coApplicantFrontImage ||
      !coApplicantBackImage ||
      !isValidAadhaar(adharNumber) ||
      !isValidAadhaar(coApplicantAdharNumber)
    ) {
      setErrors({
        nameAdhar: !nameAdhar,
        adharNumber: !adharNumber,
        adharNumberFormat: !adharNumber || !isValidAadhaar(adharNumber),
        coApplicantNameAdhar: !coApplicantNameAdhar,
        coApplicantAdharNumber: !coApplicantAdharNumber,
        coApplicantAdharNumberFormat:
          !coApplicantAdharNumber || !isValidAadhaar(coApplicantAdharNumber),
        frontImage: !frontImage,
        backImage: !backImage,
        coApplicantFrontImage: !coApplicantFrontImage,
        coApplicantBackImage: !coApplicantBackImage,
      });

      let missingFields = [];
      if (!nameAdhar) missingFields.push('Name as Pan');
      if (!adharNumber) missingFields.push('Aadhaar Number');
      if (adharNumber && !isValidAadhaar(adharNumber))
        missingFields.push('Invalid Aadhaar Number (12 digits required)');
      if (!frontImage) missingFields.push('Front Image');
      if (!backImage) missingFields.push('Back Image');
      if (!coApplicantNameAdhar) missingFields.push('CoApplicant Name as Pan');
      if (!coApplicantAdharNumber)
        missingFields.push('CoApplicant Aadhaar Number');
      if (coApplicantAdharNumber && !isValidAadhaar(coApplicantAdharNumber))
        missingFields.push(
          'Invalid Co-Applicant Aadhaar Number (12 digits required)',
        );
      if (!coApplicantFrontImage) missingFields.push('CoApplicant front image');
      if (!coApplicantBackImage) missingFields.push('CoApplicant back image');

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
      frontImage &&
      backImage &&
      coApplicantNameAdhar &&
      coApplicantAdharNumber &&
      coApplicantFrontImage &&
      coApplicantBackImage;

    if (allFieldsFilled) {
      const payload = {
        clientId: 22,
        uploaded_by: getUserFullName(),
        doc: [
          {
            name_as_per_aadhar: nameAdhar,
            aadhar_number: adharNumber,
          },
          {
            name_as_per_aadhar: coApplicantNameAdhar,
            aadhar_number: coApplicantAdharNumber,
          },
        ],
        files: [
          {
            uri: frontImage.uri,
            name: frontImage.name ?? Date.now().toString(),
            type: frontImage.type ?? 'image/png',
          },
          {
            uri: backImage.uri,
            name: backImage.name ?? Date.now().toString(),
            type: backImage.type ?? 'image/png',
          },
          {
            uri: coApplicantFrontImage.uri,
            name: coApplicantFrontImage.name ?? Date.now().toString(),
            type: coApplicantFrontImage.type ?? 'image/png',
          },
          {
            uri: coApplicantBackImage.uri,
            name: coApplicantBackImage.name ?? Date.now().toString(),
            type: coApplicantBackImage.type ?? 'image/png',
          },
        ],
      };

      setLoading(true);
      dispatch(clientActions.uploadAdharRequest(payload));
      setTimeout(() => {
        setLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Document Uploaded',
          text2: `${nameAdhar}'s document submitted successfully`,
          position: 'top',
        });
        handleClear();
      }, 1500);
    } else {
      console.warn('Please fill all required Adhar Details and upload images.');
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
  };

  return (
    <Container>
      {(loading || uploading) && (
        <View style={styles.centeredLoader} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
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

        {frontImage ? (
          <Text>File Name: {frontImage.name}</Text>
        ) : (
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
        )}

        {backImage ? (
          <Text>File Name: {backImage.name}</Text>
        ) : (
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
        )}

        {/* Co Applicant Section */}
        <Text style={styles.sectionTitle}>
          Co Applicant Aadhar Card Details
        </Text>
        <Input
          label="Name as per Aadhar Card"
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
              Invalid Aadhaar number. Must be 12 digits.
            </Text>
          )}

        {coApplicantFrontImage ? (
          <Text>File Name: {coApplicantFrontImage.name}</Text>
        ) : (
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
        )}

        {coApplicantBackImage ? (
          <Text>File Name: {coApplicantBackImage.name}</Text>
        ) : (
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
                    break;
                  case 'mainBack':
                    setBackImage(file);
                    break;
                  case 'coFront':
                    setCoApplicantFrontImage(file);
                    break;
                  case 'coBack':
                    setCoApplicantBackImage(file);
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
              style={[styles.saveButton, {backgroundColor: Colors.white}]}
              activeOpacity={0.7}>
              <Text style={[styles.saveText, {color: Colors.green}]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.7}
              onPress={handleSubmit}>
              <Text style={styles.saveText}>Submit</Text>
              <RightCheckmark width={12} height={12} />
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
});
