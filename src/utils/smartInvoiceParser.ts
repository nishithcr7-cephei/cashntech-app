import type {InvoiceFields} from '@type/Invoice';

/**
 * FREE AI-ALTERNATIVE: Multi-format intelligent invoice parser
 * Handles invoices from different companies with different formats
 * Works entirely offline, no API costs
 */

/**
 * Find field value using multiple keyword variations and strategies
 */
const DATE_NUMERIC = /\b(\d{1,2}[\/\-\. ]\d{1,2}[\/\-\. ]\d{2,4})\b/;
const DATE_ISO = /\b(\d{4}[\/\-\. ]\d{1,2}[\/\-\. ]\d{1,2})\b/;
const DATE_MONTH_TEXT = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\b/i;

function findFieldByKeywords(
  text: string,
  keywords: string[],
  options: {
    extractAfter?: boolean;
    maxDistance?: number;
    valuePattern?: RegExp;
    extractFromNextLine?: boolean;
  } = {},
): string {
  const {extractAfter = true, maxDistance = 3, valuePattern, extractFromNextLine = true} = options;
  const lines = text.split('\n').map(l => l.trim());
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    const idx = lowerText.indexOf(keywordLower);

    if (idx === -1) continue;

    // Find the line containing the keyword
    const lineIdx = text.substring(0, idx).split('\n').length - 1;
    const candidateLines = lines.slice(
      Math.max(0, lineIdx),
      Math.min(lines.length, lineIdx + maxDistance),
    );

    for (let lineIndex = 0; lineIndex < candidateLines.length; lineIndex++) {
      const line = candidateLines[lineIndex];
      const lineLower = line.toLowerCase();
      const keywordPos = lineLower.indexOf(keywordLower);

      if (keywordPos === -1) continue;

      if (extractAfter) {
        const afterKeyword = line.substring(keywordPos + keyword.length).trim();
        const cleaned = afterKeyword.replace(/^[:\-\s]+/, '').trim();
        
        if (valuePattern) {
          const match = cleaned.match(valuePattern);
          if (match && match[1]) return match[1].trim();
        } else {
          const valueMatch = cleaned.match(/([A-Z0-9\w\s\-\.\/]+)/);
          if (valueMatch && valueMatch[1]) {
            const value = valueMatch[1].trim();
            // If value is too short or looks incomplete, check next line
            if (value.length > 0 && value.length < 100 && value.length > 2) {
              return value;
            }
          }
        }

        // If nothing found on same line and extractFromNextLine is true, check next line
        if (extractFromNextLine && lineIndex < candidateLines.length - 1) {
          const nextLine = candidateLines[lineIndex + 1].trim();
          if (nextLine && nextLine.length > 0 && nextLine.length < 100) {
            // Check if next line doesn't contain another keyword (avoid false matches)
            const hasOtherKeyword = keywords.some(k => 
              k !== keyword && nextLine.toLowerCase().includes(k.toLowerCase())
            );
            if (!hasOtherKeyword) {
              return nextLine;
            }
          }
        }
      }
    }
  }

  return '';
}

function extractDateFromCandidate(candidate: string): string {
  // Try to normalize using Indian date patterns first
  const monthPattern = '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*';
  const indianPatterns = [
    // DD-MM-YYYY, DD/MM/YYYY (Indian format)
    {
      pattern: new RegExp(`\\b(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{2,4})\\b`),
      type: 'numeric' as const,
    },
    // Text format with ordinal: "3rd Oct 2025" or "03 Oct 2025"
    {
      pattern: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthPattern}\\.?[,]?\\s+(\\d{2,4})\\b`, 'i'),
      type: 'text' as const,
    },
    // ISO format: YYYY-MM-DD
    {
      pattern: /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
      type: 'iso' as const,
    },
    // DD-MMM-YYYY: "03-Oct-2025"
    {
      pattern: new RegExp(`\\b(\\d{1,2})[\\/\\-\\.]${monthPattern}[\\/\\-\\.](\\d{2,4})\\b`, 'i'),
      type: 'text' as const,
    },
  ];

  for (const {pattern, type} of indianPatterns) {
    const match = candidate.match(pattern);
    if (match && match.length > 1) {
      const normalized = validateAndNormalizeIndianDate(match, type);
      if (normalized) return normalized;
    }
  }

  // Fallback to original patterns
  const patterns = [DATE_MONTH_TEXT, DATE_NUMERIC, DATE_ISO];
  for (const pattern of patterns) {
    const match = candidate.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return candidate.trim();
}

function extractValueByLabel(
  lines: string[],
  labelKeywords: string[],
  options: {
    lookahead?: number;
    valuePattern?: RegExp;
    sanitize?: (value: string) => string;
  } = {},
): string {
  const {lookahead = 2, valuePattern, sanitize} = options;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const lower = line.toLowerCase();
    const matchedLabel = labelKeywords.find(label => lower.includes(label));
    if (!matchedLabel) continue;

    const after = line.slice(lower.indexOf(matchedLabel) + matchedLabel.length).replace(/^[^\w]*[:\-\s]+/, '').trim();
    if (after) {
      let value = valuePattern ? (after.match(valuePattern)?.[1] || after.match(valuePattern)?.[0]) : after;
      if (value) {
        value = value.trim();
        if (sanitize) value = sanitize(value);
        if (value.length >= 2 && value.length <= 100) {
          return value;
        }
      }
    }

    // Look ahead lines for the value
    for (let offset = 1; offset <= lookahead; offset++) {
      const nextLine = lines[i + offset];
      if (!nextLine) continue;
      const nextLower = nextLine.toLowerCase();
      const containsOtherLabel = labelKeywords.some(label => nextLower.includes(label));
      if (containsOtherLabel) break;
      let candidate = valuePattern ? (nextLine.match(valuePattern)?.[1] || nextLine.match(valuePattern)?.[0]) : nextLine;
      if (candidate) {
        candidate = candidate.trim();
        if (sanitize) candidate = sanitize(candidate);
        if (candidate.length >= 2 && candidate.length <= 100) {
          return candidate;
        }
      }
    }
  }
  return '';
}

/**
 * Extract invoice number - handles 10+ different formats including "Invoice / Unique Ref. No"
 * ENHANCED with Indian invoice number heuristics
 */
function extractInvoiceNumber(text: string): string {
  // PRIORITY 1: User's labeled extraction pattern (exact match from heuristics)
  // Pattern: /(?:invoice|inv|bill|tax)[\s:-]*([A-Z0-9\/-]{3,20})/i
  const labeledPattern = /(?:invoice|inv|bill|tax)[\s:-]*([A-Z0-9\/-]{3,20})/i;
  const labeledMatch = text.match(labeledPattern);
  if (labeledMatch && labeledMatch[1]) {
    const candidate = labeledMatch[1].trim();
    if (candidate.length >= 3 && candidate.length <= 20) {
      return candidate;
    }
  }

  // PRIORITY 2: User's invoice format pattern (standalone invoice numbers)
  // Pattern: /(?:INV|BILL|TAX|GST|CN|INVOICE|BILLNO)[-\/]?\d{2,5}[-\/]?\d{0,5}/i
  const formatPattern = /(?:INV|BILL|TAX|GST|CN|INVOICE|BILLNO)[-\/]?\d{2,5}[-\/]?\d{0,5}/i;
  const formatMatch = text.match(formatPattern);
  if (formatMatch && formatMatch[0]) {
    const candidate = formatMatch[0].trim();
    // Exclude if it looks like part of a date or other context
    if (!/\d{4,4}[-\/]/.test(candidate) && candidate.length >= 5 && candidate.length <= 20) {
      return candidate;
    }
  }

  // PRIORITY 3: Indian Financial Year patterns (FY format)
  // Examples: FY23-24/001, FY2023-24/INV/123, 23-24/INV/0456, 2023-24/001
  const fyPatterns = [
    /\bFY\s*\d{2,4}[-\/]\d{2}[-\/](?:[A-Z]{1,6}[-\/])?\d{1,6}\b/i, // FY23-24/001, FY2023-24/INV/123
    /\b\d{2,4}[-\/]\d{2}[-\/](?:INV|TAX|GST|BILL)[-\/]?\d{1,6}\b/i, // 23-24/INV/123, 2023-24/TAX/0456
    /\b\d{2,4}[-\/]\d{2}[-\/]\d{1,6}\b/i, // 23-24/001, 2023-24/123
  ];
  for (const pattern of fyPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const candidate = match[0].trim();
      // Exclude dates (4-digit year at start) unless it's clearly an invoice format
      if (!/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(candidate) && candidate.length >= 6 && candidate.length <= 20) {
        return candidate;
      }
    }
  }

  // PRIORITY 4: Month-based patterns (YYMM or YYYYMM format)
  // Examples: 2401-001 (Jan 2024, sequence 001), 202401/INV/123
  const monthPatterns = [
    /\b\d{2}(?:0[1-9]|1[0-2])[-\/](?:INV|TAX|GST)?[-\/]?\d{1,5}\b/i, // 2401-001, 2401/INV/123
    /\b\d{4}(?:0[1-9]|1[0-2])[-\/](?:INV|TAX|GST)?[-\/]?\d{1,5}\b/i, // 202401/INV/123
    /\b\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])[-\/]\d{1,5}\b/i, // 240130-001 (YYMMDD-seq)
  ];
  for (const pattern of monthPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const candidate = match[0].trim();
      if (candidate.length >= 7 && candidate.length <= 20) {
        return candidate;
      }
    }
  }

  // PRIORITY 5: Branch/City/State code patterns
  // Examples: INV/DEL/2024/001, INV/MUM/24/123, MH/INV/2024/123
  const branchPatterns = [
    /\b(?:INV|TAX|GST|BILL)[-\/][A-Z]{2,4}[-\/]\d{2,4}[-\/]\d{1,6}\b/i, // INV/DEL/2024/001
    /\b[A-Z]{2,4}[-\/](?:INV|TAX|GST|BILL)[-\/]\d{2,4}[-\/]\d{1,6}\b/i, // MH/INV/2024/123, DEL/INV/24/123
    /\b(?:INV|TAX|GST|BILL)[-\/][A-Z]{2,4}[-\/]\d{1,6}\b/i, // INV/DEL/123 (no year)
  ];
  for (const pattern of branchPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const candidate = match[0].trim();
      // Exclude if it's too short or looks like something else
      if (candidate.length >= 6 && candidate.length <= 25) {
        return candidate;
      }
    }
  }

  // PRIORITY 6: Series/Dealer code patterns
  // Examples: A/2024/001, Series-A/001, D001/INV/24/123, DEALER001/INV/123
  const seriesPatterns = [
    /\b[A-Z][-\/]\d{2,4}[-\/]\d{1,6}\b/i, // A/2024/001, B-24/123
    /\bSeries[-\/]?[A-Z][-\/]?\d{1,6}\b/i, // Series-A/001, Series-A-123
    /\b(?:D|DEALER|DLR)\d{1,4}[-\/](?:INV|TAX|GST)?[-\/]?\d{2,4}[-\/]?\d{1,6}\b/i, // D001/INV/24/123, DEALER001/123
    /\b[A-Z]{2,8}\d{1,4}[-\/](?:INV|TAX|GST|BILL)[-\/]?\d{2,4}[-\/]?\d{1,6}\b/i, // DEALER001/INV/123
  ];
  for (const pattern of seriesPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const candidate = match[0].trim();
      if (candidate.length >= 5 && candidate.length <= 25) {
        return candidate;
      }
    }
  }

  // PRIORITY 7: GST Tax Invoice patterns
  // Examples: GST/INV/2024/123, TAX-INV-2024-001
  const gstTaxPatterns = [
    /\bGST[-\/](?:INV|TAX|INVOICE)[-\/]\d{2,4}[-\/]\d{1,6}\b/i, // GST/INV/2024/123
    /\bTAX[-\/]?INV[-\/]\d{2,4}[-\/]\d{1,6}\b/i, // TAX-INV-2024-001
    /\b(?:GST|TAX)[-\/]?\d{2,4}[-\/]\d{1,6}\b/i, // GST/24/123 (simpler format)
  ];
  for (const pattern of gstTaxPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const candidate = match[0].trim();
      if (candidate.length >= 6 && candidate.length <= 20) {
        return candidate;
      }
    }
  }

  // Try "Invoice / Unique Ref. No" format first (very specific)
  const uniqueRefPatterns = [
    /\bInvoice\s*\/\s*Unique\s+Ref\.?\s*No\.?\s*[:#]?\s*([A-Z0-9\/\-]+)/i,
    /\bInvoice\s*\/\s*Unique\s+Ref\.?\s*No\.?\s*[:#]?\s*([A-Z0-9\-]+)/i,
    /\bUnique\s+Ref\.?\s*No\.?\s*[:#]?\s*([A-Z0-9\/\-]+)/i,
  ];

  for (const pattern of uniqueRefPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 3 && candidate.length <= 25) {
        return candidate;
      }
    }
  }

  // PRIORITY 8: Year + Sequence patterns (common in India)
  // Examples: 2024-001, 24-001, 2024/12345
  const yearSeqPatterns = [
    /\b(?:INV|TAX|GST|BILL|INVOICE)[-\/]?\d{2,4}[-\/]\d{3,8}\b/i, // INV-2024-00123, TAX/24/12345
    /\b\d{4}[-\/]\d{3,8}\b/i, // 2024-001, 2024/12345 (4-digit year)
    /\b\d{2}[-\/]\d{3,8}\b/i, // 24-001, 24/12345 (2-digit year, but need to avoid dates)
  ];
  for (const pattern of yearSeqPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const candidate = match[0].trim();
      // Exclude if it looks like a date (DD/MM or MM/DD format)
      if (!/^\d{1,2}[-\/]\d{1,2}[-\/]/.test(candidate) && candidate.length >= 7 && candidate.length <= 20) {
        return candidate;
      }
    }
  }

  // PRIORITY 9: Alphanumeric combinations (common format)
  // Examples: INV24A001, BILL2024X001, TAX-24-A-123
  const alphanumPatterns = [
    /\b(?:INV|TAX|GST|BILL|INVOICE)[-\/]?\d{2,4}[A-Z][-\/]?\d{1,6}\b/i, // INV24A001, TAX-24-A-123
    /\b(?:INV|TAX|GST|BILL)[A-Z]\d{2,4}[-\/]?\d{1,6}\b/i, // INV-A-2024/001, TAXX24/123
  ];
  for (const pattern of alphanumPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const candidate = match[0].trim();
      if (candidate.length >= 6 && candidate.length <= 20) {
        return candidate;
      }
    }
  }

  // Try strict patterns (highest confidence)
  const strictPatterns = [
    /\bINVOICE\s*[:#]\s*(INV[\w\-]+)\b/i,
    /\bInvoice\s*(?:No|Number|#)?\s*[:#]?\s*(INV[\w\-]+)\b/i,
    /\bBill\s*(?:No|Number|#)?\s*[:#]?\s*(INV[\w\-]+)\b/i,
    /\bINV[\-]?[A-Z0-9]+\b/i,
  ];

  for (const pattern of strictPatterns) {
    const match = text.match(pattern);
    if (match) return (match[1] || match[0]).trim();
  }

  // Generic patterns for different formats
  const genericPatterns = [
    /(?:Invoice|Bill|Inv)\s*(?:No|Number|#)?\s*[:#]?\s*([A-Z0-9\-]{3,20})/i,
    /\b([A-Z]{2,5}[\-\/]?\d{3,10})\b/,
    /Invoice\s+([A-Z0-9\/\-]+)/i,
    /Bill\s+([A-Z0-9\/\-]+)/i,
    /\bRef\.?\s*No\.?\s*[:#]?\s*([A-Z0-9\/\-]+)/i,
    /\bReference\s*(?:No|Number)?\s*[:#]?\s*([A-Z0-9\/\-]+)/i,
  ];

  for (const pattern of genericPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1];
      if (candidate.length >= 4 && candidate.length <= 25) {
        return candidate;
      }
    }
  }

  return '';
}

/**
 * Validate if extracted date components form a valid Indian date
 * Returns normalized DD-MM-YYYY format if valid, empty string otherwise
 */
function validateAndNormalizeIndianDate(match: RegExpMatchArray, patternType: 'numeric' | 'text' | 'iso'): string {
  const currentYear = new Date().getFullYear();
  const minYear = 2010;
  const maxYear = currentYear + 1;

  let day = 0, month = 0, year = 0;

  if (patternType === 'iso') {
    // ISO format: YYYY-MM-DD or YYYY/MM/DD
    year = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    day = parseInt(match[3], 10);
  } else if (patternType === 'text') {
    // Text format: "3 Oct 2025" or "03 Oct 2025"
    day = parseInt(match[1], 10);
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];
    const monthMatch = match[2].toLowerCase();
    const monthIdx = monthNames.findIndex(m => monthMatch.startsWith(m));
    month = monthIdx >= 0 ? (monthIdx === 8 ? 9 : monthIdx + 1) : 0; // 'sep' and 'sept' both map to 9
    year = parseInt(match[3], 10);
    if (year < 100) year = 2000 + year;
  } else {
    // Numeric format: DD-MM-YYYY or DD/MM/YYYY (Indian preference)
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    year = parseInt(match[3], 10);
    if (year < 100) year = 2000 + year;
  }

  // Validate ranges
  if (year < minYear || year > maxYear) return '';
  if (month < 1 || month > 12) return '';
  if (day < 1 || day > 31) return '';

  // Basic month-day validation
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) return '';

  // Format as DD-MM-YYYY
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yy = String(year);

  return `${dd}-${mm}-${yy}`;
}

/**
 * Extract date - handles 8+ date formats
 * ENHANCED with Indian date format patterns (DD-MM-YYYY preference)
 */
function extractDate(
  text: string,
  keywords: string[],
): string {
  const lines = text.split('\n').map(l => l.trim());

  // PRIORITY 1: India-specific patterns - search near invoice date keywords first
  const indianDateKeywords = [
    'invoice date', 'inv date', 'date of invoice', 'tax invoice date',
    'invoice dated', 'dated', 'bill date', 'dt', 'dt:', 'date:',
  ];

  // Combine user keywords with Indian-specific ones
  const allKeywords = [...new Set([...keywords, ...indianDateKeywords])];

  // Month names pattern
  const monthPattern = '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*';

  // Indian date patterns (prioritize DD/MM/YYYY format)
  const indianDatePatterns = [
    // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY (Indian format - highest priority)
    {
      pattern: new RegExp(`\\b(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{2,4})\\b`),
      type: 'numeric' as const,
    },
    // Text format: "3 Oct 2025" or "3rd Oct 2025" or "03 Oct 2025"
    {
      pattern: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthPattern}\\.?[,]?\\s+(\\d{2,4})\\b`, 'i'),
      type: 'text' as const,
    },
    // ISO format: YYYY-MM-DD or YYYY/MM/DD
    {
      pattern: /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
      type: 'iso' as const,
    },
    // DD-MMM-YYYY: "03-Oct-2025" or "03/Oct/2025"
    {
      pattern: new RegExp(`\\b(\\d{1,2})[\\/\\-\\.]${monthPattern}[\\/\\-\\.](\\d{2,4})\\b`, 'i'),
      type: 'text' as const,
    },
  ];

  // Search line by line for dates near keywords (better accuracy)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Check if line contains invoice date keywords
    const hasKeyword = allKeywords.some(k => lineLower.includes(k.toLowerCase()));
    if (!hasKeyword) continue;

    // Try patterns on same line after keyword
    for (const {pattern, type} of indianDatePatterns) {
      const match = line.match(pattern);
      if (match && match.length > 1) {
        const normalized = validateAndNormalizeIndianDate(match, type);
        if (normalized) return normalized;
      }
    }

    // Try next 2 lines for dates (common when label is on separate line)
    for (let offset = 1; offset <= 2 && i + offset < lines.length; offset++) {
      const nextLine = lines[i + offset];
      if (!nextLine || nextLine.length < 5) continue;

      // Skip if next line contains another date-related keyword (likely due date, etc.)
      const nextLower = nextLine.toLowerCase();
      if (/due|payment|expiry|valid|start|end/i.test(nextLower) && 
          /date|dt|dated/i.test(nextLower)) {
        continue;
      }

      for (const {pattern, type} of indianDatePatterns) {
        const match = nextLine.match(pattern);
        if (match && match.length > 1) {
          const normalized = validateAndNormalizeIndianDate(match, type);
          if (normalized) return normalized;
        }
      }
    }
  }

  // PRIORITY 2: Original findFieldByKeywords approach (for backward compatibility)
  const date = findFieldByKeywords(text, allKeywords, {
    extractAfter: true,
    maxDistance: 2,
    valuePattern: /([A-Z][a-z]+\s+\d{1,2},\s+\d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
  });

  if (date) {
    // Validate and normalize the found date
    for (const {pattern, type} of indianDatePatterns) {
      const match = date.match(pattern);
      if (match && match.length > 1) {
        const normalized = validateAndNormalizeIndianDate(match, type);
        if (normalized) return normalized;
      }
    }
    // Return as-is if normalization fails (backward compatibility)
    return date;
  }

  // PRIORITY 3: Fallback - search context around keywords (avoid "due date" contexts)
  const lowerText = text.toLowerCase();
  // Remove "due date" and "payment date" contexts to avoid confusion
  const textWithoutDue = lowerText.includes('due date') || lowerText.includes('payment date')
    ? text.replace(/.{0,50}(?:due|payment)\s+date.{0,50}/gi, '')
    : text;

  for (const keyword of allKeywords) {
    const idx = textWithoutDue.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) continue;

    const context = textWithoutDue.substring(
      Math.max(0, idx - 30),
      Math.min(textWithoutDue.length, idx + 80),
    );

    // Try Indian patterns first
    for (const {pattern, type} of indianDatePatterns) {
      const match = context.match(pattern);
      if (match && match.length > 1) {
        const normalized = validateAndNormalizeIndianDate(match, type);
        if (normalized) return normalized;
      }
    }

    // Fallback to original patterns
    const originalPatterns = [
      /\b([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/i,  // "October 30, 2025"
      /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,  // "30-10-2025"
      /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/,    // "2025-10-30"
    ];

    for (const pattern of originalPatterns) {
      const match = context.match(pattern);
      if (match) return match[1];
    }
  }

  return '';
}

/**
 * Indian dealer/firm suffix patterns for enhanced recognition
 */
const INDIAN_DEALER_SUFFIXES = [
  // Dealership / Sales
  'dealer', 'authorised dealer', 'authorized dealer', 'retailer', 
  'distributor', 'channel partner', 'stockist', 'reseller', 
  'showroom', 'outlet',
  // Business Type (specific ones user mentioned)
  'pvt ltd', 'private limited', 'ltd', 'limited', 'llp',
  'co.', 'co', 'company', 'corporation', 
  'enterprises', 'traders', 'traders pvt ltd', 'firm', 
  'associates', 'agency', 'agencies', 'agency pvt ltd',
  // Marketing / Service Firms
  'marketing', 'marketing pvt ltd', 'services', 'service center', 
  'solutions', 'consultancy', 'consultants', 'technologies', 'systems',
  // Manufacturing or Wholesaler
  'industries', 'products', 'manufacturers', 'wholesalers', 
  'suppliers', 'equipments',
  // Local Patterns (including & Sons which user mentioned)
  'bros.', 'bros', '& sons', 'and sons', '& co.', 'and co', 
  'and company', 'impex', 'exports', 'imports', 'motors', 
  'hardware', 'electricals',
  // Legal suffixes
  'llc', 'inc', 'corporation', 'corp'
];

/**
 * Create regex pattern for Indian dealer/firm suffixes
 * Matches any line containing these suffixes (case-insensitive)
 */
function createIndianDealerSuffixPattern(): RegExp {
  const escapedSuffixes = INDIAN_DEALER_SUFFIXES
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp(`\\b(${escapedSuffixes})\\b`, 'i');
}

const INDIAN_DEALER_SUFFIX_PATTERN = createIndianDealerSuffixPattern();

/**
 * Check if a line contains Indian dealer/firm suffix patterns
 * Returns confidence score (0-1) based on match strength
 */
function scoreLineForIndianDealer(
  line: string,
  options: {
    checkContext?: boolean;
    contextLines?: string[];
  } = {}
): { score: number; matchedSuffix?: string } {
  const { checkContext = true, contextLines = [] } = options;
  const trimmed = line.trim();
  
  if (!trimmed || trimmed.length < 3 || trimmed.length > 80) {
    return { score: 0 };
  }

  let score = 0;
  let matchedSuffix: string | undefined;

  // Check for suffix patterns in the line
  const suffixMatch = trimmed.match(INDIAN_DEALER_SUFFIX_PATTERN);
  if (suffixMatch) {
    matchedSuffix = suffixMatch[1];
    score += 0.6; // Strong indicator if suffix found
    
    // Extra points for specific patterns user mentioned
    if (/pvt\s+ltd|private\s+limited/i.test(trimmed)) {
      score += 0.25; // High priority for Pvt LTD
    }
    if (/\b(ltd|limited)\b/i.test(trimmed) && !/pvt/i.test(trimmed)) {
      score += 0.2; // LTD (but not Pvt LTD)
    }
    if (/\bllp\b/i.test(trimmed)) {
      score += 0.25; // LLP
    }
    if (/\bco\.?\b/i.test(trimmed)) {
      score += 0.2; // Co.
    }
    if (/&?\s*sons\b|and\s+sons\b/i.test(trimmed)) {
      score += 0.2; // & Sons
    }
    if (/\benterprises\b/i.test(trimmed)) {
      score += 0.2; // Enterprises
    }
    if (/&|and/i.test(trimmed) && (/\b(co|company|sons)\b/i.test(trimmed))) {
      score += 0.1;
    }
  }

  // Bonus: Line structure indicators
  // Title case or ALL CAPS suggests company name
  if (/^[A-Z][A-Za-z0-9\s&.,\-]+$/.test(trimmed) && trimmed.length >= 6) {
    score += 0.2;
  }
  if (/^[A-Z][A-Z0-9\s&.,\-]{5,}$/.test(trimmed)) {
    score += 0.1;
  }

  // Penalties
  // Not a label line
  if (/^(name|address|email|phone|invoice|bill|date|number|gst|tax)/i.test(trimmed)) {
    score -= 0.5;
  }
  // Not primarily numbers
  if (/\d{4,}/.test(trimmed) && !/[A-Za-z]{3,}/.test(trimmed)) {
    score -= 0.3;
  }
  // Not too short or too long
  if (trimmed.length < 4) score -= 0.3;
  if (trimmed.length > 60) score -= 0.2;

  // Context bonuses (check surrounding lines)
  if (checkContext && contextLines.length > 0) {
    const contextText = contextLines.join(' ').toLowerCase();
    
    // Nearby address indicators
    if (/road|street|st\.|rd\.|avenue|ave|city|state|pin|zip|country/i.test(contextText)) {
      score += 0.15;
    }
    // Nearby contact info
    if (/phone|mobile|tel|email|@/i.test(contextText)) {
      score += 0.1;
    }
    // Nearby GST/Tax info
    if (/gst|tax\s+id|pan\s+no|registration/i.test(contextText)) {
      score += 0.15;
    }
    // Avoid "Bill To" / "Ship To" sections
    if (/bill\s+to|ship\s+to|customer|client/i.test(contextText)) {
      score -= 0.3;
    }
  }

  return { 
    score: Math.max(0, Math.min(1, score)), 
    matchedSuffix 
  };
}

/**
 * Extract vendor/dealer name using Indian suffix patterns
 * Enhanced version that specifically targets Indian business naming conventions
 */
function extractVendorNameWithIndianSuffixes(lines: string[]): string {
  const headerLines = lines.slice(0, Math.ceil(lines.length * 0.25));
  
  // Collect candidates with scores
  type Candidate = { line: string; score: number; index: number; suffix?: string };
  const candidates: Candidate[] = [];

  // Score each header line
  for (let i = 0; i < Math.min(headerLines.length, 15); i++) {
    const line = headerLines[i];
    const contextLines = [
      headerLines[Math.max(0, i - 1)],
      line,
      headerLines[Math.min(headerLines.length - 1, i + 1)]
    ].filter(Boolean);

    const result = scoreLineForIndianDealer(line, {
      checkContext: true,
      contextLines
    });

    if (result.score > 0.3) { // Only consider reasonable candidates
      candidates.push({
        line: line.trim(),
        score: result.score,
        index: i,
        suffix: result.matchedSuffix
      });
    }
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);

  // Return the best candidate if score is good enough
  if (candidates.length > 0 && candidates[0].score >= 0.5) {
    return candidates[0].line;
  }

  // Fallback: return top candidate even if score is lower (but >= 0.3)
  if (candidates.length > 0) {
    return candidates[0].line;
  }

  return '';
}

/**
 * Extract vendor name - layout adaptive
 * ENHANCED with Indian dealer suffix recognition
 */
function extractVendorName(lines: string[]): string {
  const headerLines = lines.slice(0, Math.ceil(lines.length * 0.2));

  // Strategy 0: Indian dealer suffix pattern matching (NEW - highest priority)
  const indianSuffixResult = extractVendorNameWithIndianSuffixes(lines);
  if (indianSuffixResult && indianSuffixResult.length >= 4) {
    return indianSuffixResult;
  }

  // Strategy 1: All-caps company name in header (common format)
  for (const line of headerLines.slice(0, 8)) {
    if (line.length < 4 || line.length > 60) continue;
    
    // All caps or title case, not a label
    if (
      /^[A-Z][A-Z0-9\s\-&]+$/.test(line) &&
      line.length >= 6 &&
      !/invoice|bill|date|number|address|phone|email/i.test(line) &&
      !/^(name|address|email|phone|invoice|bill)/i.test(line)
    ) {
      // Double-check: does it contain Indian dealer suffix?
      if (INDIAN_DEALER_SUFFIX_PATTERN.test(line)) {
        return line.trim();
      }
      // Otherwise proceed with original logic
      return line.trim();
    }
  }

  // Strategy 2: Find vendor/business keywords
  const vendorKeywords = ['vendor', 'business', 'company', 'merchant', 'supplier', 'from'];
  const fullText = lines.join('\n');
  
  for (const keyword of vendorKeywords) {
    const extracted = findFieldByKeywords(fullText, [keyword], {extractAfter: true});
    if (extracted && extracted.length > 3) {
      // Check if extracted value contains Indian suffix
      if (INDIAN_DEALER_SUFFIX_PATTERN.test(extracted)) {
        return extracted;
      }
      return extracted;
    }
  }

  // Strategy 3: First substantial line with Indian suffix check (fallback)
  for (const line of lines.slice(0, 10)) {
    if (
      line.length >= 6 &&
      line.length <= 60 &&
      !/^(name|address|email|phone|invoice|bill|date|number)/i.test(line) &&
      !/\d{4,}/.test(line) // Not a long number
    ) {
      // Prioritize lines with Indian dealer suffixes
      if (INDIAN_DEALER_SUFFIX_PATTERN.test(line)) {
        return line.trim();
      }
    }
  }

  // Strategy 4: Final fallback - any line with Indian suffix in first 20 lines
  for (const line of lines.slice(0, 20)) {
    if (INDIAN_DEALER_SUFFIX_PATTERN.test(line) && 
        line.length >= 4 && 
        line.length <= 80 &&
        !/^(invoice|bill|date|number)/i.test(line)) {
      return line.trim();
    }
  }

  return '';
}

/**
 * Extract amount - handles multiple currency and format variations
 */
function extractAmount(
  text: string,
  keywords: string[],
): string {
  // Try keyword-based extraction first
  const amount = findFieldByKeywords(text, keywords, {
    extractAfter: true,
    maxDistance: 2,
    valuePattern: /(?:₹|\$|€|£)?\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)/,
  });

  if (amount) {
    return amount.replace(/[₹$€£,\s]/g, '').replace(/[^\d.]/g, '');
  }

  // Fallback: search context for numbers
  const lowerText = text.toLowerCase();
  for (const keyword of keywords) {
    const idx = lowerText.indexOf(keyword.toLowerCase());
    if (idx === -1) continue;

    const context = text.substring(
      Math.max(0, idx - 50),
      Math.min(text.length, idx + 100),
    );
    
    const amountMatch = context.match(/(?:₹|\$)?\s*([0-9]{1,3}(?:[,\.][0-9]{3})*(?:\.[0-9]{2})?)/);
    if (amountMatch) {
      return amountMatch[1].replace(/[,]/g, '');
    }
  }

  return '';
}

function extractAmountInWords(text: string, lines: string[]): string {
  // Look for explicit "Amount in Words" line
  const directMatch = text.match(/amount\s+in\s+words\s*[:\-]?\s*([^\n]+)/i);
  if (directMatch && directMatch[1]) {
    return cleanAmountWords(directMatch[1]);
  }

  // Search for lines containing key phrases like "Rupees" and "Only"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (lower.includes('amount in words')) {
      const nextLine = lines[i + 1] || '';
      if (nextLine) {
        return cleanAmountWords(nextLine);
      }
    }
    if ((lower.includes('rupees') || lower.includes('rupess') || lower.includes('rupee')) && lower.includes('only')) {
      return cleanAmountWords(line);
    }
  }

  return '';
}

function cleanAmountWords(line: string): string {
  return line.replace(/[#*]/g, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Main intelligent parser - handles different invoice formats
 */
export function smartParseInvoiceFields(text: string): Partial<InvoiceFields> {
  const cleaned = text.replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ');
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Invoice Number - try label extraction first (with all user-provided keywords)
  let invoiceNumber = extractValueByLabel(lines, [
    'invoice / unique ref. no',
    'invoice / unique ref no',
    'invoice/unique ref no',
    'invoice no',
    'invoice number',
    'invoice#',
    'invoice #',
    'inv no',
    'bill no',
    'tax invoice no',
    'inv:',
    'bill:',
    'invoice:',
    'invoice reference',
    'reference no',
    'ref no',
  ], {
    // Disallow spaces to prevent capturing following labels like "Invoice Date"
    valuePattern: /([A-Z0-9][A-Z0-9\-\/\.]{1,24})/i,
    sanitize: value => value.replace(/^(#:|#)/, '').trim(),
  });
  if (!invoiceNumber) {
    invoiceNumber = extractInvoiceNumber(cleaned);
  }

  // Invoice Date - use label extraction then fallback (ENHANCED with Indian keywords)
  let invoiceDate = '';
  const invoiceDateCandidate = extractValueByLabel(lines, [
    'invoice date',
    'invoice dt',
    'inv date',
    'date of invoice',
    'tax invoice date',
    'invoice dated',
    'dated',
    'bill date',
    'dt',
    'dt:',
    'date:',
  ], {
    lookahead: 2, // Increased lookahead for better date detection
  });
  if (invoiceDateCandidate) {
    const normalized = extractDateFromCandidate(invoiceDateCandidate);
    if (normalized) {
      invoiceDate = normalized;
    }
  }
  if (!invoiceDate) {
    invoiceDate = extractDate(cleaned, [
      'invoice date', 'invoice date:', 'inv date', 'date of invoice',
      'tax invoice date', 'invoice dated', 'dated', 'bill date',
      'issued date', 'dt', 'dt:',
    ]);
  }

  // Vendor Name - layout adaptive
  const vendorName = extractVendorName(lines);

  // Total Amount - multiple format support
  const amount = extractAmount(cleaned, [
    'amount', 'total amount', 'amt', 'grand total',
    'final amount', 'total', 'sum',
  ]);

  // Taxable Amount
  const taxableAmount = extractAmount(cleaned, [
    'taxable amount', 'taxable', 'subtotal',
  ]);

  // Tax Amount / GST Amount
  const taxAmount = extractAmount(cleaned, [
    'tax amount', 'total tax', 'tax payable', 'gst amount',
    'igst amount', 'sgst amount', 'cgst amount', 'vat amount',
  ]);

  // Final Amount
  const finalAmount = extractAmount(cleaned, [
    'final amount', 'final total', 'total', 'grand total',
  ]);

  const totalAmount = finalAmount || amount;

  // Paid Amount
  const paidAmount = extractAmount(cleaned, [
    'paid amount', 'paid', 'amount paid',
  ]);

  // Due Amount
  const dueAmount = extractAmount(cleaned, [
    'due amount', 'due', 'amount due', 'balance',
  ]);

  // Member/Customer Details
  const memberName = findFieldByKeywords(cleaned, [
    'name:', 'customer name', 'member name', 'client name',
    'bill to', 'ship to',
  ]);

  const memberId = findFieldByKeywords(cleaned, [
    'member id', 'member id:', 'customer id', 'client id', 'id:',
  ]);

  const phone = findFieldByKeywords(cleaned, [
    'phone', 'phone:', 'mobile', 'contact', 'tel', 'telephone',
  ]).replace(/[^\d+]/g, '');

  const email = (cleaned.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/) || [''])[0];

  // Program and Dates
  const program = findFieldByKeywords(cleaned, [
    'program', 'program:', 'plan', 'package', 'subscription',
  ]);

  const startDate = extractDate(cleaned, [
    'start date', 'start date:', 'from', 'begin', 'valid from',
  ]);

  const expiryDate = extractDate(cleaned, [
    'expiry date', 'expiry date:', 'expires', 'end date',
    'valid until', 'valid till',
  ]);

  // Invoice Due Date
  let invoiceDueDate = '';
  const invoiceDueCandidate = extractValueByLabel(lines, [
    'invoice due date',
    'due date',
    'payment due date',
    'due on',
    'payable by',
  ], {
    lookahead: 1,
  });
  if (invoiceDueCandidate) {
    const normalizedDue = extractDateFromCandidate(invoiceDueCandidate);
    if (normalizedDue) invoiceDueDate = normalizedDue;
  }
  if (!invoiceDueDate) {
    invoiceDueDate = extractDate(cleaned, [
      'invoice due date', 'due date', 'payment due date',
      'due on', 'payable by', 'payment date',
    ]);
  }

  // Associated PO
  const associatedPO = extractValueByLabel(lines, [
    'associated po',
    'po number',
    'purchase order',
    'po no',
    'p.o.',
  ], {
    valuePattern: /([A-Z0-9\-\/]{2,25})/i,
  }) || findFieldByKeywords(cleaned, [
    'associated po', 'po number', 'purchase order',
    'po:', 'p.o.', 'p.o. number',
  ]);

  // Early Payment Discount
  const earlyPaymentDiscount = findFieldByKeywords(cleaned, [
    'early payment discount', 'discount', 'payment discount',
    'early discount', 'cash discount',
  ]).replace(/[^\d.]/g, '');

  // Currency
  const currency = findFieldByKeywords(cleaned, [
    'currency', 'curr', 'currency:',
  ]).toUpperCase() || 'INR'; // Default to INR if not found

  // Remark/Notes
  const remark = findFieldByKeywords(cleaned, [
    'remark', 'remarks', 'notes', 'note',
    'description', 'comments', 'comment',
  ]);

  // Extract Line Items
  const items = extractLineItems(cleaned, lines);

  // Amount in words
  const amountInWords = extractAmountInWords(cleaned, lines);

  // Dealer Information (if available in invoice) - Enhanced extraction with Indian suffixes
  let dealer = extractValueByLabel(lines, [
    'dealer / distributor',
    'dealer name',
    'dealer',
    'seller',
    'vendor',
    'supplier',
    'from',
  ], {
    lookahead: 2,
  });

  // Enhanced: Check extracted dealer name for Indian suffix patterns
  if (dealer && dealer.length >= 3) {
    // Validate it looks like a company name with Indian suffix
    if (!INDIAN_DEALER_SUFFIX_PATTERN.test(dealer)) {
      // If dealer name doesn't have suffix, try to find a better match nearby
      const dealerLineIdx = lines.findIndex(l => 
        l.toLowerCase().includes(dealer.toLowerCase().substring(0, Math.min(10, dealer.length)))
      );
      if (dealerLineIdx >= 0) {
        // Check surrounding lines for better match
        for (let offset = -1; offset <= 2; offset++) {
          const candidateLine = lines[dealerLineIdx + offset];
          if (candidateLine && INDIAN_DEALER_SUFFIX_PATTERN.test(candidateLine)) {
            const candidateScore = scoreLineForIndianDealer(candidateLine);
            if (candidateScore.score >= 0.4) {
              dealer = candidateLine.trim();
              break;
            }
          }
        }
      }
    }
  }

  // If not found, try vendor name (common alias) which already has Indian suffix enhancement
  if (!dealer || dealer.length < 3) {
    dealer = vendorName || '';
  }

  // Final fallback: Use Indian suffix pattern matching on header lines
  if (!dealer || dealer.length < 3) {
    const indianSuffixMatch = extractVendorNameWithIndianSuffixes(lines);
    if (indianSuffixMatch) {
      dealer = indianSuffixMatch;
    }
  }

  // Dealer Code - Enhanced extraction with multiple strategies
  let dealerCode = extractValueByLabel(lines, [
    'dealer code',
    'dealer id',
    'vendor code',
    'supplier code',
    'dealer#',
  ], {
    valuePattern: /([A-Z0-9\-]{2,20})/i,
  });

  // Strategy 2: Look for "Dealer Code:" specifically
  if (!dealerCode || dealerCode.length < 2) {
    const dealerCodePatterns = [
      /\bDealer\s+Code\s*[:]\s*([A-Z0-9\-]+)/i,
      /\bDealer\s+Code\s*[:]\s*([A-Za-z0-9\-]+)/i,
      /\bCode\s*[:]\s*([A-Z0-9\-]{3,15})/i,
      /\bDealer\s+ID\s*[:]\s*([A-Z0-9\-]+)/i,
    ];

    for (const pattern of dealerCodePatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (candidate.length >= 2 && candidate.length <= 20) {
          dealerCode = candidate;
          break;
        }
      }
    }
  }

  // Strategy 3: Look on lines containing "Dealer Code"
  if (!dealerCode || dealerCode.length < 2) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('dealer') && (lowerLine.includes('code') || lowerLine.includes('id'))) {
        // Extract alphanumeric code from the line
        const codeMatch = line.match(/[:]\s*([A-Z0-9\-]{2,20})/i);
        if (codeMatch && codeMatch[1]) {
          dealerCode = codeMatch[1].trim();
          break;
        }
      }
    }
  }

  const odAccountNumber = findFieldByKeywords(cleaned, [
    'od account', 'od account number', 'account number',
    'account no', 'a/c no',
  ]);

  // GST Number
  const gstMatch = cleaned.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z]\d\b/i);
  const gstNumber = (gstMatch && gstMatch[0]) ? gstMatch[0].toUpperCase() : '';

  return {
    // Dealer Information
    dealer: dealer || '',
    dealerCode: dealerCode || '',
    odAccountNumber: odAccountNumber || '',
    // Invoice Details
    invoiceNumber: invoiceNumber || '',
    associatedPO: associatedPO || '',
    invoiceDate: invoiceDate || '',
    invoiceDueDate: invoiceDueDate || '',
    // Additional Invoice Information
    earlyPaymentDiscount: earlyPaymentDiscount || '',
    currency: currency || 'INR',
    remark: remark || '',
    // Line Items
    items: items || [],
    // Legacy fields (for backward compatibility)
    vendorName: vendorName || '',
    memberName: memberName || '',
    memberId: memberId || '',
    phone: phone || '',
    email: email || '',
    program: program || '',
    startDate: startDate || '',
    expiryDate: expiryDate || '',
    amount: amount || '',
    taxableAmount: taxableAmount || '',
    finalAmount: finalAmount || '',
    totalAmount: totalAmount || '',
    taxAmount: taxAmount || '',
    amountInWords: amountInWords || '',
    paidAmount: paidAmount || '',
    dueAmount: dueAmount || '',
    gstNumber: gstNumber || '',
  };
}

/**
 * Extract line items from invoice text
 * Looks for table-like structures with item details
 */
function extractLineItems(text: string, lines: string[]): Array<{
  itemName: string;
  quantity: string;
  unit: string;
  pricePerQuantity: string;
  total: string;
}> {
  const items: Array<{
    itemName: string;
    quantity: string;
    unit: string;
    pricePerQuantity: string;
    total: string;
  }> = [];

  // Look for table-like structures or item lists
  // Common patterns: Item Name | Quantity | Unit | Price | Total
  
  // Strategy 1: Look for rows after "Item" or "Description" headers
  const itemHeaders = ['item', 'description', 'product', 'service', 'part'];
  let inItemsSection = false;
  let headerLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check if this line contains item headers
    if (itemHeaders.some(header => line.includes(header) && (line.includes('quantity') || line.includes('price') || line.includes('amount')))) {
      inItemsSection = true;
      headerLineIndex = i;
      continue;
    }

    if (inItemsSection && i > headerLineIndex) {
      // Try to parse line as item row
      // Look for multiple numbers (quantity, price, total)
      const numbers = line.match(/\b\d+(?:\.\d+)?\b/g);
      const words = line.match(/\b[A-Za-z]{2,}\b/g);

      if (numbers && numbers.length >= 2) {
        // Likely an item row
        const item: {
          itemName: string;
          quantity: string;
          unit: string;
          pricePerQuantity: string;
          total: string;
        } = {
          itemName: words ? words.slice(0, Math.min(3, words.length)).join(' ') : '',
          quantity: numbers[0] || '',
          unit: '',
          pricePerQuantity: numbers[1] || '',
          total: numbers[numbers.length - 1] || '',
        };

        // Calculate total if not provided
        if (!item.total && item.quantity && item.pricePerQuantity) {
          const qty = parseFloat(item.quantity);
          const price = parseFloat(item.pricePerQuantity);
          if (!isNaN(qty) && !isNaN(price)) {
            item.total = (qty * price).toFixed(2);
          }
        }

        if (item.itemName || item.quantity) {
          items.push(item);
        }
      }

      // Stop if we hit a total/grand total line
      if (line.includes('total') && (line.includes('grand') || line.includes('final'))) {
        break;
      }
    }
  }

  // Strategy 2: Look for numbered items (1., 2., etc.)
  if (items.length === 0) {
    const numberedItemPattern = /^\d+[\.\)]\s*(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i;
    for (const line of lines) {
      const match = line.match(numberedItemPattern);
      if (match) {
        items.push({
          itemName: match[1].trim(),
          quantity: match[2] || '',
          unit: '',
          pricePerQuantity: match[3] || '',
          total: '',
        });
      }
    }
  }

  return items;
}
