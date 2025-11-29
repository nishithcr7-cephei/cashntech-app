import {Camera} from 'react-native-vision-camera';
import {Platform, PermissionsAndroid} from 'react-native';

export async function ensureCameraPermission(): Promise<boolean> {
  const status = await Camera.getCameraPermissionStatus();
  if (status === 'granted') return true;
  const newStatus = await Camera.requestCameraPermission();
  return newStatus === 'granted';
}

export async function ensurePhotoPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;
  if ((Platform.Version as number) >= 33) return true; // READ_MEDIA_IMAGES handled by picker
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
}


