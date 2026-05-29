import RNFS from 'react-native-fs';
import {Platform} from 'react-native';
import Toast from 'react-native-toast-message';

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export const downloadFile = async (
  blob: Blob,
  fileName: string,
  clientId: string,
): Promise<DownloadResult> => {
  try {
    // Convert blob to base64
    const base64Data = await blobToBase64(blob);
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalFileName = `KYC_Documents_${clientId}_${timestamp}.zip`;
    
    // Determine download path based on platform
    const downloadPath = Platform.OS === 'ios' 
      ? `${RNFS.DocumentDirectoryPath}/${finalFileName}`
      : `${RNFS.DownloadDirectoryPath}/${finalFileName}`;
    
    // Write file to device
    await RNFS.writeFile(downloadPath, base64Data, 'base64');
    
    return {
      success: true,
      filePath: downloadPath,
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const showDownloadSuccessAlert = (filePath: string) => {
  Toast.show({
    type: 'success',
    text1: 'Download Complete',
    text2: `KYC documents saved to: ${filePath}`,
  });
};

export const showDownloadErrorAlert = (error: string) => {
  Toast.show({
    type: 'error',
    text1: 'Download Failed',
    text2: `Failed to download KYC documents. ${error}`,
  });
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const btoaFn =
    typeof globalThis.btoa === 'function'
      ? globalThis.btoa.bind(globalThis)
      : null;
  if (btoaFn) {
    return btoaFn(binary);
  }
  throw new Error('Base64 encoding is not available on this device');
}

const sanitizeExcelFileName = (name: string): string =>
  name.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_') || 'report_export';

/** Save `.xlsx` bytes from POST /export/generic-excel to device storage. */
export async function downloadExcelBuffer(
  buffer: ArrayBuffer,
  baseFileName: string,
): Promise<DownloadResult> {
  try {
    const base64Data = arrayBufferToBase64(buffer);
    const safeName = sanitizeExcelFileName(baseFileName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const finalFileName = `${safeName}_${timestamp}.xlsx`;

    const downloadPath =
      Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/${finalFileName}`
        : `${RNFS.DownloadDirectoryPath}/${finalFileName}`;

    await RNFS.writeFile(downloadPath, base64Data, 'base64');

    return {
      success: true,
      filePath: downloadPath,
    };
  } catch (error) {
    console.error('Excel download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

export const showExcelDownloadSuccess = (filePath: string) => {
  const location =
    Platform.OS === 'android' ? 'Downloads folder' : 'app documents';
  Toast.show({
    type: 'success',
    text1: 'Export complete',
    text2: `Saved to ${location}: ${filePath.split('/').pop() || 'file'}`,
    visibilityTime: 4000,
  });
};

export const showExcelDownloadError = (error: string) => {
  Toast.show({
    type: 'error',
    text1: 'Export failed',
    text2: error,
    visibilityTime: 3500,
  });
};
