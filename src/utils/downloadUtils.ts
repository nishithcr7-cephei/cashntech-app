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
