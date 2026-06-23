import Config from 'react-native-config';
import {getEnvironmentVariable} from '@utils/Utils';

// Fallbacks when react-native-config has no .env at native build time (match .env.prod).
const FALLBACK_API_URL = 'https://losapidev.cashntech.com';
const FALLBACK_FILE_DOWNLOAD_URL =
  'https://d2wayd1he5a7q1.cloudfront.net';
const FALLBACK_RK_ENCRYPTION_KEY = 'u/Gu5posvwDsXUnV5Zaq4g==';
const FALLBACK_RK_ENCRYPTION_IV = '5D9r9ZVzEYYgha93/aUK2w==';

console.log('🔧 [config.ts] Loading config...');
console.log('🔧 [config.ts] Config.API_URL from .env:', Config.API_URL);

export const API_URL =
  getEnvironmentVariable(Config.API_URL) || FALLBACK_API_URL;
export const FILE_DOWNLOAD_URL =
  getEnvironmentVariable(Config.FILE_DOWNLOAD_URL) ||
  FALLBACK_FILE_DOWNLOAD_URL;
export const RK_ENCRYPTION_KEY = getEnvironmentVariable(
  Config.RK_ENCRYPTION_KEY,
) || FALLBACK_RK_ENCRYPTION_KEY;
export const RK_ENCRYPTION_IV = getEnvironmentVariable(
  Config.RK_ENCRYPTION_IV,
) || FALLBACK_RK_ENCRYPTION_IV;

console.log('🔧 [config.ts] Processed API_URL:', API_URL);
