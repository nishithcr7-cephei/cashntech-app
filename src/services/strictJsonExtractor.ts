import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';

/**
 * Expert Financial and Accounting Data Extraction Agent
 * Processes raw, unstructured OCR text from Tax Invoice (GST Invoice)
 * Transforms it into a perfectly structured JSON object
 * 
 * STRICT RULE: Adheres strictly to InvoiceFields JSON schema
 * Returns only valid JSON - no explanatory text, no conversational responses
 */
export function extractStructuredInvoiceJSON(rawOcrText: string): InvoiceFields {
  const cleaned = rawOcrText.replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ');
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Initialize structured JSON object with all required fields
  const invoiceJSON: InvoiceFields = {
    // Dealer Information Section
    dealer: extractDealer(lines, cleaned),
    dealerCode: extractDealerCode(lines, cleaned),
    odAccountNumber: extractODAccountNumber(lines, cleaned),

    // Invoice Details Section
    invoiceNumber: extractInvoiceNumber(lines, cleaned),
    associatedPO: extractAssociatedPO(lines, cleaned),
    tenor: '',
    invoiceDate: extractInvoiceDate(lines, cleaned),
    invoiceDueDate: extractInvoiceDueDate(lines, cleaned),

    // Additional Invoice Information
    earlyPaymentDiscount: extractEarlyPaymentDiscount(cleaned),
    currency: extractCurrency(cleaned) || 'INR',
    remark: extractRemark(lines, cleaned),

    // Line Items
    items: extractLineItems(cleaned, lines),

    // Legacy fields (for backward compatibility)
    vendorName: extractVendorName(lines),
    memberName: extractMemberName(lines, cleaned),
    memberId: extractMemberId(cleaned),
    phone: extractPhone(cleaned),
    email: extractEmail(cleaned),
    program: extractProgram(cleaned),
    startDate: extractStartDate(cleaned),
    expiryDate: extractExpiryDate(cleaned),
    amount: extractAmount(cleaned, 'amount'),
    taxableAmount: extractAmount(cleaned, 'taxable amount'),
    finalAmount: extractAmount(cleaned, 'final amount'),
    totalAmount: extractAmount(cleaned, 'total amount'),
    paidAmount: extractAmount(cleaned, 'paid amount'),
    dueAmount: extractAmount(cleaned, 'due amount'),
    gstNumber: extractGSTNumber(cleaned),
    taxAmount: extractTaxAmount(cleaned),
    amountInWords: extractAmountInWords(lines, cleaned),
  };

  return invoiceJSON;
}

// ========== DEALER INFORMATION ==========

function extractDealer(lines: string[], text: string): string {
  // Priority 1: Label-based extraction
  const dealerLabels = [
    'dealer / distributor',
    'dealer name',
    'dealer',
    'seller',
    'vendor',
    'supplier',
    'from',
  ];

  for (const label of dealerLabels) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(label)) {
        const afterLabel = lines[i].substring(lower.indexOf(label) + label.length)
          .replace(/^[:\-\s]+/, '').trim();
        if (afterLabel.length > 3) return afterLabel;
        
        // Check next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.length > 3 && !/^(invoice|tax|gst|date|amount)/i.test(nextLine)) {
            return nextLine;
          }
        }
      }
    }
  }

  // Priority 2: Extract from vendor name (common alias)
  return extractVendorName(lines);
}

function extractDealerCode(lines: string[], text: string): string {
  const patterns = [
    /dealer\s+code\s*[:]\s*([A-Z0-9\-]{2,20})/i,
    /dealer\s+code\s*[:]\s*([A-Za-z0-9\-]+)/i,
    /code\s*[:]\s*([A-Z0-9\-]{3,15})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return '';
}

function extractODAccountNumber(lines: string[], text: string): string {
  const patterns = [
    /od\s+account\s+number\s*[:]?\s*([A-Z0-9\-]+)/i,
    /od\s+account\s*[:]?\s*([A-Z0-9\-]+)/i,
    /account\s+number\s*[:]?\s*([A-Z0-9\-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return '';
}

// ========== INVOICE DETAILS ==========

function extractInvoiceNumber(lines: string[], text: string): string {
  // Priority 1: Label-based extraction (most reliable)
  const invoiceLabels = [
    'invoice / unique ref. no',
    'invoice / unique ref no',
    'invoice/unique ref no',
    'invoice no',
    'invoice number',
    'invoice#',
    'inv no',
    'bill no',
    'tax invoice no',
  ];

  for (const label of invoiceLabels) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(label)) {
        // Extract value after label on same line
        const afterLabel = lines[i].substring(lower.indexOf(label) + label.length)
          .replace(/^[:\-\s]+/, '').trim();
        
        // Match invoice number pattern (alphanumeric with slashes/dashes, no spaces)
        const invoiceMatch = afterLabel.match(/^([A-Z0-9][A-Z0-9\-\/\.]{2,24})/i);
        if (invoiceMatch && invoiceMatch[1]) {
          return invoiceMatch[1].trim();
        }

        // Check next line if current line has no valid match
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const nextMatch = nextLine.match(/^([A-Z0-9][A-Z0-9\-\/\.]{2,24})/i);
          if (nextMatch && nextMatch[1]) {
            return nextMatch[1].trim();
          }
        }
      }
    }
  }

  // Priority 2: Pattern-based extraction
  const patterns = [
    /(?:invoice|inv|bill|tax)[\s:-]*([A-Z0-9][A-Z0-9\-\/\.]{2,24})/i,
    /(?:INV|BILL|TAX|GST|CN|INVOICE)[-\/]?\d{2,5}[-\/]?\d{0,5}/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 3 && candidate.length <= 25) {
        return candidate;
      }
    }
  }

  return '';
}

function extractAssociatedPO(lines: string[], text: string): string {
  const poLabels = [
    'associated po',
    'po number',
    'purchase order',
    'po no',
    'p.o.',
  ];

  for (const label of poLabels) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(label)) {
        const afterLabel = lines[i].substring(lower.indexOf(label) + label.length)
          .replace(/^[:\-\s]+/, '').trim();
        const poMatch = afterLabel.match(/^([A-Z0-9\-\/]{2,25})/i);
        if (poMatch && poMatch[1]) return poMatch[1].trim();
        
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const nextMatch = nextLine.match(/^([A-Z0-9\-\/]{2,25})/i);
          if (nextMatch && nextMatch[1]) return nextMatch[1].trim();
        }
      }
    }
  }

  return '';
}

function extractInvoiceDate(lines: string[], text: string): string {
  const dateLabels = [
    'invoice date',
    'invoice dt',
    'inv date',
    'date of invoice',
    'tax invoice date',
    'invoice dated',
    'dated',
    'bill date',
  ];

  for (const label of dateLabels) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(label)) {
        const afterLabel = lines[i].substring(lower.indexOf(label) + label.length)
          .replace(/^[:\-\s]+/, '').trim();
        
        // Try to match date patterns
        const dateMatch = afterLabel.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
        if (dateMatch) return normalizeDate(dateMatch[1]);
        
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const nextDateMatch = nextLine.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
          if (nextDateMatch) return normalizeDate(nextDateMatch[1]);
        }
      }
    }
  }

  // Fallback: Find first date in header region
  const headerText = lines.slice(0, Math.min(20, lines.length)).join(' ');
  const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/;
  const match = headerText.match(datePattern);
  if (match) return normalizeDate(match[1]);

  return '';
}

function extractInvoiceDueDate(lines: string[], text: string): string {
  const dueDateLabels = [
    'invoice due date',
    'due date',
    'payment due date',
    'due on',
    'payable by',
  ];

  for (const label of dueDateLabels) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(label)) {
        const afterLabel = lines[i].substring(lower.indexOf(label) + label.length)
          .replace(/^[:\-\s]+/, '').trim();
        const dateMatch = afterLabel.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
        if (dateMatch) return normalizeDate(dateMatch[1]);
      }
    }
  }

  return '';
}

// ========== ADDITIONAL INFORMATION ==========

function extractEarlyPaymentDiscount(text: string): string {
  const patterns = [
    /early\s+payment\s+discount\s*[:]?\s*(\d+(?:\.\d+)?)\s*%/i,
    /discount\s*[:]?\s*(\d+(?:\.\d+)?)\s*%/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return '';
}

function extractCurrency(text: string): string {
  const currencyMatch = text.match(/\b(?:currency|curr)\s*[:]?\s*([A-Z]{3})\b/i);
  if (currencyMatch && currencyMatch[1]) {
    return currencyMatch[1].toUpperCase();
  }
  return '';
}

function extractRemark(lines: string[], text: string): string {
  const remarkKeywords = ['remark', 'remarks', 'notes', 'note', 'description', 'comments'];
  
  for (const keyword of remarkKeywords) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(keyword)) {
        const afterKeyword = lines[i].substring(lower.indexOf(keyword) + keyword.length)
          .replace(/^[:\-\s]+/, '').trim();
        if (afterKeyword.length > 0) return afterKeyword;
        
        if (i + 1 < lines.length) {
          return lines[i + 1].trim();
        }
      }
    }
  }

  return '';
}

// ========== LINE ITEMS ==========

function extractLineItems(text: string, lines: string[]): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];
  
  // Find items section (usually has headers like "Description", "QTY", "Rate", "Amount")
  let itemsStartIdx = -1;
  const itemHeaders = ['description', 'item', 'product', 'qty', 'quantity', 'rate', 'price', 'amount'];
  
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    const hasHeaders = itemHeaders.filter(h => lower.includes(h)).length >= 2;
    if (hasHeaders && itemsStartIdx === -1) {
      itemsStartIdx = i + 1;
      break;
    }
  }

  if (itemsStartIdx === -1) return items;

  // Extract items from table-like structure
  for (let i = itemsStartIdx; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop if we hit summary sections
    if (/^(sub|total|tax|gst|cgst|sgst|igst|grand|final|amount)/i.test(line)) {
      break;
    }

    // Try to parse as item row
    const numbers = line.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbers && numbers.length >= 2) {
      // Extract item name (text before numbers)
      const nameMatch = line.match(/^([A-Za-z0-9\s\-\.\/]+?)(?=\s+\d)/i);
      const itemName = nameMatch ? nameMatch[1].trim() : line.split(/\s{2,}/)[0] || '';
      
      if (itemName.length > 0 && numbers.length >= 2) {
        items.push({
          itemName: itemName,
          quantity: numbers[0] || '',
          unit: extractUnit(line) || '',
          pricePerQuantity: numbers.length > 1 ? numbers[numbers.length - 2] : '',
          total: numbers[numbers.length - 1] || '',
        });
      }
    }
  }

  return items;
}

function extractUnit(line: string): string {
  const unitMatch = line.match(/\b(pcs|pieces|kg|g|gm|ml|l|m|cm|mm|box|carton|pack|unit|nos)\b/i);
  return unitMatch ? unitMatch[1] : '';
}

// ========== LEGACY FIELDS ==========

function extractVendorName(lines: string[]): string {
  // Look for company name in header region (usually all caps or title case)
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const line = lines[i].trim();
    if (/invoice|tax|gst|bill|date|amount/i.test(line)) continue;
    if (/^[A-Z][A-Z0-9\s\-&\.]{6,}$/.test(line) || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/.test(line)) {
      return line;
    }
  }
  return lines.length > 0 ? lines[0] : '';
}

function extractMemberName(lines: string[], text: string): string {
  const nameLabels = ['name:', 'customer name', 'member name', 'client name', 'bill to'];
  for (const label of nameLabels) {
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes(label)) {
        const afterLabel = lines[i].substring(lower.indexOf(label) + label.length)
          .replace(/^[:\-\s]+/, '').trim();
        if (afterLabel.length > 2) return afterLabel;
      }
    }
  }
  return '';
}

function extractMemberId(text: string): string {
  const match = text.match(/\b(?:member|customer|client)\s+id\s*[:]?\s*([A-Z0-9\-]+)/i);
  return match && match[1] ? match[1].trim() : '';
}

function extractPhone(text: string): string {
  const phoneMatch = text.match(/\b(?:\+91|0)?[6-9]\d{9}\b/);
  return phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, '') : '';
}

function extractEmail(text: string): string {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  return emailMatch ? emailMatch[0] : '';
}

function extractProgram(text: string): string {
  const match = text.match(/\bprogram\s*[:]?\s*([A-Za-z0-9\s\-]+)/i);
  return match && match[1] ? match[1].trim() : '';
}

function extractStartDate(text: string): string {
  const match = text.match(/start\s+date\s*[:]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  return match ? normalizeDate(match[1]) : '';
}

function extractExpiryDate(text: string): string {
  const match = text.match(/(?:expiry|expires|end)\s+date\s*[:]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  return match ? normalizeDate(match[1]) : '';
}

function extractAmount(text: string, keyword: string): string {
  const patterns = [
    new RegExp(`${keyword}\\s*[:]?\\s*₹?\\s*([0-9,]+(?:\\.\\d+)?)`, 'i'),
    new RegExp(`${keyword}\\s*[:]?\\s*([0-9,]+(?:\\.\\d+)?)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/,/g, '').trim();
    }
  }

  return '';
}

function extractTaxAmount(text: string): string {
  const patterns = [
    /(?:total\s+)?tax\s+amount\s*[:]?\s*₹?\s*([0-9,]+(?:\\.\d+)?)/i,
    /gst\s+amount\s*[:]?\s*₹?\s*([0-9,]+(?:\\.\d+)?)/i,
    /cgst\s+amount\s*[:]?\s*₹?\s*([0-9,]+(?:\\.\d+)?)/i,
    /sgst\s+amount\s*[:]?\s*₹?\s*([0-9,]+(?:\\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // If multiple tax amounts found, sum them
      const allMatches = text.matchAll(pattern);
      let total = 0;
      for (const m of allMatches) {
        total += parseFloat(m[1].replace(/,/g, ''));
      }
      return total > 0 ? total.toString() : match[1].replace(/,/g, '');
    }
  }

  return '';
}

function extractGSTNumber(text: string): string {
  const gstMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z]\d\b/i);
  return gstMatch ? gstMatch[0].toUpperCase() : '';
}

function extractAmountInWords(lines: string[], text: string): string {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('amount in words')) {
      if (i + 1 < lines.length) {
        return lines[i + 1].trim().replace(/[#*]/g, '').replace(/\s{2,}/g, ' ');
      }
    }
    if ((lower.includes('rupees') || lower.includes('rupess')) && lower.includes('only')) {
      return lines[i].replace(/[#*]/g, '').replace(/\s{2,}/g, ' ').trim();
    }
  }
  return '';
}

// ========== HELPER FUNCTIONS ==========

function normalizeDate(dateStr: string): string {
  // Normalize to DD-MM-YYYY format
  const parts = dateStr.split(/[\/\-\. ]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      year = (parseInt(year) > 50 ? currentCentury - 100 : currentCentury) + parseInt(year) + '';
    }
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

