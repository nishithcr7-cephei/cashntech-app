/**
 * Google Gemini Vision API for Invoice Extraction
 * Free Tier: 1,500 requests per day
 */

import type { GSTInvoiceJSON } from './gstInvoiceExtractor';
import RNFS from 'react-native-fs';

// ✅ Gemini API Key
// New account: My Project2
const GEMINI_API_KEY = 'AIzaSyA2IZnB1q2RY6QJLpdgFLs3bCDCHOz9Wpw';
// Using the model that AI Studio shows in the Playground: gemini-flash-latest
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const INVOICE_EXTRACTION_SYSTEM_PROMPT = `
You are an expert financial and accounting data extraction agent. Your sole task is to process the raw, unstructured image of a Tax Invoice (GST Invoice) and transform it into a perfectly structured JSON object.

STRICT RULE: Adhere strictly to the required JSON schema provided below. Do not include any explanatory text, conversational responses, notes, or code outside of the final JSON block. The response must be valid, raw JSON only.

REQUIRED JSON SCHEMA:

{
  "invoice_header": {
    "invoice_number": "STRING",
    "invoice_date": "YYYY-MM-DD format, e.g., 2026-10-16",
    "seller_name": "STRING (e.g., OM MARKETING)",
    "seller_gstin": "STRING",
    "buyer_name": "STRING (e.g., SHREE ENTERPRISES UMBEDI (MARINO))",
    "buyer_gstin": "STRING",
    "order_no": "STRING",
    "early_payment_discount": "STRING (e.g. 2 for 2% - only if mentioned on invoice, else empty)",
    "grn_date": "STRING in YYYY-MM-DD (Goods Receipt Note date - only if on invoice, else empty)"
  },
  "line_items": [
    {
      "description": "STRING (Full product name and description, grouped if multi-line)",
      "hsn_code": "STRING",
      "quantity": "FLOAT",
      "rate_per_unit": "FLOAT (The item rate before tax)",
      "taxable_amount": "FLOAT (The total amount for this line item)",
      "unit": "STRING (PCS, KG, LTR, etc. - from invoice if visible, else PCS)",
      "discount_type": "STRING (percentage or value - only if item has discount, else empty)",
      "discount_value": "FLOAT (0 if no discount)",
      "discount_amount": "FLOAT (0 if no discount)",
      "tax_type": "STRING (GST/CGST/SGST/IGST - from invoice if item-level tax shown, else empty)",
      "tax_percentage": "FLOAT (e.g. 2.5 for 2.5% - 0 if not on item)",
      "tax_amount": "FLOAT (0 if not on item)"
    }
  ],
  "financial_summary": {
    "sub_total_taxable_value": "FLOAT (Sum of all line_items taxable_amount)",
    "total_cgst_amount": "FLOAT (Sum of all Output CGST amounts)",
    "total_sgst_amount": "FLOAT (Sum of all Output SGST amounts)",
    "grand_total_amount": "FLOAT (Total after all tax and rounding)",
    "total_in_words": "STRING (The full total amount in words)"
  }
}

INSTRUCTIONS:

1. Parse all data points from the image, converting all monetary and quantity values to FLOAT (decimals).
2. Ensure the JSON output is clean and strictly follows the schema.
3. Extract invoice number carefully - it should not include trailing text like "Invoice Date".
4. Group multi-line product descriptions into a single description field.
5. If a field is not found, use empty string "" for strings or 0 for numbers.
6. early_payment_discount: Extract only if clearly mentioned on invoice (e.g. "2% early payment discount").
7. grn_date: Extract only if Goods Receipt Note date or similar is visible on invoice.
8. For line_items: Extract unit, discount, tax per item only if shown at item level. Otherwise use unit "PCS", discount 0, tax 0.
`;

export interface GeminiExtractionResult {
  rawText: string;
  gstInvoice: GSTInvoiceJSON;
  confidence: 'high' | 'medium' | 'low';
}

export type GeminiRetryEvent = {
  failedAttempt: number;
  nextAttempt: number;
  maxAttempts: number;
};

export type GeminiExtractionOptions = {
  onRetry?: (event: GeminiRetryEvent) => void;
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const RETRYABLE_STATUSES = new Set([429, 500, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toUserFriendlyGeminiError(
  status: number,
  apiMessage?: string,
): Error {
  if (status === 503 || status === 429) {
    return new Error(
      'OCR service is busy right now. Please wait a few seconds and try again.',
    );
  }
  if (status === 401 || status === 403) {
    return new Error('OCR service is not available. Please contact support.');
  }
  if (status >= 500) {
    return new Error(
      'OCR service is temporarily unavailable. Please try again later.',
    );
  }
  return new Error(
    apiMessage?.trim() ||
      'Could not read the invoice. Please try again with a clearer image.',
  );
}

function notifyRetry(
  onRetry: GeminiExtractionOptions['onRetry'],
  attempt: number,
): void {
  onRetry?.({
    failedAttempt: attempt + 1,
    nextAttempt: attempt + 2,
    maxAttempts: MAX_RETRIES,
  });
}

async function callGeminiApi(
  payload: object,
  options?: GeminiExtractionOptions,
): Promise<any> {
  const {onRetry} = options ?? {};

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError: any) {
      if (__DEV__) {
        console.warn(
          `Gemini API network error (attempt ${attempt + 1}/${MAX_RETRIES}):`,
          networkError,
        );
      }
      if (attempt < MAX_RETRIES - 1) {
        notifyRetry(onRetry, attempt);
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw new Error(
        'Network error while reading the invoice. Please check your connection and try again.',
      );
    }

    if (response.ok) {
      return response.json();
    }

    const errorBody = await response.json().catch(() => ({}));
    const status = response.status;
    const apiMessage = errorBody?.error?.message as string | undefined;

    if (__DEV__) {
      console.warn(
        `Gemini API error (attempt ${attempt + 1}/${MAX_RETRIES}):`,
        status,
        apiMessage ?? errorBody,
      );
    }

    if (RETRYABLE_STATUSES.has(status) && attempt < MAX_RETRIES - 1) {
      notifyRetry(onRetry, attempt);
      await sleep(RETRY_DELAY_MS * (attempt + 1));
      continue;
    }

    throw toUserFriendlyGeminiError(status, apiMessage);
  }

  throw new Error(
    'OCR service is busy right now. Please wait a few seconds and try again.',
  );
}

/**
 * Convert image file to base64 for Gemini API
 */
async function imageToBase64(filePath: string): Promise<string> {
  try {
    // Remove 'file://' prefix if present
    const cleanPath = filePath.replace('file://', '');
    const base64 = await RNFS.readFile(cleanPath, 'base64');
    return base64;
  } catch (error: any) {
    if (__DEV__) {
      console.warn('Error reading image file:', error);
    }
    throw new Error('Could not read the invoice image. Please try again.');
  }
}

/**
 * Extract structured GST Invoice data using Google Gemini Vision API
 * High accuracy AI-powered extraction
 */
export async function extractWithGemini(
  filePath: string,
  options?: GeminiExtractionOptions,
): Promise<GeminiExtractionResult> {
  try {
    // Convert image to base64
    const base64Data = await imageToBase64(filePath);

    // Prepare API payload for gemini-flash-latest (multimodal, text + image)
    const payload = {
      contents: [
        {
          parts: [
            {
              text:
                INVOICE_EXTRACTION_SYSTEM_PROMPT +
                '\n\nNow read this invoice image and return ONLY the JSON object in the exact schema above. Do not add any extra text, comments or markdown.',
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    };

    // Call Gemini API with automatic retry for transient failures
    const result = await callGeminiApi(payload, options);
    const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) {
      throw new Error(
        'Could not extract data from the invoice. Please try again with a clearer image.',
      );
    }

    // Clean and parse JSON
    let cleanJsonString = jsonString.trim();
    
    // Remove markdown code blocks if present
    if (cleanJsonString.startsWith('```json')) {
      cleanJsonString = cleanJsonString
        .substring(7, cleanJsonString.lastIndexOf('```'))
        .trim();
    } else if (cleanJsonString.startsWith('```')) {
      cleanJsonString = cleanJsonString
        .substring(3, cleanJsonString.lastIndexOf('```'))
        .trim();
    }

    let gstInvoice: GSTInvoiceJSON;
    try {
      gstInvoice = JSON.parse(cleanJsonString);
    } catch (parseError) {
      if (__DEV__) {
        console.warn('Gemini JSON parse error:', parseError, cleanJsonString);
      }
      throw new Error(
        'Could not understand the invoice data. Please try again with a clearer image.',
      );
    }

    // Generate a simple raw text representation for display
    const rawText = generateRawTextFromJSON(gstInvoice);

    // Determine confidence based on completeness
    const confidence = calculateConfidence(gstInvoice);

    return {
      rawText,
      gstInvoice,
      confidence,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.warn('Gemini extraction error:', error);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Could not read the invoice. Please try again.');
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

