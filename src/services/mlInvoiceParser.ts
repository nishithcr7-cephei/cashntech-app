/**
 * ML-Based Invoice Parser
 * Uses machine learning models for high-accuracy field extraction
 * Falls back to rule-based parsing if ML model is unavailable
 */

import type {InvoiceFields} from '../types/Invoice';
import {loadNERModel, isModelAvailable} from '../utils/mlModelLoader';
import {
  extractFeatures,
  featuresToTensor,
  type OCRBlock,
} from '../utils/mlFeatureExtractor';
import * as tf from '@tensorflow/tfjs';
import {smartParseInvoiceFields} from '../utils/smartInvoiceParser';
import {parseInvoiceFields} from '../utils/invoiceParser';

// Re-export for convenience
export type {OCRBlock};

export interface MLParseResult {
  fields: Partial<InvoiceFields>;
  confidence: number;
  method: 'ml' | 'fallback-smart' | 'fallback-regex';
}

/**
 * Extract fields using ML model
 * This is the primary parsing method when ML model is available
 */
async function parseWithMLModel(
  rawText: string,
  blocks: OCRBlock[] = []
): Promise<Partial<InvoiceFields> | null> {
  const model = await loadNERModel();
  
  if (!model) {
    return null;
  }

  try {
    // Extract features from text
    const features = extractFeatures(rawText, blocks);
    
    // Convert to tensor
    const inputTensor = featuresToTensor(features);
    
    // Run model inference
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const predictionsArray = await predictions.array();
    
    // Clean up tensors to prevent memory leaks
    inputTensor.dispose();
    predictions.dispose();
    
    // Map predictions to fields
    // Note: This mapping depends on your model's output structure
    // Adjust based on how your model outputs field predictions
    const predictedFields = mapPredictionsToFields(
      predictionsArray[0],
      rawText,
      features
    );
    
    return predictedFields;
  } catch (error) {
    console.warn('ML model inference failed:', error);
    return null;
  }
}

/**
 * Map model predictions to InvoiceFields structure
 * This function depends on your model's output format
 * 
 * Example implementations:
 * - If model outputs entity tags (B-amount, I-amount, etc.), use NER decoding
 * - If model outputs field probabilities, threshold and extract
 * - If model outputs structured JSON, parse directly
 */
function mapPredictionsToFields(
  predictions: number[] | number[][],
  rawText: string,
  features: any
): Partial<InvoiceFields> {
  // TODO: Implement based on your actual model output format
  
  // For now, return empty - this is where you'd decode model predictions
  // Example structure if model outputs field indices:
  // const fieldIndices = {
  //   invoiceNumber: 0,
  //   invoiceDate: 1,
  //   amount: 2,
  //   // ... etc
  // };
  
  return {};
}

/**
 * Enhanced statistical/contextual parsing (ML-inspired)
 * Uses advanced pattern matching and context understanding
 * Works as a bridge between rule-based and full ML parsing
 */
function parseWithEnhancedHeuristics(
  rawText: string,
  blocks: OCRBlock[] = []
): Partial<InvoiceFields> {
  const features = extractFeatures(rawText, blocks);
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
  
  const fields: Partial<InvoiceFields> = {};
  
  // Use features to guide parsing
  // Look for fields in appropriate regions based on positional features
  const isHeaderRegion = (lineIndex: number) => 
    lineIndex < lines.length * 0.2;
  const isFooterRegion = (lineIndex: number) => 
    lineIndex > lines.length * 0.8;
  
  // Enhanced invoice number extraction using context
  if (features.hasNumbers) {
    // Look in header region first
    const headerText = lines.slice(0, Math.ceil(lines.length * 0.3)).join(' ');
    const invoiceMatch = headerText.match(
      /invoice\s*(?:no|number|#|:)?\s*[:]?\s*([A-Z0-9\/\-]{3,25})/i
    );
    if (invoiceMatch) {
      fields.invoiceNumber = invoiceMatch[1].trim();
    }
  }
  
  // Enhanced date extraction using positional context
  if (features.hasDates) {
    const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/;
    
    // Invoice date is usually in header
    const headerText = lines.slice(0, Math.ceil(lines.length * 0.3)).join(' ');
    const dateMatch = headerText.match(
      /invoice\s*date\s*[:]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    );
    if (dateMatch) {
      fields.invoiceDate = dateMatch[1];
    }
    
    // Due date is often in footer or middle
    const footerText = lines.slice(Math.floor(lines.length * 0.6)).join(' ');
    const dueDateMatch = footerText.match(
      /due\s*date\s*[:]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    );
    if (dueDateMatch) {
      fields.invoiceDueDate = dueDateMatch[1];
    }
  }
  
  // Enhanced amount extraction using keyword features
  if (features.hasAmounts) {
    // Amounts are typically in footer
    const footerText = lines.slice(Math.floor(lines.length * 0.7)).join(' ');
    
    // Look for "Total Amount" or "Grand Total"
    const totalMatch = footerText.match(
      /(?:total|grand\s+total|final\s+amount)\s*[:]?\s*[₹$€£]?\s*([\d,]+\.?\d*)/i
    );
    if (totalMatch) {
      fields.totalAmount = totalMatch[1].replace(/,/g, '');
      fields.amount = fields.totalAmount;
    }
    
    // Look for tax amount
    const taxMatch = footerText.match(
      /(?:tax|gst)\s*amount\s*[:]?\s*[₹$€£]?\s*([\d,]+\.?\d*)/i
    );
    if (taxMatch) {
      fields.taxAmount = taxMatch[1].replace(/,/g, '');
    }
  }
  
  // Extract vendor/dealer from header using positional features
  const headerLines = lines.slice(0, Math.ceil(lines.length * 0.25));
  for (const line of headerLines) {
    if (
      line.length >= 6 &&
      line.length <= 60 &&
      /^[A-Z][A-Z0-9\s\-&]+$/.test(line) &&
      !/invoice|bill|date|number/i.test(line)
    ) {
      fields.vendorName = line.trim();
      fields.dealer = line.trim();
      break;
    }
  }
  
  // Extract email and phone using pattern features
  if (features.hasEmail) {
    const emailMatch = rawText.match(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    );
    if (emailMatch) {
      fields.email = emailMatch[0];
    }
  }
  
  if (features.hasPhone) {
    const phoneMatch = rawText.match(
      /\b[\+]?\d[\d\s\-]{7,}\b/
    );
    if (phoneMatch) {
      fields.phone = phoneMatch[0].replace(/[^\d+]/g, '');
    }
  }
  
  // Extract GST number
  if (features.hasGST) {
    const gstMatch = rawText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z]\d\b/i);
    if (gstMatch) {
      fields.gstNumber = gstMatch[0].toUpperCase();
    }
  }
  
  return fields;
}

/**
 * Main ML-based invoice parser
 * Tries ML model first, falls back to enhanced heuristics, then rule-based
 */
export async function parseInvoiceWithML(
  rawText: string,
  blocks: OCRBlock[] = []
): Promise<MLParseResult> {
  // Strategy 1: Try ML model if available
  if (isModelAvailable()) {
    const mlResult = await parseWithMLModel(rawText, blocks);
    if (mlResult && Object.keys(mlResult).length > 0) {
      // Calculate confidence (simplified - in production, use model's confidence scores)
      const confidence = calculateMLConfidence(mlResult);
      return {
        fields: mlResult,
        confidence,
        method: 'ml',
      };
    }
  }
  
  // Strategy 2: Enhanced heuristics (ML-inspired)
  const enhancedResult = parseWithEnhancedHeuristics(rawText, blocks);
  if (enhancedResult && Object.keys(enhancedResult).length > 5) {
    const confidence = calculateConfidence(enhancedResult);
    return {
      fields: enhancedResult,
      confidence,
      method: 'fallback-smart',
    };
  }
  
  // Strategy 3: Fallback to existing rule-based parsers
  const smartResult = smartParseInvoiceFields(rawText);
  const regexResult = parseInvoiceFields(rawText);
  
  const smartConfidence = calculateConfidence(smartResult);
  const regexConfidence = calculateConfidence(regexResult);
  
  const bestResult = smartConfidence > regexConfidence ? smartResult : regexResult;
  
  return {
    fields: bestResult,
    confidence: Math.max(smartConfidence, regexConfidence),
    method: smartConfidence > regexConfidence ? 'fallback-smart' : 'fallback-regex',
  };
}

/**
 * Calculate confidence score for parsed fields
 */
function calculateConfidence(fields: Partial<InvoiceFields>): number {
  let score = 0;
  let total = 0;
  
  // Invoice number: high weight
  if (fields.invoiceNumber && fields.invoiceNumber.length > 3) {
    score += 20;
    total += 20;
  }
  
  // Vendor/dealer: high weight
  if ((fields.vendorName && fields.vendorName.length > 3) ||
      (fields.dealer && fields.dealer.length > 3)) {
    score += 15;
    total += 15;
  }
  
  // Amounts: good indicator
  const amountFields = [
    'amount', 'finalAmount', 'totalAmount', 'paidAmount',
    'dueAmount', 'taxableAmount', 'taxAmount',
  ];
  for (const field of amountFields) {
    const val = fields[field as keyof InvoiceFields] as string;
    if (val && !isNaN(parseFloat(val))) {
      score += 5;
    }
    total += 5;
  }
  
  // Dates
  if (fields.invoiceDate || fields.invoiceDueDate) {
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

/**
 * Calculate confidence for ML model results
 * Uses model's internal confidence scores if available
 */
function calculateMLConfidence(fields: Partial<InvoiceFields>): number {
  // If ML model provides confidence, use that
  // For now, use same calculation as rule-based but with higher base confidence
  const baseConfidence = calculateConfidence(fields);
  return Math.min(95, baseConfidence + 10); // ML gets slight boost
}

