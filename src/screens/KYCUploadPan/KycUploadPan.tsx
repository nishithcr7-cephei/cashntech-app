import {RightCheckmark} from '@assets/Icons';
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
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {clientActions} from '@store/client';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import moment from 'moment';
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

export const KycUplaodPan = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({
    namePan: false,
    panNumber: false,
    panNumberFormat: false,
    dateofBirth: false,
    coApplicantNamePan: false,
    coApplicantPanNumber: false,
    coApplicantPanNumberFormat: false,
    coApplicantDateofBirth: false,
    frontImage: false,
    backImage: false,
    coApplicantFrontImage: false,
    coApplicantBackImage: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState<
    'mainFront' | 'mainBack' | 'coFront' | 'coBack' | null
  >(null);

  const [namePan, setNamePan] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dateofBirth, setDateofBirth] = useState('');
  const [frontImage, setFrontImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [backImage, setBackImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [coApplicantNamePan, setCoApplicantNamePan] = useState('');
  const [coApplicantPanNumber, setCoApplicantPanNumber] = useState('');
  const [coApplicantDateofBirth, setCoApplicantDateofBirth] = useState('');
  const [coApplicantFrontImage, setCoApplicantFrontImage] = useState<
    DocumentPickerResponse | undefined
  >();
  const [coApplicantBackImage, setCoApplicantBackImage] = useState<
    DocumentPickerResponse | undefined
  >();

  const dispatch = useDispatch();

  const isValidPANFormat = (pan: string): boolean => {
    if (!pan || pan.length !== 10) return false;

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const handleSubmit = () => {
    if (
      !namePan ||
      !panNumber ||
      !dateofBirth ||
      !frontImage ||
      !backImage ||
      !coApplicantNamePan ||
      !coApplicantPanNumber ||
      !coApplicantDateofBirth ||
      !coApplicantFrontImage ||
      !coApplicantBackImage
    ) {
      setErrors({
        namePan: !namePan,
        panNumber: !panNumber,
        panNumberFormat: !panNumber || !isValidPANFormat(panNumber),
        dateofBirth: !dateofBirth,
        coApplicantNamePan: !coApplicantNamePan,
        coApplicantPanNumber: !coApplicantPanNumber,
        coApplicantPanNumberFormat:
          !coApplicantPanNumber || !isValidPANFormat(coApplicantPanNumber),
        coApplicantDateofBirth: !coApplicantDateofBirth,
        frontImage: !frontImage,
        backImage: !backImage,
        coApplicantFrontImage: !coApplicantFrontImage,
        coApplicantBackImage: !coApplicantBackImage,
      });

      let missingFields = [];
      if (!namePan) missingFields.push('Name as Pan');
      if (!panNumber) missingFields.push('Pan Number');
      if (panNumber && !isValidPANFormat(panNumber))
        missingFields.push('Invalid PAN Number Format');
      if (!dateofBirth) missingFields.push('Date of Birth');
      if (!frontImage) missingFields.push('Front Image');
      if (!backImage) missingFields.push('Back Image');
      if (!coApplicantNamePan) missingFields.push('CoApplicant Name as Pan');
      if (!coApplicantPanNumber) missingFields.push('CoApplicant Pan Number');
      if (coApplicantPanNumber && !isValidPANFormat(coApplicantPanNumber))
        missingFields.push('Invalid Co-Applicant PAN Number Format');
      if (!coApplicantDateofBirth)
        missingFields.push('CoApplicant Date of Birth');
      if (!coApplicantFrontImage) missingFields.push('CoApplicant front image');
      if (!coApplicantBackImage) missingFields.push('CoApplicant back image');

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
      coApplicantNamePan: false,
      coApplicantPanNumber: false,
      coApplicantPanNumberFormat: false,
      coApplicantDateofBirth: false,
      frontImage: false,
      backImage: false,
      coApplicantFrontImage: false,
      coApplicantBackImage: false,
    });

    const allFieldsFilled =
      namePan &&
      panNumber &&
      dateofBirth &&
      frontImage &&
      backImage &&
      coApplicantNamePan &&
      coApplicantPanNumber &&
      coApplicantDateofBirth &&
      coApplicantFrontImage &&
      coApplicantBackImage;

    if (allFieldsFilled) {
      const payload = {
        clientId: 22,
        uploaded_by: getUserFullName(),
        doc: [
          {
            name_as_per_pan: namePan,
            pan_number: panNumber,
            dob: dateofBirth,
          },
          {
            name_as_per_pan: coApplicantNamePan,
            pan_number: coApplicantPanNumber,
            dob: coApplicantDateofBirth,
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
      dispatch(clientActions.uploadPanRequest(payload));
      setTimeout(() => {
        setLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Document Uploaded',
          text2: `${namePan}'s document submitted successfully`,
          position: 'top',
        });
        handleClear();
      }, 1500);
    } else {
      console.warn('Please fill all required PAN details and upload images.');
    }
  };

  const handleClear = () => {
    setNamePan('');
    setPanNumber('');
    setDateofBirth('');
    setFrontImage(undefined);
    setBackImage(undefined);
    setCoApplicantNamePan('');
    setCoApplicantPanNumber('');
    setCoApplicantDateofBirth('');
    setCoApplicantFrontImage(undefined);
    setCoApplicantBackImage(undefined);
  };

  return (
    <Container>
      {(loading || uploading) && (
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
      <ScrollView contentContainerStyle={styles.container}>
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
          }}
          datePickerProps={{
            mode: 'date',
            maximumDate: new Date(),
          }}
        />

        {frontImage ? (
          <Text>File Name: {frontImage.name}</Text>
        ) : (
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
        )}

        {backImage ? (
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
        )}

        {/* Co Applicant Section */}
        <Text style={styles.sectionTitle}>Co Applicant PAN Card Details</Text>
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
              setErrors(prev => ({...prev, coApplicantPanNumberFormat: false}));
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
              Invalid PAN format. Expected: ABCDE1234F (5 letters + 4 digits + 1
              letter)
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
          }}
          datePickerProps={{
            mode: 'date',
            maximumDate: new Date(),
          }}
        />

        {coApplicantFrontImage ? (
          <Text>File Name: {coApplicantFrontImage.name}</Text>
        ) : (
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
        )}

        {coApplicantBackImage ? (
          <Text>File Name: {coApplicantBackImage.name}</Text>
        ) : (
          <DashedButton
            label="Upload Back side of PAN"
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
