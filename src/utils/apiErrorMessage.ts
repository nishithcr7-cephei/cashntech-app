/** Surface backend validation messages (string or string[]) in toasts / list errors. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as {
    response?: {status?: number; data?: {message?: unknown}};
    message?: string;
    code?: string;
  };

  const status = axiosError?.response?.status;
  if (typeof status === 'number' && status >= 500) {
    return 'Something went wrong on our side. Please try again.';
  }

  const responseMessage = axiosError?.response?.data?.message;
  if (Array.isArray(responseMessage)) {
    return responseMessage.filter(Boolean).join('\n');
  }
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    // Nest/Express often returns this for 500s even when status is missing on the object
    if (/internal server error/i.test(responseMessage)) {
      return 'Something went wrong on our side. Please try again.';
    }
    return responseMessage;
  }

  const errMsg = axiosError?.message?.trim() ?? '';
  if (
    errMsg.includes('fetch') ||
    errMsg === 'Network Error' ||
    axiosError?.code === 'ECONNABORTED'
  ) {
    return 'Network error. Check connection.';
  }
  if (/status code 5\d\d/i.test(errMsg) || /internal server error/i.test(errMsg)) {
    return 'Something went wrong on our side. Please try again.';
  }
  return errMsg || fallback;
}
