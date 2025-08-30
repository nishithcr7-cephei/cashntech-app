/* eslint-disable @typescript-eslint/no-unused-vars */
import {RightCheckmark, Upload} from '@assets/Icons';
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
import {clientActions, clientSelector} from '@store/client';
import {
  HomeNavigatorType,
  ClientNavigatorType,
  KycNavigatorType,
} from '@type/NavigatorTypes';
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
import {useDispatch, useSelector} from 'react-redux';

type KycNavigationType = CompositeNavigationProp<
  DrawerNavigationProp<HomeNavigatorType>,
  NativeStackNavigationProp<KycNavigatorType>
>;

export const KycUploadDoc = () => {
  const navigation = useNavigation<KycNavigationType>();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const {params} = useRoute<RouteProp<KycNavigatorType, 'KycUploadDoc'>>();
  const [name, setName] = useState('');
  const [image, setImage] = useState<DocumentPickerResponse | undefined>();

  const [errors, setErrors] = useState({
    name: false,
    image: false,
  });

  const dispatch = useDispatch();

  const handleSave = () => {
    Alert.alert('Saved!', `Name: ${name}`);
  };

  const handleSubmit = () => {
    if (!name || !image) {
      setErrors({
        name: !name,
        image: !image,
      });

      Alert.alert(
        'Missing Fields',
        !name && !image
          ? 'Please enter Name and upload Image.'
          : `${!name ? 'Name' : 'Image'} is required.`,
      );
      return;
    }

    setErrors({name: false, image: false});

    const payload = {
      client_name: name,
      clientId: params.clientID,
      doc: {
        name: image!.name ?? Date.now().toString(),
        type: image!.type ?? 'image/png',
        uri: image!.uri,
      },
      params: 'Profile',
      uploaded_by: getUserFullName(),
    };

    setLoading(true);
    dispatch(clientActions.uploadKycRequest(payload));
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Document Uploaded',
        text2: `${name}'s document submitted successfully`,
        position: 'top',
      });
      handleClear();
    }, 3000);
  };

  const handleClear = () => {
    setName('');
    setImage(undefined);
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
        {image ? (
          <Text>File Name: {image.name}</Text>
        ) : (
          <DashedButton
            label="Upload Your Picture"
            onPress={() => setIsVisible(true)}
            containerStyle={
              errors.image ? {borderColor: Colors.red} : undefined
            }
          />
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
            <TouchableOpacity
              style={[styles.saveButton, {backgroundColor: Colors.white}]}
              activeOpacity={0.7}
              onPress={handleSubmit}>
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
    padding: 24,
    flex: 1,
  },
  headlabel: {
    fontSize: scaleFont(16),
    fontWeight: fontWeight.SemiBold,
    marginTop: scaleHeight(15),
    marginBottom: scaleHeight(24),
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
});
