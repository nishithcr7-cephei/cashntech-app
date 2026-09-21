import {Keyboard} from 'react-native';

/** True when soft keyboard is open (RN 0.73+). */
export function isKeyboardVisible(): boolean {
  return typeof Keyboard.isVisible === 'function' && Keyboard.isVisible();
}

/**
 * Android back / keyboard-down often fires Modal `onRequestClose`.
 * First press: dismiss keyboard only. Second press: run close.
 */
export function dismissKeyboardOrClose(onClose: () => void): void {
  if (isKeyboardVisible()) {
    Keyboard.dismiss();
    return;
  }
  onClose();
}
