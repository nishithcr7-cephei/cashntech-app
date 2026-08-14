/** Surface backend validation messages (string or string[]) in toasts. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as {response?: {data?: {message?: unknown}}})
    ?.response?.data?.message;
  if (Array.isArray(responseMessage)) {
    return responseMessage.filter(Boolean).join('\n');
  }
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }
  const errMsg = (error as {message?: string})?.message;
  return errMsg?.trim() ? errMsg : fallback;
}
