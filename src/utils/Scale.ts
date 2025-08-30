import {Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

// Base design dimensions
const BASE_WIDTH = 414;
const BASE_HEIGHT = 736;

/**
 * Scale width proportionally to the screen size
 * @param {number} size - The value to scale
 * @returns {number} - Scaled value
 */
export const scaleWidth = (size: number = 0): number =>
  (width / BASE_WIDTH) * size;

/**
 * Scale height proportionally to the screen size
 * @param {number} size - The value to scale
 * @returns {number} - Scaled value
 */
export const scaleHeight = (size: number = 0): number =>
  (height / BASE_HEIGHT) * size;

/**
 * Normalize font size to be consistent across devices
 * @param {number} size - The font size
 * @param {number} factor - Adjustment factor (default is 0.5)
 * @returns {number} - Scaled font size
 */
export const scaleFont = (size = 0, factor = 0.5): number =>
  size + (scaleWidth(size) - size) * factor;
