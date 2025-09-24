import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import {DocumentPickerResponse} from '@react-native-documents/picker';

import {RightCheckmark, RightCheckmarkWhite, Upload} from '@assets/Icons';
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
import {kycActions, kycSelector} from '@store/kyc';
import {
  HomeNavigatorType,
  ClientNavigatorType,
  KycNavigatorType,
} from '@type/NavigatorTypes';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {getUserFullName} from '@utils/Utils';
import {FILE_DOWNLOAD_URL, API_URL} from '@config/config';
import {storage} from '@services/localStorage';
import StorageKeys from '@constants/StorageKeys';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const KycUploadDoc = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'KycUploadDoc'>>();
  const [name, setName] = useState('');
  const [image, setImage] = useState<DocumentPickerResponse | undefined>();
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingImageName, setExistingImageName] = useState<string>('');
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);


  const [errors, setErrors] = useState({
    name: false,
    image: false,
  });

  const dispatch = useDispatch();
  
  // Redux selectors
  const uploadKycLoading = useSelector(kycSelector.getUploadKycLoading);
  const uploadKycData = useSelector(kycSelector.getUploadKycData);
  const uploadKycError = useSelector(kycSelector.getUploadKycError);
  const personalKycLoading = useSelector(kycSelector.getPersonalKycLoading);
  const personalKycData = useSelector(kycSelector.getPersonalKycData);
  const personalKycError = useSelector(kycSelector.getPersonalKycError);

  // Fetch existing profile image data using Redux Saga
  const fetchExistingImage = () => {
    if (!params?.clientID) {
      return;
    }
    
    // Dispatch Redux action to fetch personal KYC documents
    dispatch(kycActions.getPersonalKycRequest({
      clientId: params.clientID.toString(),
      docType: 'profile'
    }));
  };

  // Fetch existing image on component mount
  useEffect(() => {
    fetchExistingImage();
    setIsEditMode(false); // Reset edit mode when client changes
  }, [params?.clientID]);

  // Handle Redux state changes for upload success/error
  useEffect(() => {
    if (uploadKycData) {
      // Upload successful
      setIsEditMode(false);
      Toast.show({
        type: 'success',
        text1: 'Document Uploaded',
        text2: `${name}'s document submitted successfully`,
        position: 'top',
      });
      handleClear();
      navigation.goBack();
    }
  }, [uploadKycData]);

  useEffect(() => {
    if (uploadKycError) {
      // Upload failed
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: uploadKycError,
        position: 'top',
      });
    }
  }, [uploadKycError]);

  // Handle personal KYC data from Redux
  useEffect(() => {
    if (personalKycData && personalKycData.length > 0) {
      const profileData = personalKycData[0];
      const fileName = profileData.filename_obj?.profile?.file_name;
      const clientName = profileData.filename_obj?.profile?.client_name;
      
      if (fileName) {
        // Construct full image URL
        const fullImageUrl = `${FILE_DOWNLOAD_URL}/KYC/client_${params.clientID}/${fileName}`;
        
        setExistingImageUrl(fullImageUrl);
        setExistingImageName(fileName);
        
        // Set the name if available
        if (clientName) {
          setName(clientName);
        }
      }
    }
  }, [personalKycData, params?.clientID]);

  // Handle personal KYC error
  useEffect(() => {
    if (personalKycError) {
      // Handle error silently or show user-friendly message
    }
  }, [personalKycError]);

  // Cleanup Redux state on component unmount
  useEffect(() => {
    return () => {
      dispatch(kycActions.clearUploadKyc());
      dispatch(kycActions.clearPersonalKyc());
    };
  }, [dispatch]);

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSave = () => {
    // Call the existing handleSubmit function which contains the API logic
    handleSubmit();
    setIsEditMode(false);
  };

  const handleSubmit = () => {
    if (!name || (!image && !existingImageUrl)) {
      setErrors({
        name: !name,
        image: !image && !existingImageUrl,
      });

      Alert.alert(
        'Missing Fields',
        !name && (!image && !existingImageUrl)
          ? 'Please enter Name and upload Image.'
          : `${!name ? 'Name' : 'Image'} is required.`,
      );
      return;
    }

    setErrors({name: false, image: false});

    const payload = {
      client_name: name,
      clientId: Number(params.clientID),
      doc: {
        name: image!.name ?? Date.now().toString(),
        type: image!.type ?? 'image/png',
        uri: image!.uri,
      },
      params: 'Profile',
      uploaded_by: getUserFullName(),
    };

    // Dispatch Redux action - Redux Saga will handle the API call
    dispatch(kycActions.uploadKycRequest(payload));
  };

  const handleClear = () => {
    setName('');
    setImage(undefined);
  };


  return (
    <Container>
      {(uploadKycLoading || uploading) && (
        <View style={styles.centeredLoader} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primaryColor} />
        </View>
      )}
      <AppBar title="KYC Document" navigation={navigation} />
      <View style={styles.Subcontainer}>
        <Text style={styles.Subheader}>Upload your Image</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.headlabel}>Your Picture</Text>
        <Input
          label="Your Name"
          placeholder="Value"
          value={name}
          onChangeText={text => {
            setName(text);
            if (errors.name) setErrors(prev => ({...prev, name: false}));
          }}
          containerStyle={[
            {marginBottom: scaleHeight(24)},
            errors.name && {
              borderColor: Colors.red,
              borderWidth: 1,
              borderRadius: 5,
            },
          ]}
        />
        {personalKycLoading ? (
          <View style={styles.imageContainer}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
            <Text style={styles.loadingText}>Loading existing image...</Text>
          </View>
        ) : existingImageUrl && !imageRemoved && !image ? (
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
                setImage(undefined);
                setErrors({name: false, image: false});
              }}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={() => setIsVisible(true)}>
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : image ? (
          <View style={styles.imageContainer}>
            <View style={styles.thumbnailContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FullImage', {imageUrl: image.uri})}
                style={styles.existingImageContainer}>
                <Image
                  source={{uri: image.uri}}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.tapToViewText}>Tap on image to show full image view</Text>
            </View>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(undefined)}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <DashedButton
              label="Upload Your Picture"
              onPress={() => setIsVisible(true)}
              containerStyle={
                errors.image ? {borderColor: Colors.red} : undefined
              }
            />
            <Text style={styles.errorText}>Document is required</Text>
          </View>
        )}
        <UploadModal
          visible={isVisible}
          allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
          onClose={file => {
            if (file) {
              setUploading(true);
              setTimeout(() => {
                setImage(file);
                if (errors.image) setErrors(prev => ({...prev, image: false}));
                setUploading(false);
                setIsVisible(false);
              }, 1200);
            } else {
              setIsVisible(false);
            }
          }}
        />

        {/* FooterButton */}
        <View style={styles.footerButton}>
          {/* Clear All Button */}
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
          {/* Save Button */}
          <View style={styles.row}>
            {/* <TouchableOpacity
              style={[styles.saveButton, {backgroundColor: Colors.white}]}
              activeOpacity={0.7}
              onPress={handleSubmit}>
              <Text style={[styles.saveText, {color: Colors.green}]}>Save</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.7}
              onPress={existingImageUrl && !isEditMode ? handleEdit : handleSave}>
              <Text style={styles.saveText}>
                {existingImageUrl && !isEditMode ? 'Edit' : 'Save'}
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
    padding: 16,
    flex: 1,
  },
  headlabel: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginTop: scaleHeight(10),
    marginBottom: scaleHeight(16),
    textAlign: 'center',
  },
  label: {fontSize: 14, marginBottom: 5},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
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
    fontSize: scaleFont(12),
    color: Colors.red,
    marginTop: scaleHeight(8),
    textAlign: 'left',
    fontWeight: '500',
  },
});