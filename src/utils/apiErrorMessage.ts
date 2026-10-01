/** Shown once from the axios interceptor on HTTP 403 (permission guard). */
export const PERMISSION_DENIED_USER_MESSAGE =
  'Permission denied — contact your admin';

type ApiErrorLike = {
  permissionDeniedToastShown?: boolean;
  response?: {status?: number; data?: {message?: unknown}};
  message?: string;
  code?: string;
};

export function markPermissionDeniedToastShown(error: unknown): void {
  if (error && typeof error === 'object') {
    (error as ApiErrorLike).permissionDeniedToastShown = true;
  }
}

/** Skip a second toast when the interceptor already handled permission denial. */
export function shouldSuppressUserFacingApiError(error: unknown): boolean {
  const axiosError = error as ApiErrorLike;
  if (axiosError?.permissionDeniedToastShown) {
    return true;
  }
  return axiosError?.response?.status === 403;
}

/** Surface backend validation messages (string or string[]) in toasts / list errors. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as ApiErrorLike;

  const status = axiosError?.response?.status;
  if (status === 403) {
    return PERMISSION_DENIED_USER_MESSAGE;
  }
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
