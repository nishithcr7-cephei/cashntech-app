/**
 * Google Gemini Vision API for Invoice Extraction
 * Free Tier: 1,500 requests per day
 */

import type { GSTInvoiceJSON } from './gstInvoiceExtractor';
import RNFS from 'react-native-fs';

// ✅ Gemini API Key
const GEMINI_API_KEY = 'AIzaSyD60UFXxKbtwpL9sPpWtyG_6WiNMWnDxtQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
    "order_no": "STRING"
  },
  "line_items": [
    {
      "description": "STRING (Full product name and description, grouped if multi-line)",
      "hsn_code": "STRING",
      "quantity": "FLOAT",
      "rate_per_unit": "FLOAT (The item rate before tax)",
      "taxable_amount": "FLOAT (The total amount for this line item, calculated as Qty * Rate)"
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
`;

export interface GeminiExtractionResult {
  rawText: string;
  gstInvoice: GSTInvoiceJSON;
  confidence: 'high' | 'medium' | 'low';
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
    console.error('Error reading image file:', error);
    throw new Error(`Failed to read image: ${error.message}`);
  }
}

/**
 * Extract structured GST Invoice data using Google Gemini Vision API
 * High accuracy AI-powered extraction
 */
export async function extractWithGemini(
  filePath: string
): Promise<GeminiExtractionResult> {
  try {
    // Convert image to base64
    const base64Data = await imageToBase64(filePath);

    // Prepare API payload
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Analyze the attached invoice image and return the structured JSON strictly based on the system instructions and schema. Extract all line items accurately.',
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
      systemInstruction: {
        parts: [{ text: INVOICE_EXTRACTION_SYSTEM_PROMPT }],
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for consistent, factual extraction
      },
    };

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Gemini API Error:', errorBody);
      throw new Error(
        `API call failed with status ${response.status}: ${
          errorBody.error?.message || 'Unknown error'
        }`
      );
    }

    const result = await response.json();
    const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) {
      throw new Error('Received empty response from Gemini API');
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

    const gstInvoice: GSTInvoiceJSON = JSON.parse(cleanJsonString);

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
    console.error('Gemini extraction error:', error);
    throw new Error(`Gemini extraction failed: ${error.message}`);
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

