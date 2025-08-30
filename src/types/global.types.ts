/**
 * Generic interface for wrapping a payload with optional callbacks.
 *
 * @template T - Type of the payload.
 * @template CallbackArgs - Arguments for the general callback function.
 * @template SuccessArgs - Arguments for the success callback function.
 * @template ErrorArgs - Arguments for the error callback function.
 */
export interface PayloadWithCallback<
  T = null,
  SuccessArgs extends Array<unknown> = Array<unknown>,
  ErrorArgs extends Array<unknown> = Array<unknown>,
> {
  /** The main payload data. */
  payload: T;

  /** Optional error callback invoked with ErrorArgs. */
  callbackError?: (...args: ErrorArgs) => void;

  /** Optional success callback invoked with SuccessArgs. */
  callbackSuccess?: (...args: SuccessArgs) => void;
}
