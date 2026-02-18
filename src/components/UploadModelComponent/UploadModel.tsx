import {File, RightCheckmarkWhite} from '@assets/Icons';
import Colors from '@constants/Colors';
import Fonts from '@constants/Fonts';
import {
  DocumentPickerResponse,
  pick,
  types,
} from '@react-native-documents/picker';
import {launchCamera, CameraOptions, Asset} from 'react-native-image-picker';
import {scaleWidth, scaleHeight, scaleFont} from '@utils/Scale';
import {tryCatch} from '@utils/TryCatch';
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Image,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';

export const UploadModal = ({
  visible,
  onClose,
  allowedFileTypes = ['jpg', 'jpeg', 'png'],
}: {
  visible: boolean;
  onClose: (file?: DocumentPickerResponse) => void;
  allowedFileTypes?: string[];
}) => {
  const [selectedFile, setSelectedFile] = useState<
    DocumentPickerResponse | undefined
  >();

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (_e) {
      return false;
    }
  };

  const assetToDocument = (asset: Asset): DocumentPickerResponse | undefined => {
    if (!asset?.uri) return undefined;
    return {
      uri: asset.uri,
      name: asset.fileName ?? `photo_${Date.now()}.jpg`,
      type: asset.type ?? 'image/jpeg',
      size: asset.fileSize ?? 0,
      fileCopyUri: asset.uri,
    } as DocumentPickerResponse;
  };

  const handleCaptureFromCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return Alert.alert('Permission Required', 'Camera permission is needed to capture a photo.');
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
      saveToPhotos: false,
    };

    const result = await launchCamera(options);
    if (result?.assets && result.assets.length > 0) {
      const doc = assetToDocument(result.assets[0]);
      if (doc) setSelectedFile(doc);
    }
  };

  const handleBrowseFile = async () => {
    const allowedMimeTypes = allowedFileTypes?.map(type => {
      switch (type.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
          return types.images;
        case 'png':
          return types.images;
        case 'pdf':
          return types.pdf;
        default:
          return types.allFiles;
      }
    });

    const {data, error} = await tryCatch(
      pick({
        mode: 'import',
        allowMultiSelection: false,
        type: allowedMimeTypes,
      }),
    );

    if (!error && data.length > 0) {
      const file = data[0];
      const fileExtension = file.name?.split('.').pop()?.toLowerCase();

      if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
        setSelectedFile(undefined);
        return Alert.alert(
          'Unsupported File',
          `Only ${allowedFileTypes
            .join(', ')
            .toUpperCase()} files are allowed.`,
        );
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    onClose(selectedFile);
  };
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => onClose()}>
      <TouchableWithoutFeedback
        onPress={() => {
          onClose();
        }}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.popup}>
              {/* Header with Title and Close Button */}
              <View style={styles.modalHeader}>
                <Text style={styles.title}>Upload Attachment</Text>
                <TouchableOpacity
                  onPress={() => onClose()}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Upload Area */}
              <TouchableOpacity
                style={styles.uploadBox}
                activeOpacity={0.7}
                onPress={handleBrowseFile}>
                <File width={scaleWidth(40)} height={scaleHeight(40)} />
                <Text style={styles.uploadText}>Upload your document.</Text>
              </TouchableOpacity>

              {/* Selected File Preview */}
              {selectedFile && (
                <View style={styles.selectedFileContainer}>
                  <Text style={styles.selectedFileText}>
                    Selected: {selectedFile.name}
                  </Text>
                  {selectedFile.type?.startsWith('image/') && (
                    <Image
                      source={{uri: selectedFile.uri}}
                      style={styles.previewImage}
                    />
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => onClose()}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    !selectedFile && styles.uploadButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                  disabled={!selectedFile}
                  onPress={handleSubmit}>
                  <Text style={styles.uploadButtonText}>Upload</Text>
                  <RightCheckmarkWhite width={scaleWidth(16)} height={scaleHeight(16)} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  title: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(24),
    color: Colors.darkblack,
    fontWeight: '300',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#B0B0B0',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(40),
    paddingHorizontal: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    margin: scaleWidth(16),
    backgroundColor: '#FAFAFA',
    minHeight: scaleHeight(200),
  },
  uploadText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: '#808080',
    marginTop: scaleHeight(12),
    textAlign: 'center',
  },
  selectedFileContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(12),
    alignItems: 'center',
  },
  selectedFileText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  previewImage: {
    width: scaleWidth(150),
    height: scaleWidth(150),
    borderRadius: scaleWidth(8),
    resizeMode: 'cover',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(16),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.green,
    gap: scaleWidth(8),
  },
  uploadButtonDisabled: {
    backgroundColor: '#E6E6E6',
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
