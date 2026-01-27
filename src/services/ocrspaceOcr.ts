/**
 * OCR.space API for Invoice OCR
 * Free Tier: 500 requests per day (10x better than Gemini)
 * No credit card required
 */

import type { GSTInvoiceJSON } from './gstInvoiceExtractor';
import RNFS from 'react-native-fs';

// ✅ OCR.space API Key
const OCR_SPACE_API_KEY = 'K88828424188957';
const OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';

export interface OCRSpaceExtractionResult {
  rawText: string;
  gstInvoice: GSTInvoiceJSON;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Convert image file to base64 for OCR.space API
 */
async function imageToBase64(filePath: string): Promise<string> {
  try {
    const cleanPath = filePath.replace('file://', '');
    const base64 = await RNFS.readFile(cleanPath, 'base64');
    return base64;
  } catch (error: any) {
    console.error('Error reading image file:', error);
    throw new Error(`Failed to read image: ${error.message}`);
  }
}

/**
 * Extract text using OCR.space API
 */
export async function extractWithOCRSpace(
  filePath: string
): Promise<OCRSpaceExtractionResult> {
  try {
    // Convert image to base64
    const base64Data = await imageToBase64(filePath);

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
    formData.append('language', 'eng'); // English + Hindi support
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 for better accuracy

    // Call OCR.space API
    const response = await fetch(OCR_SPACE_API_URL, {
      method: 'POST',
      headers: {
        'apikey': OCR_SPACE_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR.space API Error:', errorText);
      
      const statusCode = response.status;
      
      // Check for quota errors
      if (statusCode === 429 || statusCode === 403) {
        throw new Error(
          `OCR.space API daily limit reached (500 requests/day). Please wait or upgrade plan.`
        );
      }
      
      throw new Error(
        `API call failed with status ${statusCode}: ${errorText}`
      );
    }

    const result = await response.json();
    
    // Extract text from response
    if (result.OCRExitCode !== 1) {
      throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
    }

    const parsedResults = result.ParsedResults;
    if (!parsedResults || parsedResults.length === 0) {
      throw new Error('No text detected in image');
    }

    // Get full text from first result
    const rawText = parsedResults[0].ParsedText || '';

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text detected in image');
    }

    // Extract blocks/words for better parsing (if available)
    const blocks: any[] = [];
    if (parsedResults[0].TextOverlay?.Lines) {
      parsedResults[0].TextOverlay.Lines.forEach((line: any) => {
        if (line.Words) {
          line.Words.forEach((word: any) => {
            blocks.push({
              text: word.WordText || '',
              boundingBox: {
                left: word.Left || 0,
                top: word.Top || 0,
                right: (word.Left || 0) + (word.Width || 0),
                bottom: (word.Top || 0) + (word.Height || 0),
              },
            });
          });
        }
      });
    }

    // Use existing GST invoice extractor to parse the text
    const { extractGSTInvoiceJSON } = require('./gstInvoiceExtractor');
    const gstInvoice = extractGSTInvoiceJSON(rawText, blocks);

    // Determine confidence based on completeness
    const confidence = calculateConfidence(gstInvoice);

    return {
      rawText,
      gstInvoice,
      confidence,
    };
  } catch (error: any) {
    console.error('OCR.space extraction error:', error);
    throw new Error(`OCR.space extraction failed: ${error.message}`);
  }
}

/**
 * Generate a readable text representation from structured JSON
 */
function generateRawTextFromJSON(invoice: GSTInvoiceJSON): string {
  const lines: string[] = [];
  
  lines.push('=== INVOICE HEADER ===');
  lines.push(`Invoice Number: ${invoice.invoice_header.invoice_number}`);
  lines.push(`Invoice Date: ${invoice.invoice_header.invoice_date}`);
  lines.push(`Seller: ${invoice.invoice_header.seller_name} (${invoice.invoice_header.seller_gstin})`);
  lines.push(`Buyer: ${invoice.invoice_header.buyer_name} (${invoice.invoice_header.buyer_gstin})`);
  lines.push(`Order No: ${invoice.invoice_header.order_no}`);
  lines.push('');
  
  lines.push('=== LINE ITEMS ===');
  invoice.line_items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.description}`);
    lines.push(`   HSN: ${item.hsn_code} | Qty: ${item.quantity} | Rate: ₹${item.rate_per_unit} | Amount: ₹${item.taxable_amount}`);
  });
  lines.push('');
  
  lines.push('=== FINANCIAL SUMMARY ===');
  lines.push(`Subtotal: ₹${invoice.financial_summary.sub_total_taxable_value}`);
  lines.push(`CGST: ₹${invoice.financial_summary.total_cgst_amount}`);
  lines.push(`SGST: ₹${invoice.financial_summary.total_sgst_amount}`);
  lines.push(`Grand Total: ₹${invoice.financial_summary.grand_total_amount}`);
  lines.push(`In Words: ${invoice.financial_summary.total_in_words}`);
  
  return lines.join('\n');
}

/**
 * Calculate confidence score based on data completeness
 */
function calculateConfidence(invoice: GSTInvoiceJSON): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Check critical fields
  if (invoice.invoice_header.invoice_number) score += 2;
  if (invoice.invoice_header.invoice_date) score += 2;
  if (invoice.invoice_header.seller_name) score += 1;
  if (invoice.invoice_header.seller_gstin && invoice.invoice_header.seller_gstin.length === 15) score += 2;
  if (invoice.invoice_header.buyer_name) score += 1;
  if (invoice.line_items.length > 0) score += 3;
  if (invoice.financial_summary.grand_total_amount > 0) score += 2;
  
  if (score >= 10) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

