import CryptoJS from 'crypto-js';
import Config from 'react-native-config';
import {Config as AppConfig} from '@config/index';

// Fallback when .env not loaded (e.g. before rebuild) - must match backend .env
const FALLBACK_KEY = 'u/Gu5posvwDsXUnV5Zaq4g==';
const FALLBACK_IV = '5D9r9ZVzEYYgha93/aUK2w==';

function getEncryptionKeys(): {key: string; iv: string} {
  const key =
    Config.RK_ENCRYPTION_KEY ||
    AppConfig.RK_ENCRYPTION_KEY ||
    (__DEV__ ? FALLBACK_KEY : '');
  const iv =
    Config.RK_ENCRYPTION_IV ||
    AppConfig.RK_ENCRYPTION_IV ||
    (__DEV__ ? FALLBACK_IV : '');
  return {key, iv};
}

/**
 * Decrypts AES-128-CBC encrypted base64 string (matches backend encryption format).
 * Uses RK_ENCRYPTION_KEY and RK_ENCRYPTION_IV from .env.
 * Skips decryption if string doesn't look encrypted (plain text pass-through).
 *
 * @param encryptedText - Base64-encoded encrypted string from API
 * @returns Decrypted plain text, or original string if decryption fails / not encrypted
 */
export function decryptValue(encryptedText: string): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText || '';
  }

  const isLikelyEncrypted =
    /^[A-Za-z0-9+/=]+$/.test(encryptedText) && encryptedText.length > 20;
  if (!isLikelyEncrypted) return encryptedText;

  try {
    const {key: keyStr, iv: ivStr} = getEncryptionKeys();
    if (!keyStr || !ivStr) return encryptedText;

    const key = CryptoJS.enc.Base64.parse(keyStr);
    const iv = CryptoJS.enc.Base64.parse(ivStr);

    // Method 1: Pass ciphertext as {ciphertext: WordArray} - for raw base64 ciphertext
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedText);
    let decrypted = CryptoJS.AES.decrypt(
      {ciphertext} as CryptoJS.lib.CipherParams,
      key,
      {iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7},
    );
    let result = decrypted.toString(CryptoJS.enc.Utf8);

    // Method 2: If empty, try passing string directly (backend style)
    if (!result) {
      decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      result = decrypted.toString(CryptoJS.enc.Utf8);
    }

    const final = result && result.length > 0 ? result : encryptedText;
    if (__DEV__ && final === encryptedText && result === '') {
      console.warn(
        '[decrypt] Decryption produced empty result for:',
        encryptedText.substring(0, 30) + '...',
      );
    }
    return final;
  } catch (e) {
    if (__DEV__) {
      console.warn('[decrypt] Decryption error:', e);
    }
    return encryptedText;
  }
}
