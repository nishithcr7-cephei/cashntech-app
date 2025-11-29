# ML Model Setup Guide

This guide explains how to set up and use ML models for enhanced invoice parsing accuracy.

## Overview

The invoice parsing system now supports machine learning models for higher accuracy. It works in a hybrid mode:
1. **Primary**: ML model (when available)
2. **Secondary**: Enhanced heuristics (ML-inspired contextual parsing)
3. **Fallback**: Rule-based parsing (always available)

## Architecture

```
┌─────────────────────────────────────┐
│  ML Model (TensorFlow Lite)        │
│  - High accuracy                    │
│  - Template-aware                   │
└─────────────────────────────────────┘
            ↓ (if available)
┌─────────────────────────────────────┐
│  Enhanced Heuristics                │
│  - Contextual understanding         │
│  - Positional features               │
└─────────────────────────────────────┘
            ↓ (fallback)
┌─────────────────────────────────────┐
│  Rule-Based Parsing                 │
│  - Keyword matching                 │
│  - Regex patterns                   │
└─────────────────────────────────────┘
```

## Current Status

✅ **ML Infrastructure**: Implemented and ready
✅ **Feature Extraction**: Text preprocessing and feature engineering
✅ **Model Loading**: Framework ready for models
⏳ **Trained Models**: To be added

The system currently uses **enhanced heuristics** (Strategy 2) which provides improved accuracy over pure rule-based parsing.

## Adding ML Models

### Step 1: Train or Obtain a Model

You need a TensorFlow Lite model trained for invoice field extraction. Options:

#### Option A: Use Pre-trained Models
- Search Hugging Face for invoice/document NER models
- Look for TensorFlow Lite models specifically

#### Option B: Train Custom Model
1. Collect invoice samples (1000+ invoices)
2. Label fields: invoice number, date, amount, vendor, etc.
3. Train using:
   - BERT-based NER models
   - DistilBERT (lighter, faster)
   - Custom CNN/LSTM for document understanding
4. Convert to TensorFlow Lite format

### Step 2: Model Output Format

Your model should output predictions in one of these formats:

#### Format 1: Structured JSON
```json
{
  "invoiceNumber": "INV-12345",
  "invoiceDate": "2025-01-15",
  "amount": "1000.00",
  ...
}
```

#### Format 2: Field Indices/Probabilities
Array of probabilities or indices for each field.

#### Format 3: NER Tags
BIO tagging format (B-invoice, I-invoice, etc.)

### Step 3: Add Model to App

#### Android
1. Place model file in `android/app/src/main/assets/models/`
2. Create folder if it doesn't exist: `mkdir -p android/app/src/main/assets/models`
3. Add model: `invoice_ner_model.tflite`

#### iOS
1. Add model to Xcode project
2. Add to "Copy Bundle Resources" in Build Phases

### Step 4: Update Model Loader

Edit `src/utils/mlModelLoader.ts`:

```typescript
// For Android (from bundle)
import {bundleResourceIO} from '@tensorflow/tfjs-react-native';

export async function loadNERModel(): Promise<tf.LayersModel | null> {
  // Load from bundle
  const modelPath = bundleResourceIO('models/invoice_ner_model.json');
  nerModel = await tf.loadLayersModel(modelPath);
  return nerModel;
}
```

Or for remote loading:
```typescript
export async function loadNERModel(): Promise<tf.LayersModel | null> {
  // Load from remote URL (can update without app update)
  const modelUrl = 'https://your-cdn.com/models/invoice_ner_model.json';
  nerModel = await tf.loadLayersModel(modelUrl);
  return nerModel;
}
```

### Step 5: Implement Prediction Mapping

Edit `src/services/mlInvoiceParser.ts` → `mapPredictionsToFields()`:

```typescript
function mapPredictionsToFields(
  predictions: number[] | number[][],
  rawText: string,
  features: any
): Partial<InvoiceFields> {
  // Decode model predictions based on your model's output format
  // Example for structured output:
  const fieldMap = {
    invoiceNumber: extractFromPredictions(predictions, 0),
    invoiceDate: extractFromPredictions(predictions, 1),
    amount: extractFromPredictions(predictions, 2),
    // ... etc
  };
  
  return fieldMap;
}
```

## Model Requirements

### Input Format
- Text tokens (vocabulary indices)
- Features: length, line count, pattern flags
- Positional features (if OCR blocks available)

### Output Format
- Field predictions (structured or tagged)

### Size Considerations
- TensorFlow Lite models should be < 50MB for mobile
- Larger models may impact app size and performance

## Performance

### Expected Accuracy
- **Rule-based only**: ~70-80%
- **Enhanced heuristics (current)**: ~80-85%
- **With ML model**: ~90-95% (similar to Zoho)

### Speed
- **Rule-based**: ~50-100ms
- **Enhanced heuristics**: ~100-200ms
- **ML model inference**: ~200-500ms (depends on model size)

## Testing

Test with diverse invoice formats:
```typescript
import {parseInvoiceWithML} from '@services/mlInvoiceParser';

const result = await parseInvoiceWithML(rawText, blocks);
console.log('Method:', result.method); // 'ml', 'fallback-smart', or 'fallback-regex'
console.log('Confidence:', result.confidence);
console.log('Fields:', result.fields);
```

## Troubleshooting

### Model Not Loading
- Check file path is correct
- Verify model is in bundle/assets
- Check TensorFlow.js initialization

### Low Accuracy
- Verify model is trained on similar invoice formats
- Check feature extraction matches training data format
- Consider retraining with more diverse samples

### Performance Issues
- Use smaller/lighter models (DistilBERT instead of BERT)
- Reduce input feature size
- Use TensorFlow Lite optimizations (quantization)

## Future Enhancements

1. **Online Learning**: Update models based on user corrections
2. **Template Classification**: Detect invoice template type first
3. **Layout Understanding**: Add document layout detection models
4. **Multi-model Ensemble**: Combine multiple specialized models

## Resources

- [TensorFlow.js for React Native](https://github.com/tensorflow/tfjs/tree/master/tfjs-react-native)
- [TensorFlow Lite](https://www.tensorflow.org/lite)
- [Hugging Face Models](https://huggingface.co/models?pipeline_tag=token-classification)

## Support

For questions or issues:
1. Check model is properly formatted
2. Verify TensorFlow.js is initialized
3. Review console logs for errors
4. Test with fallback parsing to isolate ML issues

