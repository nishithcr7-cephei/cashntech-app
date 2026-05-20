import type {InvoiceFields} from '@type/Invoice';
import {smartParseInvoiceFields} from './smartInvoiceParser';
import {parseInvoiceFields} from './invoiceParser';
import {parseInvoiceWithML} from '../services/mlInvoiceParser';
import type {OCRBlock} from '../utils/mlFeatureExtractor';

interface ParseResult {
  fields: Partial<InvoiceFields>;
  confidence: number;
  method: 'ml' | 'smart' | 'regex' | 'fallback-smart' | 'fallback-regex';
}

/**
 * Enhanced Multi-strategy Intelligent Parser
 * Now includes ML-based parsing as primary strategy
 * Combines ML model, enhanced heuristics, and rule-based parsing
 */
export async function intelligentParseInvoice(
  rawText: string,
  blocks: OCRBlock[] = [],
): Promise<Partial<InvoiceFields>> {
  // Strategy 1: ML-based parsing (highest accuracy when model available)
  try {
    const mlResult = await parseInvoiceWithML(rawText, blocks);
    
    // If ML parsing produced good results, use them
    if (mlResult.confidence > 50 && Object.keys(mlResult.fields).length > 5) {
      // Merge ML results with rule-based fallback for missing fields
      return mergeMLWithRuleBased(mlResult.fields, rawText);
    }
  } catch (error) {
    console.warn('ML parsing failed, falling back to rule-based:', error);
  }

  // Strategy 2: Smart parser (keyword-based, contextual)
  const smartResult = smartParseInvoiceFields(rawText);
  
  // Strategy 3: Regex parser (pattern-based, existing)
  const regexResult = parseInvoiceFields(rawText);

  // Calculate confidence scores
  const smartScore = calculateConfidence(smartResult);
  const regexScore = calculateConfidence(regexResult);

  // Merge results: prefer higher confidence, fill gaps from other
  const merged: Partial<InvoiceFields> = {};

  const fields: (keyof InvoiceFields)[] = [
    // Dealer Information
    'dealer',
    'dealerCode',
    'odAccountNumber',
    // Invoice Details
    'invoiceNumber',
    'associatedPO',
    'tenor',
    'invoiceDate',
    'invoiceDueDate',
    // Additional Invoice Information
    'earlyPaymentDiscount',
    'currency',
    'remark',
    // Legacy fields (for backward compatibility)
    'vendorName',
    'memberName',
    'memberId',
    'phone',
    'email',
    'program',
    'startDate',
    'expiryDate',
    'amount',
    'taxableAmount',
    'finalAmount',
    'totalAmount',
    'taxAmount',
    'paidAmount',
    'dueAmount',
    'gstNumber',
    'amountInWords',
  ];

  // Handle items array separately (merge arrays)
  const smartItems = smartResult.items || [];
  const regexItems = regexResult.items || [];
  const mergedItems = smartItems.length > 0 ? smartItems : regexItems;

  for (const field of fields) {
    const smartVal = smartResult[field];
    const regexVal = regexResult[field];

    // Prefer non-empty value from higher confidence parser
    if (smartScore > regexScore) {
      merged[field] = smartVal || regexVal || '';
    } else {
      merged[field] = regexVal || smartVal || '';
    }
  }

  // Add items array
  merged.items = mergedItems;

  return merged;
}

/**
 * Sync version for backward compatibility
 * Uses only rule-based parsing (no ML)
 */
export function intelligentParseInvoiceSync(
  rawText: string,
): Partial<InvoiceFields> {
  // Strategy 1: Smart parser (keyword-based, contextual)
  const smartResult = smartParseInvoiceFields(rawText);
  
  // Strategy 2: Regex parser (pattern-based, existing)
  const regexResult = parseInvoiceFields(rawText);

  // Calculate confidence scores
  const smartScore = calculateConfidence(smartResult);
  const regexScore = calculateConfidence(regexResult);

  // Merge results: prefer higher confidence, fill gaps from other
  const merged: Partial<InvoiceFields> = {};

  const fields: (keyof InvoiceFields)[] = [
    // Dealer Information
    'dealer',
    'dealerCode',
    'odAccountNumber',
    // Invoice Details
    'invoiceNumber',
    'associatedPO',
    'tenor',
    'invoiceDate',
    'invoiceDueDate',
    // Additional Invoice Information
    'earlyPaymentDiscount',
    'currency',
    'remark',
    // Legacy fields (for backward compatibility)
    'vendorName',
    'memberName',
    'memberId',
    'phone',
    'email',
    'program',
    'startDate',
    'expiryDate',
    'amount',
    'taxableAmount',
    'finalAmount',
    'totalAmount',
    'taxAmount',
    'paidAmount',
    'dueAmount',
    'gstNumber',
    'amountInWords',
  ];

  // Handle items array separately (merge arrays)
  const smartItems = smartResult.items || [];
  const regexItems = regexResult.items || [];
  const mergedItems = smartItems.length > 0 ? smartItems : regexItems;

  for (const field of fields) {
    const smartVal = smartResult[field];
    const regexVal = regexResult[field];

    // Prefer non-empty value from higher confidence parser
    if (smartScore > regexScore) {
      merged[field] = smartVal || regexVal || '';
    } else {
      merged[field] = regexVal || smartVal || '';
    }
  }

  // Add items array
  merged.items = mergedItems;

  return merged;
}

/**
 * Merge ML results with rule-based parsing to fill gaps
 */
function mergeMLWithRuleBased(
  mlFields: Partial<InvoiceFields>,
  rawText: string,
): Partial<InvoiceFields> {
  // Get rule-based results for missing fields
  const smartResult = smartParseInvoiceFields(rawText);
  const regexResult = parseInvoiceFields(rawText);

  const merged = {...mlFields};

  // Fill in missing fields from rule-based parsers
  const allFields: (keyof InvoiceFields)[] = [
    'dealer', 'dealerCode', 'odAccountNumber',
    'invoiceNumber', 'associatedPO', 'tenor', 'invoiceDate', 'invoiceDueDate',
    'earlyPaymentDiscount', 'currency', 'remark',
    'vendorName', 'memberName', 'memberId', 'phone', 'email',
    'program', 'startDate', 'expiryDate',
    'amount', 'taxableAmount', 'finalAmount', 'totalAmount',
    'taxAmount', 'paidAmount', 'dueAmount', 'gstNumber', 'amountInWords',
  ];

  for (const field of allFields) {
    if (!merged[field] || merged[field] === '') {
      merged[field] = smartResult[field] || regexResult[field] || '';
    }
  }

  // Prefer ML items, but use rule-based if ML has none
  if (!merged.items || merged.items.length === 0) {
    merged.items = smartResult.items || regexResult.items || [];
  }

  return merged;
}

/**
 * Calculate confidence score for parsed fields
 */
function calculateConfidence(fields: Partial<InvoiceFields>): number {
  let score = 0;
  let total = 0;

  // Invoice number: high weight if found
  if (fields.invoiceNumber && fields.invoiceNumber.length > 3) {
    score += 20;
    total += 20;
  }

  // Vendor name: high weight if found
  if (fields.vendorName && fields.vendorName.length > 3) {
    score += 15;
    total += 15;
  }

  // Amounts: good indicator of parsing quality
  const amountFields = [
    'amount',
    'finalAmount',
    'totalAmount',
    'paidAmount',
    'dueAmount',
    'taxableAmount',
    'taxAmount',
  ];
  for (const field of amountFields) {
    const val = fields[field as keyof InvoiceFields] as string;
    if (val && !isNaN(parseFloat(val))) {
      score += 5;
    }
    total += 5;
  }

  // Dates: good indicator
  if (fields.invoiceDate || fields.startDate || fields.expiryDate) {
    score += 10;
  }
  total += 10;

  // Contact info
  if (fields.email && fields.email.includes('@')) {
    score += 5;
  }
  if (fields.phone && fields.phone.length >= 10) {
    score += 5;
  }
  total += 10;

  return total > 0 ? (score / total) * 100 : 0;
}
