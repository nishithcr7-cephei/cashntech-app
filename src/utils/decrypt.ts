import CryptoJS from 'crypto-js';
import {
  RK_ENCRYPTION_IV,
  RK_ENCRYPTION_KEY,
} from '@config/config';

// Fallback when environment-backed config values are unavailable at runtime.
// These must match backend .env values.
const FALLBACK_KEY = 'u/Gu5posvwDsXUnV5Zaq4g==';
const FALLBACK_IV = '5D9r9ZVzEYYgha93/aUK2w==';

const hasAsciiControlChars = (value: string): boolean =>
  Array.from(value).some(char => {
    const code = char.charCodeAt(0);
    return (code >= 0 && code <= 8) || (code >= 14 && code <= 31) || code === 127;
  });

function getEncryptionKeys(): {key: string; iv: string} {
  const key = RK_ENCRYPTION_KEY || FALLBACK_KEY;
  const iv = RK_ENCRYPTION_IV || FALLBACK_IV;

  if (__DEV__ && (!key || !iv)) {
    console.warn('[crypto] RK_ENCRYPTION_KEY or RK_ENCRYPTION_IV is missing in .env! Using fallbacks for development.');
  }

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

  // S3/storage relative paths (e.g. invoices/invoice_123.png) must not be AES-decrypted.
  if (
    encryptedText.includes('/') &&
    /\.[a-zA-Z0-9]{2,5}$/.test(encryptedText.split('/').pop() ?? '')
  ) {
    return encryptedText;
  }

  // UUID-like ids must never be decrypted (prevents corruption of invoice/program ids)
  const isUuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      encryptedText,
    );
  if (isUuidLike) {
    return encryptedText;
  }

  const compact = encryptedText.replace(/\s+/g, '');
  // Heuristic: treat as encrypted only if it looks like base64 payload, not plain ids/text.
  const isLikelyEncrypted =
    /^[A-Za-z0-9+/=_-]+$/.test(compact) &&
    compact.length >= 16 &&
    compact.length % 4 === 0 &&
    /[+/=_]/.test(compact);
  if (!isLikelyEncrypted) {
    return encryptedText;
  }

  try {
    const {key: keyStr, iv: ivStr} = getEncryptionKeys();
    if (!keyStr || !ivStr) {
      return encryptedText;
    }

    const key = CryptoJS.enc.Base64.parse(keyStr);
    const iv = CryptoJS.enc.Base64.parse(ivStr);

    // Normalize URL-safe base64: spaces (from URL-decoded +) back to +, _ → /
    const normalizedText = encryptedText
      .replace(/ /g, '+')
      .replace(/_/g, '/');

    // Method 1: Pass ciphertext as {ciphertext: WordArray} - for raw base64 ciphertext
    const ciphertext = CryptoJS.enc.Base64.parse(normalizedText);
    let decrypted = CryptoJS.AES.decrypt(
      {ciphertext} as CryptoJS.lib.CipherParams,
      key,
      {iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7},
    );
    let result = decrypted.toString(CryptoJS.enc.Utf8);

    // Method 2: If empty, try passing normalizedText directly (backend style)
    if (!result) {
      decrypted = CryptoJS.AES.decrypt(normalizedText, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      result = decrypted.toString(CryptoJS.enc.Utf8);
    }

    const hasControlChars = hasAsciiControlChars(result);
    const final =
      result && result.length > 0 && !hasControlChars ? result : encryptedText;
    return final;
  } catch (e) {
    return encryptedText;
  }
}
