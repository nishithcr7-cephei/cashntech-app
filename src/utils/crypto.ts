import {Config} from '@config/index';
import CryptoJS from 'react-native-crypto-js';

export class DecryptionError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
  }
}
export function decryptUtility(
  encryptedString: string,
  parse: true,
): Record<string, any>;
export function decryptUtility(encryptedString: string, parse?: false): string;

export function decryptUtility(
  encryptedString: string,
  parse?: boolean,
): Record<string, any> | string {
  try {
    const key = CryptoJS.enc.Base64.parse(Config.RK_ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Base64.parse(Config.RK_ENCRYPTION_IV);
    const decrypted = CryptoJS.AES.decrypt(encryptedString, key, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: iv,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    return parse ? JSON.parse(decryptedText) : decryptedText;
  } catch (error) {
    return parse ? {} : '';
  }
}

export function encryptUtility(
  obj: Record<string, any> | null,
  rkEncryptionKey: string,
  rkEncryptionIv: string,
): string {
  const key = CryptoJS.enc.Base64.parse(rkEncryptionKey);
  const iv = CryptoJS.enc.Base64.parse(rkEncryptionIv);

  const plainText = JSON.stringify(obj);

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: iv,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

export function encryptSingleValueUtility(
  value: string,
  rkEncryptionKey: string,
  rkEncryptionIv: string,
): string {
  const key = CryptoJS.enc.Utf8.parse(rkEncryptionKey);
  const iv = CryptoJS.enc.Utf8.parse(rkEncryptionIv);

  const plainText = JSON.stringify(value);

  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: iv,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

const RK_ENCRYPTION_KEY = 'u/Gu5posvwDsXUnV5Zaq4g==';
const RK_ENCRYPTION_IV = '5D9r9ZVzEYYgha93/aUK2w==';

export function decryptLocation(encrypted: string): string {
  if (!encrypted) return '';
  try {
    const key = CryptoJS.enc.Base64.parse(RK_ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Base64.parse(RK_ENCRYPTION_IV);
    const decrypted = CryptoJS.AES.decrypt(
      encrypted,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8) || encrypted;
  } catch (e) {
    return encrypted;
  }
}

/**
 * Conditionally decrypts a string if it appears to be encrypted
 * @param value - The string to potentially decrypt
 * @returns The decrypted string if it was encrypted, or the original string if it was plain text
 */
export function decryptConditionally(value: string): string {
  if (!value || typeof value !== 'string') return value || '';
  
  // Check if the string looks like it might be encrypted (base64-like pattern)
  // Encrypted strings typically have a specific pattern and length
  const isLikelyEncrypted = /^[A-Za-z0-9+/=]+$/.test(value) && value.length > 20;
  
  if (!isLikelyEncrypted) {
    // If it doesn't look encrypted, return as plain text
    return value;
  }
  
  // Try to decrypt it
  try {
    const key = CryptoJS.enc.Base64.parse(RK_ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Base64.parse(RK_ENCRYPTION_IV);
    const decrypted = CryptoJS.AES.decrypt(
      value,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption produces a meaningful result, return it
    if (decryptedText && decryptedText.length > 0) {
      return decryptedText;
    }
  } catch (e) {
    // If decryption fails, return the original value
  }
  
  // Return original value if decryption failed or produced empty result
  return value;
}
