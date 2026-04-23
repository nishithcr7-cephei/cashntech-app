import {decryptValue} from './decrypt';

/**
 * Recursively traverses an object or array and attempts to decrypt any string
 * that matches the pattern of an encrypted base64 string.
 * 
 * @param data - The data to transform (object, array, or primitive)
 * @returns The transformed data with decrypted strings
 */
export function transformApiResponse(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Attempt to decrypt if it looks like an encrypted string
    const decrypted = decryptValue(data);
    
    // If it was decrypted and the result looks like JSON, parse it
    if (decrypted !== data && typeof decrypted === 'string') {
      try {
        if ((decrypted.startsWith('{') && decrypted.endsWith('}')) || 
            (decrypted.startsWith('[') && decrypted.endsWith(']'))) {
          return JSON.parse(decrypted);
        }
      } catch (e) {
        // Not JSON, return decrypted string
      }
    }
    return decrypted;
  }

  if (Array.isArray(data)) {
    return data.map(item => transformApiResponse(item));
  }

  if (typeof data === 'object') {
    const transformed: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        transformed[key] = transformApiResponse(data[key]);
      }
    }
    return transformed;
  }

  return data;
}
