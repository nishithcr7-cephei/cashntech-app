/**
 * GST Invoice JSON Extractor
 * Multi-stage OCR + Advanced Data Parsing + Natural Language Understanding
 * Extracts structured JSON data from Indian GST Tax Invoices
 */

export interface GSTInvoiceJSON {
  invoice_header: {
    invoice_number: string;
    invoice_date: string; // YYYY-MM-DD format
    seller_name: string;
    seller_gstin: string;
    buyer_name: string;
    buyer_gstin: string;
    order_no: string;
    early_payment_discount?: string; // e.g. "2" for 2%
    grn_date?: string; // YYYY-MM-DD format - Goods Receipt Note date if on invoice
  };
  line_items: Array<{
    description: string;
    hsn_code: string;
    quantity: number;
    rate_per_unit: number;
    taxable_amount: number;
    unit?: string; // PCS, KG, LTR, etc.
    discount_type?: string; // 'percentage' | 'value' | ''
    discount_value?: number;
    discount_amount?: number;
    tax_type?: string; // GST, CGST, SGST, IGST
    tax_percentage?: number;
    tax_amount?: number;
  }>;
  financial_summary: {
    sub_total_taxable_value: number;
    total_cgst_amount: number;
    total_sgst_amount: number;
    grand_total_amount: number;
    total_in_words: string;
  };
}

/**
 * Multi-stage GST Invoice Data Extraction
 * Stage 1: OCR Text Recognition (handled by ML Kit)
 * Stage 2: Structured Data Parsing (this function)
 * Stage 3: Natural Language Understanding & Validation
 */
export function extractGSTInvoiceJSON(rawOcrText: string, blocks?: any[]): GSTInvoiceJSON {
  const cleaned = rawOcrText.replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ');
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Stage 2: Structured Data Parsing
  const invoiceHeader = extractInvoiceHeader(lines, cleaned);
  const lineItems = extractGSTLineItems(lines, cleaned);
  const financialSummary = extractFinancialSummary(lines, cleaned, lineItems);

  // Stage 3: Natural Language Understanding & Validation
  validateAndEnhance(invoiceHeader, lineItems, financialSummary);

  return {
    invoice_header: invoiceHeader,
    line_items: lineItems,
    financial_summary: financialSummary,
  };
}

// ========== STAGE 2: INVOICE HEADER EXTRACTION ==========

function extractInvoiceHeader(lines: string[], text: string) {
  return {
    invoice_number: extractInvoiceNumber(lines, text),
    invoice_date: extractInvoiceDate(lines, text),
    seller_name: extractSellerName(lines, text),
    seller_gstin: extractSellerGSTIN(lines, text),
    buyer_name: extractBuyerName(lines, text),
    buyer_gstin: extractBuyerGSTIN(lines, text),
    order_no: extractOrderNumber(lines, text),
  };
}

function extractInvoiceNumber(lines: string[], text: string): string {
  const patterns = [
    /invoice\s*no\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,30})/i,
    /inv\s*no\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,30})/i,
    /bill\s*no\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,30})/i,
    /tax\s*invoice\s*no\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,30})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up: remove trailing non-alphanumeric except / and -
      return match[1].trim().replace(/[^\w\-\/\.]+$/, '');
    }
  }

  // Fallback: Look for label in lines
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('invoice no') || lower.includes('inv no')) {
      const match = lines[i].match(/[:\-]\s*([A-Z0-9][A-Z0-9\-\/\.]{2,30})/i);
      if (match) return match[1].trim();
      // Check next line
      if (i + 1 < lines.length) {
        const nextMatch = lines[i + 1].match(/^([A-Z0-9][A-Z0-9\-\/\.]{2,30})/i);
        if (nextMatch) return nextMatch[1].trim();
      }
    }
  }

  return '';
}

function extractInvoiceDate(lines: string[], text: string): string {
  const datePatterns = [
    /invoice\s+date\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /inv\s+date\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /date\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /dated?\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return convertToYYYYMMDD(match[1]);
    }
  }

  // Fallback: Find first date in header region
  const headerText = lines.slice(0, Math.min(25, lines.length)).join(' ');
  const dateMatch = headerText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
  if (dateMatch) {
    return convertToYYYYMMDD(dateMatch[1]);
  }

  return '';
}

function extractSellerName(lines: string[], text: string): string {
  // Seller is usually at the top, before "Invoice" keyword
  const invoiceLineIdx = lines.findIndex(l => /\btax\s+invoice\b/i.test(l) || /\binvoice\b/i.test(l));
  
  // Check lines before invoice keyword
  if (invoiceLineIdx > 0) {
    for (let i = 0; i < invoiceLineIdx; i++) {
      const line = lines[i].trim();
      // Look for company name patterns (all caps, or proper business names)
      if (line.length > 5 && /^[A-Z][A-Z0-9\s\-&\.]{5,}$/i.test(line)) {
        // Verify it's not a common header/label
        if (!/^(tax|invoice|gst|bill|date|order|from|to|seller|buyer)/i.test(line)) {
          return line;
        }
      }
    }
  }

  // Alternative: Look for explicit "Seller" label
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('seller') || lower.includes('from') || lower.includes('vendor')) {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.length > 5) return nextLine;
      }
    }
  }

  // Final fallback: First substantial line
  return lines.find(l => l.length > 5) || '';
}

function extractSellerGSTIN(lines: string[], text: string): string {
  // Look for GSTIN pattern near seller information (top half of document)
  const topHalfText = lines.slice(0, Math.ceil(lines.length / 2)).join('\n');
  
  const gstinPattern = /\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]\d)\b/;
  const matches = topHalfText.match(new RegExp(gstinPattern, 'g'));
  
  if (matches && matches.length > 0) {
    // First GSTIN is typically seller's
    return matches[0].toUpperCase();
  }

  return '';
}

function extractBuyerName(lines: string[], text: string): string {
  const buyerKeywords = ['buyer', 'billed to', 'bill to', 'customer', 'ship to', 'consignee'];
  
  for (const keyword of buyerKeywords) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(keyword)) {
        // Look for name in next 1-3 lines
        for (let offset = 1; offset <= 3; offset++) {
          if (i + offset < lines.length) {
            const candidateLine = lines[i + offset].trim();
            // Skip label lines
            if (/^(address|gstin|gst|phone|email|state|pin|code)/i.test(candidateLine)) {
              continue;
            }
            if (candidateLine.length > 5 && /^[A-Z0-9][A-Z0-9\s\-&\.\(\)]{4,}$/i.test(candidateLine)) {
              return candidateLine;
            }
          }
        }
      }
    }
  }

  return '';
}

function extractBuyerGSTIN(lines: string[], text: string): string {
  // Look for GSTIN pattern near buyer information (usually middle of document)
  const gstinPattern = /\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]\d)\b/g;
  const matches = text.match(gstinPattern);
  
  if (matches && matches.length > 1) {
    // Second GSTIN is typically buyer's
    return matches[1].toUpperCase();
  } else if (matches && matches.length === 1) {
    // If only one GSTIN, look for buyer context
    const buyerSection = text.toLowerCase().indexOf('buyer');
    const billToSection = text.toLowerCase().indexOf('bill to');
    const gstinPos = text.indexOf(matches[0]);
    
    if ((buyerSection > 0 && gstinPos > buyerSection) || 
        (billToSection > 0 && gstinPos > billToSection)) {
      return matches[0].toUpperCase();
    }
  }

  return '';
}

function extractOrderNumber(lines: string[], text: string): string {
  const patterns = [
    /order\s*no\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,25})/i,
    /order\s*[:\-]\s*([A-Z0-9][A-Z0-9\-\/\.]{2,25})/i,
    /po\s*no\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,25})/i,
    /purchase\s*order\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/\.]{2,25})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

// ========== STAGE 2: LINE ITEMS EXTRACTION ==========

function extractGSTLineItems(lines: string[], text: string): Array<{
  description: string;
  hsn_code: string;
  quantity: number;
  rate_per_unit: number;
  taxable_amount: number;
}> {
  const items: Array<{
    description: string;
    hsn_code: string;
    quantity: number;
    rate_per_unit: number;
    taxable_amount: number;
  }> = [];

  // Find table header (contains keywords like Description, HSN, QTY, Rate, Amount)
  let headerIdx = -1;
  const headerKeywords = ['description', 'hsn', 'qty', 'rate', 'amount'];
  
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    const matchCount = headerKeywords.filter(k => lower.includes(k)).length;
    if (matchCount >= 3) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return items;

  // Parse items until we hit summary section
  const summaryKeywords = ['sub', 'total', 'cgst', 'sgst', 'igst', 'tax', 'grand', 'round'];
  
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    
    // Stop at summary section
    if (summaryKeywords.some(k => lower.startsWith(k)) || /^output\s+(c|s|i)gst/i.test(line)) {
      break;
    }

    // Check if line contains item data (has numbers)
    const numbers = extractNumbersFromLine(line);
    
    if (numbers.length >= 3) {
      // Likely an item row
      const item = parseItemRow(line, lines[i - 1] || '', numbers);
      if (item.description) {
        items.push(item);
      }
    }
  }

  return items;
}

function parseItemRow(
  line: string, 
  prevLine: string,
  numbers: number[]
): {
  description: string;
  hsn_code: string;
  quantity: number;
  rate_per_unit: number;
  taxable_amount: number;
} {
  // Extract description (text before numbers)
  let description = line.match(/^([A-Za-z0-9\s\-\.\,\(\)\/&]+?)(?=\s+\d)/)?.[1]?.trim() || '';
  
  // If description is short or missing, check previous line
  if (description.length < 3 && prevLine) {
    const prevDesc = prevLine.match(/^([A-Za-z0-9\s\-\.\,\(\)\/&]+?)$/)?.[1]?.trim();
    if (prevDesc && prevDesc.length > 3 && !/^(description|item|product|hsn)/i.test(prevDesc)) {
      description = prevDesc;
    }
  }

  // Extract HSN code (typically 4-8 digit code)
  const hsnMatch = line.match(/\b(\d{4,8})\b/);
  const hsn_code = hsnMatch ? hsnMatch[1] : '';

  // Extract quantities and amounts
  // Typical order: HSN, Qty, Unit, Rate, Amount
  // Numbers array contains all numeric values found
  const quantity = numbers.length >= 1 ? numbers[0] : 0;
  const rate_per_unit = numbers.length >= 2 ? numbers[numbers.length - 2] : 0;
  const taxable_amount = numbers.length >= 2 ? numbers[numbers.length - 1] : 0;

  return {
    description,
    hsn_code,
    quantity,
    rate_per_unit,
    taxable_amount,
  };
}

function extractNumbersFromLine(line: string): number[] {
  // Match numbers including decimals and comma-separated thousands
  const numberPattern = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g;
  const matches = line.match(numberPattern) || [];
  return matches.map(m => parseFloat(m.replace(/,/g, '')));
}

// ========== STAGE 2: FINANCIAL SUMMARY EXTRACTION ==========

function extractFinancialSummary(
  lines: string[], 
  text: string,
  lineItems: Array<{taxable_amount: number}>
) {
  const subTotal = calculateSubTotal(lines, text, lineItems);
  const cgst = extractCGST(lines, text);
  const sgst = extractSGST(lines, text);
  const grandTotal = extractGrandTotal(lines, text);
  const totalInWords = extractTotalInWords(lines, text);

  return {
    sub_total_taxable_value: subTotal,
    total_cgst_amount: cgst,
    total_sgst_amount: sgst,
    grand_total_amount: grandTotal,
    total_in_words: totalInWords,
  };
}

function calculateSubTotal(
  lines: string[], 
  text: string,
  lineItems: Array<{taxable_amount: number}>
): number {
  // First try to extract from document
  const patterns = [
    /sub[\s\-]*total\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /taxable\s+value\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /total\s+taxable\s+value\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  // Fallback: Calculate from line items
  return lineItems.reduce((sum, item) => sum + item.taxable_amount, 0);
}

function extractCGST(lines: string[], text: string): number {
  const patterns = [
    /(?:output\s+)?cgst\s*[@]?\s*[\d\.]+\s*%?\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /total\s+cgst\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /cgst\s+amount\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
  ];

  let total = 0;
  const allMatches: number[] = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        allMatches.push(parseFloat(match[1].replace(/,/g, '')));
      }
    }
  }

  // Sum all CGST amounts
  if (allMatches.length > 0) {
    total = allMatches.reduce((sum, val) => sum + val, 0);
    // If we have multiple rates (2.5%, etc), the total is likely already summed
    // Return the largest value as it's likely the total
    return Math.max(...allMatches);
  }

  return total;
}

function extractSGST(lines: string[], text: string): number {
  const patterns = [
    /(?:output\s+)?sgst\s*[@]?\s*[\d\.]+\s*%?\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /total\s+sgst\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /sgst\s+amount\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
  ];

  let total = 0;
  const allMatches: number[] = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        allMatches.push(parseFloat(match[1].replace(/,/g, '')));
      }
    }
  }

  if (allMatches.length > 0) {
    return Math.max(...allMatches);
  }

  return total;
}

function extractGrandTotal(lines: string[], text: string): number {
  const patterns = [
    /grand\s+total\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /total\s+amount\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /final\s+amount\s*[:\-]?\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
    /total\s*[:\-]\s*₹?\s*([0-9,]+(?:\.\d+)?)/i,
  ];

  // Look for grand total in bottom 30% of document
  const bottomText = lines.slice(Math.floor(lines.length * 0.7)).join('\n');
  
  for (const pattern of patterns) {
    const match = bottomText.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  // Fallback: Find largest amount in bottom section
  const numbers = extractNumbersFromLine(bottomText);
  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

function extractTotalInWords(lines: string[], text: string): string {
  const patterns = [
    /(?:total\s+)?(?:amount\s+)?in\s+words?\s*[:\-]?\s*([^\n]+)/i,
    /(?:rupees|rs\.?)\s+([^\n]+?)\s+only/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/[#*]/g, '').replace(/\s{2,}/g, ' ');
    }
  }

  // Look in bottom section for words containing "rupees" and "only"
  const bottomLines = lines.slice(Math.floor(lines.length * 0.7));
  for (const line of bottomLines) {
    const lower = line.toLowerCase();
    if ((lower.includes('rupees') || lower.includes('rupee')) && lower.includes('only')) {
      return line.trim().replace(/[#*]/g, '').replace(/\s{2,}/g, ' ');
    }
  }

  return '';
}

// ========== STAGE 3: VALIDATION & ENHANCEMENT ==========

function validateAndEnhance(
  header: any,
  lineItems: any[],
  summary: any
): void {
  // Validate GSTIN format
  if (header.seller_gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]\d$/.test(header.seller_gstin)) {
    header.seller_gstin = '';
  }
  if (header.buyer_gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]\d$/.test(header.buyer_gstin)) {
    header.buyer_gstin = '';
  }

  // Calculate subtotal from line items if not extracted
  if (!summary.sub_total_taxable_value && lineItems.length > 0) {
    summary.sub_total_taxable_value = lineItems.reduce((sum, item) => sum + item.taxable_amount, 0);
  }

  // Validate grand total calculation
  const calculatedTotal = summary.sub_total_taxable_value + summary.total_cgst_amount + summary.total_sgst_amount;
  if (summary.grand_total_amount === 0 && calculatedTotal > 0) {
    summary.grand_total_amount = Math.round(calculatedTotal);
  }
}

// ========== HELPER FUNCTIONS ==========

function convertToYYYYMMDD(dateStr: string): string {
  // Input: DD-MM-YYYY, DD/MM/YYYY, etc.
  // Output: YYYY-MM-DD
  const parts = dateStr.split(/[\/\-\.]/);
  
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];

    // Handle 2-digit years
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = (parseInt(year) > 50 ? century - 100 : century) + parseInt(year) + '';
    }

    // Detect if already in YYYY-MM-DD format
    if (parts[0].length === 4) {
      year = parts[0];
      month = parts[1].padStart(2, '0');
      day = parts[2].padStart(2, '0');
    }

    return `${year}-${month}-${day}`;
  }

  return dateStr;
}
