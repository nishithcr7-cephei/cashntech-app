/**
 * ML Model Loader and Manager
 * Handles loading and caching of TensorFlow Lite models for invoice parsing
 */

import * as tf from '@tensorflow/tfjs';

let nerModel: tf.LayersModel | null = null;
let isModelLoading = false;

/**
 * Initialize TensorFlow.js for React Native
 * Should be called once at app startup
 */
export async function initializeTensorFlow(): Promise<void> {
  try {
    // Import platform-specific backend
    const {Platform} = require('react-native');
    
    // Set backend based on platform
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      // For React Native, we'll use the default backend
      // TensorFlow.js will automatically select the appropriate backend
      await tf.ready();
      console.log('TensorFlow.js initialized successfully for', Platform.OS);
    } else {
      await tf.ready();
      console.log('TensorFlow.js initialized successfully');
    }
  } catch (error) {
    console.warn('TensorFlow.js initialization failed, will use fallback parsing:', error);
    // This is OK - enhanced heuristics will still work
  }
}

/**
 * Load NER (Named Entity Recognition) model for invoice field extraction
 * Models can be loaded from:
 * - App bundle (recommended for production)
 * - Remote URL (for dynamic updates)
 * - Local storage cache
 */
export async function loadNERModel(): Promise<tf.LayersModel | null> {
  if (nerModel) {
    return nerModel;
  }

  if (isModelLoading) {
    // Wait for ongoing load
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return nerModel;
  }

  try {
    isModelLoading = true;
    
    // TODO: Replace with actual model path
    // Option 1: Load from app bundle (after adding model files)
    // const modelPath = bundleResourceIO('invoice_ner_model.json');
    // nerModel = await tf.loadLayersModel(modelPath);
    
    // Option 2: Load from remote URL (for dynamic updates)
    // const modelUrl = 'https://your-cdn.com/models/invoice_ner_model.json';
    // nerModel = await tf.loadLayersModel(modelUrl);
    
    // For now, return null to use fallback parsing
    // Once you have a trained model, uncomment above and load it
    console.log('ML model not available, using fallback parsing');
    return null;
  } catch (error) {
    console.warn('Failed to load ML model, using fallback:', error);
    return null;
  } finally {
    isModelLoading = false;
  }
}

/**
 * Check if ML model is available and ready
 */
export function isModelAvailable(): boolean {
  return nerModel !== null;
}

/**
 * Clear model cache (useful for testing or updating models)
 */
export function clearModelCache(): void {
  if (nerModel) {
    nerModel.dispose();
    nerModel = null;
  }
}

