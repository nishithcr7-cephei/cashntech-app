/**
 * Google Gemini Vision API for Invoice Extraction
 * Free Tier: 1,500 requests per day
 */

import type { GSTInvoiceJSON } from './gstInvoiceExtractor';
import RNFS from 'react-native-fs';
import { GEMINI_API_KEY } from '@config/config';
import {
  detectImageMimeType,
  mapGeminiItemsResponse,
} from '@utils/ocrGeminiResponse';

// gemini-flash-latest returned frequent 503 (high demand) on the free tier.
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

const INVOICE_EXTRACTION_SYSTEM_PROMPT = `
You read images of Indian invoices and return a small JSON object. Return raw JSON only — no markdown, no comments, no extra text.

REQUIRED JSON SCHEMA:

{
  "invoice_number": "STRING or null",
  "items": [
    {
      "name": "STRING (product name; join multi-line names into one line)",
      "quantity": "NUMBER or null",
      "unit": "STRING or null (exactly as printed, e.g. PCS, NOS, KG, BOX)",
      "price": "NUMBER or null (rate per single unit, before discount and before tax)"
    }
  ]
}

RULES:

1. Extract ONLY the fields above. Do NOT extract discount, tax, GST, CGST, SGST, IGST, HSN, line totals, sub total, grand total, dates, seller or buyer details.
2. invoice_number: the invoice number / bill number exactly as printed, without labels such as "Invoice No:" or trailing text such as "Invoice Date".
3. price must be the per-unit rate. Never put the line amount or total into price. If only a line amount is printed and no rate, use null.
4. unit: copy it only if it is printed for that item. If it is not printed, use null. Never guess a unit.
5. If any value is not clearly readable, use null. Never invent values.
6. Numbers must be plain numbers: no commas, no currency symbols, no "Rs" or "INR".
7. Include every product row in the item table, in the same order. Skip rows that are only totals, taxes, charges or discounts.
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
  if (!GEMINI_API_KEY) {
    throw new Error(
      'OCR is not configured in this build. Please enter invoice details manually.',
    );
  }

  try {
    // Convert image to base64
    const base64Data = await imageToBase64(filePath);

    // Prepare API payload (multimodal, text + image)
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
                mimeType: detectImageMimeType(base64Data),
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
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
      gstInvoice = mapGeminiItemsResponse(JSON.parse(cleanJsonString));
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
  lines.push(`Invoice Number: ${invoice.invoice_header.invoice_number || '-'}`);
  lines.push('');
  lines.push('=== ITEMS ===');
  invoice.line_items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. ${item.description} | Qty: ${item.quantity} ${item.unit || ''} | Price: ₹${item.rate_per_unit}`,
    );
  });
  return lines.join('\n');
}

/**
 * Confidence from completeness of the items-only fields.
 */
function calculateConfidence(invoice: GSTInvoiceJSON): 'high' | 'medium' | 'low' {
  const items = invoice.line_items;
  if (items.length === 0) {
    return 'low';
  }
  const completeItems = items.filter(
    item => item.description && item.quantity > 0 && item.rate_per_unit > 0,
  ).length;
  const hasInvoiceNumber = !!invoice.invoice_header.invoice_number;

  if (completeItems === items.length && hasInvoiceNumber) {
    return 'high';
  }
  if (completeItems > 0) {
    return 'medium';
  }
  return 'low';
}

