import {parsePhoneNumber} from 'awesome-phonenumber';
import {Country} from 'react-native-country-picker-modal';
import CryptoJS from 'react-native-crypto-js';
import Toast from 'react-native-toast-message';
import {getStorage} from '@services/localStorage';
import {jwtDecode} from 'jwt-decode';

/**
 * If the value is encrypted, decrypt it. Otherwise, return the original value.
 *
 * @param value - The value to decrypt, or return if it is not encrypted.
 * @returns The decrypted value if it was encrypted, otherwise the original value.
 */
export function getEnvironmentVariable(value: string) {
  const secreteKey =
    'be5be17a84f4ed5d4fb780ea3784d1f93a833e851585f831599720ed4b0b8a0e';
  if (value && typeof value === 'string' && value.startsWith('encrypted:')) {
    const cipherText = value.replace('encrypted:', '');
    let bytes = CryptoJS.AES.decrypt(cipherText, secreteKey);
    let originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  }
  return value || '';
}

/**
 * Validates whether a given email address is in a proper format.
 *
 * @param email - The email address to validate.
 * @returns True if the email address is valid, otherwise false.
 */

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates whether a given mobile number is in a proper format.
 *
 * @param mobile - The mobile number to validate.
 * @param countryCode - The country code of the mobile number.
 * @returns True if the mobile number is valid, otherwise false.
 */
export function isValidMobile(mobile: string, countryCode: string) {
  if (countryCode === '91') {
    return /^[6-9]\d{9}$/.test(mobile);
  } else {
    return parsePhoneNumber(`+${countryCode}${mobile}`).valid;
  }
}

/**
 * Verifies whether the given first and last names are valid.
 *
 * @param firstName - The first name to verify.
 * @param lastName - The last name to verify.
 * @returns True if the names are valid, otherwise false.
 */
export const handleNameVerifications = (
  firstName: string,
  lastName: string,
) => {
  if (!firstName.trim() || !lastName.trim()) {
    Toast.show({
      type: 'error',
      text1: 'Name is required',
      visibilityTime: 2000,
    });
    return false;
  }
  if (firstName.length < 2 || lastName.length < 2) {
    Toast.show({
      type: 'error',
      text1: 'Name is too short',
      visibilityTime: 2000,
    });
    return false;
  }
  return true;
};

/**
 * Verifies whether the given mobile number is valid.
 *
 * @param mobileNumber - The mobile number to verify.
 * @param country - The country of the mobile number.
 * @returns True if the mobile number is valid, otherwise false.
 */
export const handleMobileVerification = (
  mobileNumber: string,
  country: Country,
) => {
  if (!mobileNumber.trim()) {
    Toast.show({
      type: 'error',
      text1: 'Mobile Number is required',
      visibilityTime: 2000,
    });
    return false;
  }
  if (!isValidMobile(mobileNumber.trim(), country.callingCode[0])) {
    Toast.show({
      type: 'error',
      text1: 'Mobile Number is not valid',
      visibilityTime: 2000,
    });
    return false;
  }
  return true;
};

/**
 * Verifies whether the given email address is valid.
 *
 * @param email - The email address to verify.
 * @returns True if the email address is valid, otherwise false.
 */
export const handleEmailVerification = (email: string) => {
  if (!email.trim()) {
    Toast.show({
      type: 'error',
      text1: 'Email is required',
      visibilityTime: 2000,
    });
    return false;
  }
  if (!isValidEmail(email.trim())) {
    Toast.show({
      type: 'error',
      text1: 'Email is not valid',
      visibilityTime: 2000,
    });
    return false;
  }
  return true;
};

export interface JWTData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  exp?: number; // Token expiration time (Unix timestamp)
  iat?: number; // Token issued at time (Unix timestamp)
}

/**
 * Decodes a JSON Web Token (JWT) and returns its payload.
 *
 * @param token - The JWT string to decode.
 * @returns The decoded payload object if decoding is successful; otherwise, returns `null`.
 */
export const decodeJWT = (token: string): JWTData | null => {
  try {
    const decoded = jwtDecode<JWTData>(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if the JWT token is expired
 * 
 * @param token - The JWT token to check
 * @returns True if the token is expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true; // If we can't decode or no exp claim, consider it expired
    }
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.warn('Failed to decode token for expiration check:', error);
    return true; // If decoding fails, consider it expired
  }
};

/**
 * Get user's full name from shared preferences
 * Returns firstName + " " + lastName
 * If no values found, returns "Test_firstname Test_lastname"
 */
export const getUserFullName = (): string => {
  const firstName = getStorage('user_first_name');
  const lastName = getStorage('user_last_name');

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return 'Test_firstname Test_lastname';
};

/**
 * Formats a number according to the Indian numbering system.
 *
 * @param value - The number to format, as a string (can include commas).
 * @returns The formatted number as a string, or an empty string if the input is invalid.
 */
export const formatIndianNumber = (value: string) => {
  if (!value) return '';
  const num = Number(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-IN').format(num);
};
