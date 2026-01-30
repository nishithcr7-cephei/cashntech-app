import Config from 'react-native-config';
import {getEnvironmentVariable} from '@utils/Utils';

console.log('🔧 [config.ts] Loading config...');
console.log('🔧 [config.ts] Config.API_URL from .env:', Config.API_URL);

export const API_URL = getEnvironmentVariable(Config.API_URL);
export const FILE_DOWNLOAD_URL = getEnvironmentVariable(Config.FILE_DOWNLOAD_URL);
export const RK_ENCRYPTION_KEY = getEnvironmentVariable(
  Config.RK_ENCRYPTION_KEY,
);
export const RK_ENCRYPTION_IV = getEnvironmentVariable(Config.RK_ENCRYPTION_IV);

console.log('🔧 [config.ts] Processed API_URL:', API_URL);
