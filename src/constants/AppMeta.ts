import {Platform} from 'react-native';

export const APP_VERSION_NAME = Platform.OS === 'ios' ? '1.3.1' : '1.4';
export const APP_VERSION_CODE = Platform.OS === 'ios' ? '5' : '9';
export const APP_VERSION_DISPLAY = `Version ${APP_VERSION_NAME} (${APP_VERSION_CODE})`;
