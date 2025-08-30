/**
 * Represents the result of a promise execution.
 *
 * It can be either a success result (data is not null and error is null) or a failure result (data is null and error is not null).
 *
 * @template T - The type of the data expected from the promise.
 * @template E - The type of the error, defaults to Error.
 */
export type Result<T, E = Error> =
  | /**
   * The result of a successful promise execution.
   *
   * Data is not null and error is null.
   */
  {
      data: T;
      error: null;
    }
  /**
   * The result of a failed promise execution.
   *
   * Data is null and error is not null.
   */
  | {
      data: null;
      error: E;
    };

/**
 * Executes a promise and returns a Result object.
 *
 * If the promise resolves successfully, the Result contains the data and a null error.
 * If the promise rejects, the Result contains null data and the error.
 *
 * @template T - The type of the data expected from the promise.
 * @template E - The type of the error, defaults to Error.
 * @param {Promise<T>} promise - The promise to be executed.
 * @returns {Promise<Result<T, E>>} A promise that resolves to a Result object containing either data or an error.
 */

export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return {data, error: null};
  } catch (error) {
    return {data: null, error: error as E};
  }
}
