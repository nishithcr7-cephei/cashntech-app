/**
 * TensorFlow.js Initialization for React Native
 * Call this at app startup to initialize ML capabilities
 */

import {initializeTensorFlow} from './mlModelLoader';
import {Platform} from 'react-native';

let isInitialized = false;

/**
 * Initialize ML capabilities (TensorFlow.js)
 * Should be called once at app startup, ideally in App.tsx or index.js
 */
export async function initializeML(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Initialize TensorFlow.js backend for React Native
    await initializeTensorFlow();
    isInitialized = true;
    console.log('ML capabilities initialized successfully');
  } catch (error) {
    console.warn(
      'ML initialization failed, will use rule-based parsing only:',
      error
    );
    // App can still work with rule-based parsing
    isInitialized = true;
  }
}

/**
 * Check if ML is initialized
 */
export function isMLInitialized(): boolean {
  return isInitialized;
}

