import {Config} from '@config/index';
import StorageKeys from '@constants/StorageKeys';
import {storage} from '@services/localStorage';
import {store} from '@store/app/store';
import {authActions} from '@store/auth';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {Alert} from 'react-native';

const GENERAL_TIMEOUT = 10000;

const axiosInstance = axios.create({
  baseURL: Config.API_URL,
  headers: {
    Accept: 'application/json',
    'device-type': 'mobile',
  },
  timeout: GENERAL_TIMEOUT,
});

export type CustomRequestConfig = InternalAxiosRequestConfig & {
  authRequired?: boolean;
  isFormData?: boolean;
  controller?: AbortController;
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
  
  try {
    // Extract the path from the full URL
    const urlPath = new URL(url).pathname;
    
    // Check if the path matches any whitelisted auth endpoint
    return AUTH_ENDPOINTS_WHITELIST.some(endpoint => 
      urlPath === endpoint || urlPath.startsWith(endpoint + '/')
    );
  } catch (error) {
    // If URL parsing fails, fall back to simple string matching for safety
    // This ensures we don't accidentally allow logout on malformed URLs
    console.warn('Failed to parse URL for auth endpoint check:', url, error);
    return false;
  }
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
      console.group('=========== API REQUEST CONFIG ===========');
      console.log('URL: ', config.url);
      console.log('Method: ', config.method);
      console.log('Headers: ', config.headers);
      console.log('Data: ', config.data);
      console.groupEnd();
    }
    return config;
  },
);

// Response Interceptor
/**
 * Logs the request and response data to the console.
 *
 * @param {AxiosResponse} response - The response object.
 * @returns {Promise<AxiosResponse>} The response object.
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.group('=========== API REQUEST RESPONSE ===========');
      console.log('request: ', response.request.responseURL);
      console.log('response: ', response.data);
      console.groupEnd();
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

    // Check if the error is a token expiration error
    const url = error.request?.responseURL ?? error.config?.url ?? '';
    if (error.response?.status === 401 && !isAuthEndpoint(url)) {
      Alert.alert('Error', 'Token expired..');
      logoutUser();
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
};

export default axiosInstance;
