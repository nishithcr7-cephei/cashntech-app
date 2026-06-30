import {Platform} from 'react-native';
import {getEnvironmentVariable} from '@utils/Utils';

// Fallbacks when react-native-config has no .env at native build time (match .env.prod).
const FALLBACK_API_URL = 'https://losapidev.cashntech.com';
const FALLBACK_FILE_DOWNLOAD_URL =
  'https://d2wayd1he5a7q1.cloudfront.net';
const FALLBACK_RK_ENCRYPTION_KEY = 'u/Gu5posvwDsXUnV5Zaq4g==';
const FALLBACK_RK_ENCRYPTION_IV = '5D9r9ZVzEYYgha93/aUK2w==';
const FALLBACK_IS_APPETIZE_BUILD = 'false';

type NativeConfigShape = Partial<{
  API_URL: string;
  FILE_DOWNLOAD_URL: string;
  RK_ENCRYPTION_KEY: string;
  RK_ENCRYPTION_IV: string;
  IS_APPETIZE_BUILD: string;
}>;

const loadNativeConfig = (): NativeConfigShape => {
  if (Platform.OS === 'ios') {
    // Avoid iOS launch-time native config initialization until the crashy path is resolved.
    return {};
  }

  try {
    const nativeConfigModule = require('react-native-config');
    const nativeConfig =
      nativeConfigModule?.default ?? nativeConfigModule ?? {};

    return typeof nativeConfig === 'object' && nativeConfig !== null
      ? nativeConfig
      : {};
  } catch (error) {
    console.warn(
      '[config.ts] Failed to load react-native-config, using fallbacks.',
      error,
    );
    return {};
  }
};

const nativeConfig = loadNativeConfig();

const resolveConfigValue = (
  value: string | undefined,
  fallback: string,
): string => getEnvironmentVariable(value || '').trim() || fallback;

console.log('🔧 [config.ts] Loading config...');
console.log('🔧 [config.ts] Native API_URL:', nativeConfig.API_URL || '(fallback)');

export const API_URL =
  resolveConfigValue(nativeConfig.API_URL, FALLBACK_API_URL);
export const FILE_DOWNLOAD_URL =
  resolveConfigValue(
    nativeConfig.FILE_DOWNLOAD_URL,
    FALLBACK_FILE_DOWNLOAD_URL,
  );
export const RK_ENCRYPTION_KEY = resolveConfigValue(
  nativeConfig.RK_ENCRYPTION_KEY,
  FALLBACK_RK_ENCRYPTION_KEY,
);
export const RK_ENCRYPTION_IV = resolveConfigValue(
  nativeConfig.RK_ENCRYPTION_IV,
  FALLBACK_RK_ENCRYPTION_IV,
);
export const IS_APPETIZE_BUILD =
  resolveConfigValue(
    nativeConfig.IS_APPETIZE_BUILD,
    FALLBACK_IS_APPETIZE_BUILD,
  ) === 'true';

console.log('🔧 [config.ts] Processed API_URL:', API_URL);
