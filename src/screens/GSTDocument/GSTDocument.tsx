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
import {clientActions} from '@store/client';
import {HomeNavigatorType, KycNavigatorType} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

export const GSTDocument = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'GSTDocument'>>();
  const [errors, setErrors] = useState({
    nameonGstCertificate: false,
    gstNumber: false,
    gstNumberFormat: false,
    gstImage: false,
  });
  const [nameonGstCertificate, setNameonGstCertificate] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstImage, setGstImage] = useState<
    DocumentPickerResponse | undefined
  >();

  const dispatch = useDispatch();

  const isValidGSTIN = (gst: string) => {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
    return regex.test(gst);
  };

  const handleSubmit = () => {
    if (
      !nameonGstCertificate ||
      !gstNumber ||
      !gstImage ||
      !isValidGSTIN(gstNumber)
    ) {
      setErrors({
        nameonGstCertificate: !nameonGstCertificate,
        gstNumber: !gstNumber,
        gstNumberFormat: !gstNumber || !isValidGSTIN(gstNumber),
        gstImage: !gstImage,
      });

      let missingFields = [];
      if (!nameonGstCertificate) missingFields.push('Name as GST Certificate');
      if (!gstNumber) missingFields.push('GST Number');
      if (gstNumber && !isValidGSTIN(gstNumber))
        missingFields.push('Invalid GST Number (15 chars, proper format)');
      if (!gstImage) missingFields.push('GST Image');

      Alert.alert(
        'Missing Fields',
        `Please Provide the following:\n${missingFields.join('\n')}`,
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
      clientId: params.clientID,
      uploaded_by: getUserFullName(),
      doc: {
        uri: gstImage.uri,
        name: gstImage.name ?? `${Date.now()}-gst.jpg`,
        type: gstImage.type ?? 'image/jpeg',
      },
      name_as_per_gst: nameonGstCertificate,
      gst_number: gstNumber,
      params: 'GST',
    };

    setLoading(true);
    dispatch(clientActions.uploadGstRequest(payload));
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Document Uploadded',
        text2: `${nameonGstCertificate}'s document submitted succesfully`,
      });
      handleClear();
    }, 1500);
  };

  const handleClear = () => {
    setNameonGstCertificate('');
    setGstNumber('');
    setGstImage(undefined);
  };

  {
    loading && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color={Colors.primaryColor} />
      </View>
    );
  }

  return (
    <Container>
      {(loading || uploading) && (
        <View style={styles.centeredLoader} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
      <AppBar title="KYC Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Upload GST Document Details</Text>
      </View>
      <View style={styles.mainContainer}>
        <View>
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

          {gstImage ? (
            <Text>File Name: {gstImage.name}</Text>
          ) : (
            <DashedButton
              label="Upload GST Certificate"
              onPress={() => setIsVisible(true)}
              containerStyle={
                errors.gstImage ? {borderColor: Colors.red} : undefined
              }
            />
          )}

          <UploadModal
            visible={isVisible}
            onClose={file => {
              if (file) {
                setUploading(true);
                setTimeout(() => {
                  setGstImage(file);
                  if (errors.gstImage)
                    setErrors(prev => ({...prev, gstImage: false}));
                  setUploading(false);
                  setIsVisible(false);
                }, 1200);
              } else {
                setIsVisible(false);
              }
            }}
          />
        </View>

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
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: scaleWidth(24),
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
});
