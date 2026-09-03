import type {OcrResult} from '../types/Invoice';
import {intelligentParseInvoice} from '@utils/intelligentParser';
import type {OCRBlock} from '../utils/mlFeatureExtractor';
import {extractGSTInvoiceJSON, type GSTInvoiceJSON} from './gstInvoiceExtractor';
import { extractWithGemini, type GeminiExtractionOptions } from './geminiOcr';

/**
 * Enhanced ML-powered OCR: Uses ML Kit + ML-based parsing + Intelligent local parsing
 * No API costs, works entirely offline
 * Handles invoices from different companies with different formats
 * Now includes ML model support for higher accuracy
 */
export async function runOcrFromPath(filePath: string): Promise<OcrResult> {
  try {
    // Step 1: Extract text using ML Kit (free, on-device)
    const result = await TextRecognition.recognize(filePath);
    const rawText = result?.text ?? '';

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text detected in image');
    }

    // Step 2: Extract OCR blocks for positional features (if available)
    const blocks: OCRBlock[] = [];
    
    // ML Kit Text Recognition may provide block information
    // Extract blocks if available in result
    if (result?.blocks) {
      // @ts-ignore - ML Kit blocks structure may vary
      result.blocks.forEach((block: any) => {
        blocks.push({
          text: block.text || '',
          boundingBox: block.boundingBox,
          confidence: block.confidence,
        });
      });
    } else {
      // Fallback: create simple blocks from text lines
      const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
      lines.forEach((line, index) => {
        blocks.push({
          text: line,
          // Approximate positions (can be improved with actual OCR block data)
          boundingBox: {
            left: 0,
            top: index * 30,
            right: line.length * 10,
            bottom: (index + 1) * 30,
          },
        });
      });
    }

    // Step 3: ML-enhanced intelligent parsing
    // Tries ML model first, falls back to enhanced heuristics, then rule-based
    const fields = await intelligentParseInvoice(rawText, blocks);

    return {
      rawText,
      fields,
    };
  } catch (error: any) {
    console.error('OCR Error:', error);
    throw new Error(`OCR failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * MULTI-STAGE OCR & DATA EXTRACTION FOR GST INVOICES
 * 
 * Stage 1: OCR Text Recognition (ML Kit)
 * Stage 2: Text Block Analysis & Spatial Understanding
 * Stage 3: Pattern Recognition & Entity Extraction
 * Stage 4: Natural Language Understanding & Context Analysis
 * Stage 5: Data Validation & Structuring
 * 
 * Returns STRUCTURED JSON DATA matching exact GST Invoice schema
 */
export async function runGSTInvoiceExtraction(filePath: string): Promise<{rawText: string; gstInvoice: GSTInvoiceJSON}> {
  try {
    // Step 1: Extract text using ML Kit (free, on-device)
    const result = await TextRecognition.recognize(filePath);
    const rawText = result?.text ?? '';

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text detected in image');
    }

    // Step 2: Extract OCR blocks for positional features (if available)
    const blocks: OCRBlock[] = [];
    
    if (result?.blocks) {
      // @ts-ignore - ML Kit blocks structure may vary
      result.blocks.forEach((block: any) => {
        blocks.push({
          text: block.text || '',
          boundingBox: block.boundingBox,
          confidence: block.confidence,
        });
      });
    } else {
      // Fallback: create simple blocks from text lines
      const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
      lines.forEach((line, index) => {
        blocks.push({
          text: line,
          boundingBox: {
            left: 0,
            top: index * 30,
            right: line.length * 10,
            bottom: (index + 1) * 30,
          },
        });
      });
    }

    // Step 3-5: Multi-stage extraction pipeline
    const gstInvoice = extractGSTInvoiceJSON(rawText, blocks);

    return {
      rawText,
      gstInvoice,
    };
  } catch (error: any) {
    console.error('GST Invoice Extraction Error:', error);
    throw new Error(`GST Invoice extraction failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * GST Invoice Extraction using Gemini AI only
 * No fallback - only Gemini AI is used for invoice reading
 * 
 * @param filePath - Path to invoice image
 * @returns Extracted invoice data
 */
export async function runGSTInvoiceExtractionWithAI(
  filePath: string,
  options?: GeminiExtractionOptions,
): Promise<{rawText: string; gstInvoice: GSTInvoiceJSON}> {
  console.log('🔮 Using Gemini AI extraction...');
  const geminiResult = await extractWithGemini(filePath, options);
  console.log('✅ Gemini extraction successful!', geminiResult.confidence);
  
  return {
    rawText: geminiResult.rawText,
    gstInvoice: geminiResult.gstInvoice,
  };
}


