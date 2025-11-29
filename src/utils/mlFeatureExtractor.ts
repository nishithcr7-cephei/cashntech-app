/**
 * Feature Extraction for ML Models
 * Converts raw OCR text and blocks into features that ML models can understand
 */

export interface OCRBlock {
  text: string;
  boundingBox?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  confidence?: number;
}

export interface ExtractedFeatures {
  tokenizedText: number[];
  textLength: number;
  lineCount: number;
  wordCount: number;
  hasNumbers: boolean;
  hasDates: boolean;
  hasAmounts: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasGST: boolean;
  positionalFeatures: number[];
  keywordFeatures: number[];
}

/**
 * Simple vocabulary for text tokenization
 * In production, use proper tokenizers or trained vocabularies
 */
const VOCABULARY: Map<string, number> = new Map();
const UNKNOWN_TOKEN = 0;
const PAD_TOKEN = 1;
let vocabSize = 2;

// Initialize with common invoice keywords
const COMMON_KEYWORDS = [
  'invoice', 'number', 'date', 'amount', 'total', 'tax', 'gst',
  'dealer', 'vendor', 'customer', 'client', 'member', 'phone', 'email',
  'payment', 'due', 'balance', 'subtotal', 'discount', 'po', 'order',
  'item', 'quantity', 'price', 'unit', 'rupees', 'only', 'currency',
  'invoice date', 'due date', 'invoice no', 'bill', 'receipt'
];

// Build vocabulary
COMMON_KEYWORDS.forEach((word, idx) => {
  VOCABULARY.set(word.toLowerCase(), vocabSize++);
});

/**
 * Convert text to lowercase and normalize
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple tokenization - splits text into words
 * In production, use proper tokenizers (BERT tokenizer, etc.)
 */
function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized.split(/\s+/).filter(t => t.length > 0);
}

/**
 * Convert tokens to vocabulary indices
 */
function tokensToIndices(tokens: string[], maxLength: number = 512): number[] {
  const indices = tokens
    .slice(0, maxLength)
    .map(token => VOCABULARY.get(token) || UNKNOWN_TOKEN);
  
  // Pad or truncate to maxLength
  while (indices.length < maxLength) {
    indices.push(PAD_TOKEN);
  }
  
  return indices.slice(0, maxLength);
}

/**
 * Extract boolean features indicating presence of certain patterns
 */
function extractPatternFeatures(text: string): {
  hasNumbers: boolean;
  hasDates: boolean;
  hasAmounts: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasGST: boolean;
} {
  const lowerText = text.toLowerCase();
  
  return {
    hasNumbers: /\d/.test(text),
    hasDates: /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text) ||
              /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text),
    hasAmounts: /[₹$€£]\s*\d+/.test(text) || /\d+[,\d]*\.\d{2}/.test(text),
    hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text),
    hasPhone: /\b[\+]?\d[\d\s\-]{7,}\b/.test(text),
    hasGST: /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z]\d\b/i.test(text),
  };
}

/**
 * Extract keyword-based features (one-hot encoding of important keywords)
 */
function extractKeywordFeatures(text: string): number[] {
  const lowerText = normalizeText(text);
  return COMMON_KEYWORDS.map(keyword => 
    lowerText.includes(keyword.toLowerCase()) ? 1 : 0
  );
}

/**
 * Extract positional features from OCR blocks
 * Helps understand document layout (header, body, footer regions)
 */
function extractPositionalFeatures(
  blocks: OCRBlock[],
  totalHeight: number = 1000
): number[] {
  if (blocks.length === 0) {
    return [0, 0, 0]; // header, body, footer
  }

  const headerThreshold = 0.2; // Top 20%
  const footerThreshold = 0.8; // Bottom 20%

  let headerCount = 0;
  let bodyCount = 0;
  let footerCount = 0;

  blocks.forEach(block => {
    if (block.boundingBox) {
      const normalizedTop = block.boundingBox.top / totalHeight;
      
      if (normalizedTop < headerThreshold) {
        headerCount++;
      } else if (normalizedTop > footerThreshold) {
        footerCount++;
      } else {
        bodyCount++;
      }
    }
  });

  const total = blocks.length || 1;
  return [
    headerCount / total,
    bodyCount / total,
    footerCount / total,
  ];
}

/**
 * Main feature extraction function
 * Converts raw text and OCR blocks into ML-ready features
 */
export function extractFeatures(
  rawText: string,
  blocks: OCRBlock[] = []
): ExtractedFeatures {
  const tokens = tokenize(rawText);
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
  const words = tokens;

  const patternFeatures = extractPatternFeatures(rawText);
  const keywordFeatures = extractKeywordFeatures(rawText);
  const positionalFeatures = extractPositionalFeatures(blocks);

  return {
    tokenizedText: tokensToIndices(tokens, 512),
    textLength: rawText.length,
    lineCount: lines.length,
    wordCount: words.length,
    ...patternFeatures,
    positionalFeatures,
    keywordFeatures,
  };
}

/**
 * Convert features to TensorFlow tensor
 * Ready for model inference
 */
export function featuresToTensor(features: ExtractedFeatures): tf.Tensor {
  // Combine all features into a single vector
  const featureVector = [
    ...features.tokenizedText.slice(0, 128), // Truncate for efficiency
    features.textLength / 10000, // Normalize
    features.lineCount / 100,
    features.wordCount / 1000,
    features.hasNumbers ? 1 : 0,
    features.hasDates ? 1 : 0,
    features.hasAmounts ? 1 : 0,
    features.hasEmail ? 1 : 0,
    features.hasPhone ? 1 : 0,
    features.hasGST ? 1 : 0,
    ...features.positionalFeatures,
    ...features.keywordFeatures.slice(0, 30), // Limit keyword features
  ];

  // Return as 2D tensor [batch_size=1, features]
  return tf.tensor2d([featureVector], [1, featureVector.length]);
}

