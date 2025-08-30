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
import {IUploadResidenceDetailsPayload} from '@store/client';
import {uploadResidenceRequest} from '@store/client/client.slice';
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

export const ResidenceDetail = () => {
  const navigation = useNavigation<KycNavigationType>();

  const [ownershipStatus, setOwnershipStatus] = useState<string | null>(null);
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

  const [errors, setErrors] = useState({
    nameofOwner: false,
    ownershipStatus: false,
    agreementCopy: false,
    electricityBill: false,
  });

  const dispatch = useDispatch();

  const handleSubmit = () => {
    const selectedFile =
      ownershipStatus === 'rented' ? agreementCopy : electricityBill;

    if (!nameofOwner || !ownershipStatus || !selectedFile) {
      setErrors({
        nameofOwner: !nameofOwner,
        ownershipStatus: !ownershipStatus,
        agreementCopy: ownershipStatus === 'rented' && !agreementCopy,
        electricityBill: ownershipStatus === 'owned' && !electricityBill,
      });

      let missingFields = [];

      if (!nameofOwner) missingFields.push('Name of Owner');
      if (!ownershipStatus) missingFields.push('Ownership Status');

      if (ownershipStatus === 'rented' && !agreementCopy) {
        missingFields.push('Agreement Copy');
      } else if (ownershipStatus === 'owned' && !electricityBill) {
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

    const payload: IUploadResidenceDetailsPayload = {
      doc: {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name,
      },
      clientId: params.clientID,
      uploaded_by: getUserFullName(),
      params: 'residenceProof',
      client_name: nameofOwner,
      name_of_owner: nameofOwner,
      ownership_status: ownershipStatus,
    };

    setLoading(true);
    dispatch(uploadResidenceRequest(payload));
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Document Uploaded',
        text2: `${nameofOwner}'s document submitted successfully`,
        position: 'top',
      });
      handleClear();
    }, 1500);
  };

  const handleClear = () => {
    setnameofOwner('');
    setAgreementCopy(undefined);
    setElectricityBill(undefined);
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
        <Text style={styles.Subheader}>Upload Residence Details</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Residence Details</Text>

          <CustomDropdown
            label="Ownership Status"
            data={[
              {label: 'Rented', value: 'rented'},
              {label: 'Owned', value: 'owned'},
            ]}
            value={ownershipStatus ?? undefined}
            onChange={val => setOwnershipStatus(val)}
            containerStyle={{marginBottom: scaleHeight(20)}}
          />

          {ownershipStatus && (
            <>
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

              {ownershipStatus === 'rented' ? (
                <>
                  {!agreementCopy ? (
                    <DashedButton
                      label="Upload Agreement Copy"
                      onPress={() => {
                        setUploadType('agreementCopy');
                        setIsVisible(true);
                      }}
                      containerStyle={
                        errors.agreementCopy
                          ? {borderColor: Colors.red}
                          : undefined
                      }
                    />
                  ) : (
                    <Text>File Name: {agreementCopy.name}</Text>
                  )}
                </>
              ) : (
                <>
                  {!electricityBill ? (
                    <DashedButton
                      label="Upload Electricity Bill"
                      onPress={() => {
                        setUploadType('electricityBill');
                        setIsVisible(true);
                      }}
                      containerStyle={
                        errors.electricityBill
                          ? {borderColor: Colors.red}
                          : undefined
                      }
                    />
                  ) : (
                    <Text>File Name: {electricityBill.name}</Text>
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
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.saveButton, {backgroundColor: Colors.white}]}
                    activeOpacity={0.7}>
                    <Text style={[styles.saveText, {color: Colors.green}]}>
                      Save
                    </Text>
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
            </>
          )}
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
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
  contentContainer: {
    flex: 1,
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
});
