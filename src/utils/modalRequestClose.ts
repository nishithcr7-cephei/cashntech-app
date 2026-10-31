import {Keyboard} from 'react-native';

/** True when soft keyboard is open (RN 0.73+). */
export function isKeyboardVisible(): boolean {
  return typeof Keyboard.isVisible === 'function' && Keyboard.isVisible();
}

/**
 * Android system Back / ↓ while the soft keyboard is open should only
 * dismiss the keyboard — not close the RN Modal. The IME ✓ / Done key
 * already blurs the field; Back is wired to Modal `onRequestClose`.
 * First press: dismiss keyboard. Second press: run close.
 */
export function dismissKeyboardOrClose(onClose: () => void): void {
  if (isKeyboardVisible()) {
    Keyboard.dismiss();
    return;
  }
  onClose();
}

export function createModalRequestCloseHandler(
  onClose: () => void,
): () => void {
  return () => dismissKeyboardOrClose(onClose);
}
