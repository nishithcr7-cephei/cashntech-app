import {Config} from '@config/index';
import CryptoJS from 'crypto-js';

// Fallback keys for when react-native-config native module is not linked
// (excluded from Android autolinking in react-native.config.js)
const FALLBACK_KEY = 'u/Gu5posvwDsXUnV5Zaq4g==';
const FALLBACK_IV = '5D9r9ZVzEYYgha93/aUK2w==';

function getKey(): string {
  return Config?.RK_ENCRYPTION_KEY || FALLBACK_KEY;
}
function getIV(): string {
  return Config?.RK_ENCRYPTION_IV || FALLBACK_IV;
}

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

/**
 * Decrypts an AES-encrypted string using a Base64-encoded key and IV from configuration.
 *
 * @param encryptedString - The AES-encrypted string to decrypt.
 * @param parse - If `true`, attempts to parse the decrypted string as JSON and returns an object; otherwise, returns the decrypted string.
 * @returns The decrypted string or parsed object. Returns an empty object `{}` or empty string `''` on error, depending on the `parse` flag.
 */
export function decryptUtility(
  encryptedString: string,
  parse?: boolean,
): Record<string, any> | string {
  try {
    const key = CryptoJS.enc.Base64.parse(getKey());
    const iv = CryptoJS.enc.Base64.parse(getIV());
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedString),
    });
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
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

/**
 * Encrypts a given value (object or string) using AES encryption with CBC mode and PKCS7 padding.
 *
 * The encryption key and IV are parsed from Base64-encoded strings (`RK_ENCRYPTION_KEY` and `RK_ENCRYPTION_IV`).
 * The function serializes objects to JSON before encryption.
 *
 * @param value - The value to encrypt. Can be a string, an object, or null.
 * @returns The encrypted value as a Base64-encoded string.
 */
export function encryptUtility(
  value: Record<string, any> | string | null,
): string {
  const key = CryptoJS.enc.Base64.parse(getKey());
  const iv = CryptoJS.enc.Base64.parse(getIV());
  let plainText;
  if (typeof value === 'string') {
    plainText = value;
  } else {
    plainText = JSON.stringify(value);
  }
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: iv,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

// TODO: Remove keys - now using Config values

export function decryptLocation(encrypted: string): string {
  if (!encrypted) return '';
  try {
    const key = CryptoJS.enc.Base64.parse(getKey());
    const iv = CryptoJS.enc.Base64.parse(getIV());
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encrypted),
    });
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
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
  const isLikelyEncrypted =
    /^[A-Za-z0-9+/=]+$/.test(value) && value.length > 20;

  if (!isLikelyEncrypted) {
    // If it doesn't look encrypted, return as plain text
    return value;
  }

  // Try to decrypt it (backend sends raw ciphertext in Base64, not OpenSSL format)
  try {
    const keyStr = getKey();
    const ivStr = getIV();
    if (!keyStr || !ivStr) return value;

    const key = CryptoJS.enc.Base64.parse(keyStr);
    const iv = CryptoJS.enc.Base64.parse(ivStr);
    const ciphertext = CryptoJS.enc.Base64.parse(value);
    const cipherParams =
      typeof CryptoJS.lib?.CipherParams?.create === 'function'
        ? CryptoJS.lib.CipherParams.create({ciphertext})
        : {ciphertext};
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (decryptedText && decryptedText.length > 0) {
      return decryptedText;
    }
  } catch (e) {
    // If decryption fails, return the original value
  }

  // Return original value if decryption failed or produced empty result
  return value;
}
