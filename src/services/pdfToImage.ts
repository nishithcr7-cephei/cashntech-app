/**
 * Convert PDF first page to image for OCR processing (free, local processing)
 * Note: Requires react-native-pdf-thumbnail to be installed
 */
export async function pdfFirstPageToImage(pdfUri: string): Promise<string> {
  try {
    // Dynamic import to handle optional dependency
    const PdfThumbnail = require('react-native-pdf-thumbnail').default;
    const {path} = await PdfThumbnail.generate(pdfUri, 0); // 0 = first page
    return path.startsWith('file://') ? path : `file://${path}`;
  } catch (error: any) {
    if (error.message?.includes('Cannot find module')) {
      throw new Error(
        'PDF support requires react-native-pdf-thumbnail. Install it with: npm install react-native-pdf-thumbnail',
      );
    }
    throw new Error(`PDF conversion failed: ${error.message}`);
  }
}
