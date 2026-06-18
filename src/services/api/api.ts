import {Config} from '@config/index';
import StorageKeys from '@constants/StorageKeys';
import {storage} from '@services/localStorage';
import {store} from '@store/app/store';
import {authActions} from '@store/auth';
import {userActions} from '@store/user';
import {clearProgramSelection} from '@store/programSelection/programSelection.slice';
import {clearPermissions} from '@store/permissions';
import {decodeJWT, isTokenExpired} from '@utils/Utils';
import {transformApiResponse} from '@utils/apiTransformer';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import Toast from 'react-native-toast-message';

const GENERAL_TIMEOUT = 10000;

console.log('🌐 [api.ts] Creating axios instance...');
console.log('🌐 [api.ts] Config.API_URL:', Config.API_URL);

const BASE_URL = (Config.API_URL || '').trim().replace(/\/+$/, '');
console.log('🌐 [api.ts] Using BASE_URL:', BASE_URL);
if (!BASE_URL) {
  console.warn(
    '⚠️ [api.ts] API_URL is missing. Please set API_URL in the active environment file.',
  );
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'device-type': 'mobile',
  },
  timeout: GENERAL_TIMEOUT,
});

console.log('🌐 [api.ts] Axios instance created with baseURL:', axiosInstance.defaults.baseURL);

export type CustomRequestConfig = InternalAxiosRequestConfig & {
  authRequired?: boolean;
  isFormData?: boolean;
  controller?: AbortController;
  /** Skip decrypt/transform on binary responses (e.g. Excel export). */
  skipResponseTransform?: boolean;
};

const cancelTokens: Array<AbortController> = [];

/**
 * Whitelist of authentication endpoints that should not trigger logout on 401 errors.
 * These endpoints handle authentication failures internally and should not cause
 * the user to be logged out.
 */
const AUTH_ENDPOINTS_WHITELIST = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh-token',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/logout',
];

/**
 * Checks if the given URL is an authentication endpoint that should be excluded
 * from triggering logout on 401 errors.
 * 
 * @param {string} url - The request URL to check
 * @returns {boolean} True if the URL is an auth endpoint, false otherwise
 */
const isAuthEndpoint = (url: string): boolean => {
  if (!url) return false;
  // Use simple string matching — new URL().pathname is not available in React Native
  return AUTH_ENDPOINTS_WHITELIST.some(endpoint =>
    url.includes(endpoint),
  );
};


/**
 * Request interceptor to add the access token to the authorization header
 * if the authRequired flag is set.
 *
 * @param {CustomRequestConfig} config - The request configuration.
 * @returns {Promise<CustomRequestConfig>} The modified request configuration.
 */
axiosInstance.interceptors.request.use(
  async (config: CustomRequestConfig): Promise<CustomRequestConfig> => {
    const controller = new AbortController();
    config.signal = controller.signal;
    config.controller = controller;
    cancelTokens.push(controller);

    if (config.authRequired) {
      const token = storage.getString(StorageKeys.TOKEN);
      if (token && config.headers) {
        // Check if token is expired before making the request
        if (isTokenExpired(token)) {
          const url = config.url || '';
          if (!isAuthEndpoint(url)) {
            Toast.show({
              type: 'error',
              text1: 'Session Expired',
              text2: 'Your session has expired. Please log in again.',
            });
            logoutUser();
            return Promise.reject(new Error('Token expired'));
          }
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.isFormData && config.headers) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    if (!config.isFormData && config.headers) {
      config.headers['Content-Type'] = 'application/json';
    }
    if (__DEV__) {
      const url = config.url || '';
      const skipLogging = 
        url.includes('user/permissions') || 
        url.includes('invoice/summary') || 
        url.includes('invoice/latest');

      if (!skipLogging) {
        console.group('=========== API REQUEST CONFIG ===========');
        console.log('URL: ', config.url);
        console.log('Method: ', config.method);
        console.log('Headers: ', config.headers);
        console.log('Data: ', config.data);
        console.groupEnd();
      }
    }
    return config;
  },
);

// Response Interceptor
/**
 * Logs the request and response data to the console and transforms the response
 * by decrypting any encrypted strings.
 *
 * @param {AxiosResponse} response - The response object.
 * @returns {AxiosResponse} The response object with transformed data.
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const skipTransform = (response.config as CustomRequestConfig)
      ?.skipResponseTransform;
    if (response.data && !skipTransform) {
      // Transform the response data recursively to decrypt any encrypted strings
      response.data = transformApiResponse(response.data);
    }

    if (__DEV__) {
      const url = response.config.url || '';
      const skipLogging = 
        url.includes('user/permissions') || 
        url.includes('invoice/summary') || 
        url.includes('invoice/latest');

      if (!skipLogging) {
        console.group('=========== API REQUEST RESPONSE ===========');
        console.log('request: ', response.request.responseURL);
        console.log('transformed response: ', response.data);
        console.groupEnd();
      }
    }
    return response;
  },
  /**
   * Logs the request and error data to the console.
   *
   * @param {AxiosError} error - The error object.
   * @returns {Promise<never>} The error object.
   */
  async (error: AxiosError): Promise<never> => {
    const skipTransform = (error.config as CustomRequestConfig)
      ?.skipResponseTransform;
    if (error.response?.data && !skipTransform) {
      error.response.data = transformApiResponse(error.response.data);
    }

    if (__DEV__) {
      console.group('=========== API REQUEST ERROR ===========');
      console.log(
        'Request URL: ',
        error.request?.responseURL || error.config?.url,
      );
      console.log('Request Method: ', error.config?.method);
      console.log('Request Headers: ', error.config?.headers);
      console.log('Request Data: ', error.config?.data);
      console.log('Response Data: ', error.response?.data);
      console.groupEnd();
    }

    // 401 from a response means the action was unauthorised (e.g. "Action not allowed").
    // The request interceptor already handles real token expiry before the request fires,
    // so we must NOT logout here — just surface the API error message to the user.
    if (error.response?.status === 401) {
      const data = error.response.data as any;
      const msg = data?.message || 'You are not authorised to perform this action.';
      Toast.show({
        type: 'error',
        text1: 'Action Not Allowed',
        text2: msg,
      });
    }
    return Promise.reject(error);
  },
);
/**
 * Cancels all ongoing API requests by aborting them and clears
 * the list of stored cancellation tokens.
 */

export const cancelAllRequests = () => {
  cancelTokens.forEach(controller => controller.abort());
  cancelTokens.length = 0;
};

/**
 * Logs out the user by clearing the access and refresh tokens from storage.
 */

export const logoutUser = () => {
  cancelAllRequests();
  storage.clearAll();
  store.dispatch(authActions.resetAuthState());
  store.dispatch(userActions.clearUserInfo());
  store.dispatch(clearProgramSelection());
  store.dispatch(clearPermissions());
};

export default axiosInstance;
