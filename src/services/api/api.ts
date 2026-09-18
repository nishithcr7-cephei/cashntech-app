import {Config} from '@config/index';
import StorageKeys from '@constants/StorageKeys';
import {storage} from '@services/localStorage';
import {store} from '@store/app/store';
import {authActions} from '@store/auth';
import {userActions} from '@store/user';
import {clearProgramSelection} from '@store/programSelection/programSelection.slice';
import {clearPermissions} from '@store/permissions';
import {clearProductContext} from '@store/product/product.slice';
import {isTokenExpired} from '@utils/Utils';
import {transformApiResponse} from '@utils/apiTransformer';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import Toast from 'react-native-toast-message';
import ApiEndPoints from '@constants/ApiEndPoints';

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

/** Bare client for refresh/logout — avoids interceptor recursion. */
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
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
  /** Internal: request already retried after a refresh. */
  _retryAfterRefresh?: boolean;
};

const cancelTokens: Array<AbortController> = [];

/**
 * Whitelist of authentication endpoints that should not trigger logout on 401 errors.
 */
const AUTH_ENDPOINTS_WHITELIST = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/auth/complete-consent',
  '/auth/verify-otp',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/logout',
];

const isAuthEndpoint = (url: string): boolean => {
  if (!url) {
    return false;
  }
  return AUTH_ENDPOINTS_WHITELIST.some(endpoint => url.includes(endpoint));
};

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = storage.getString(StorageKeys.REFRESH_TOKEN);
  if (!refreshToken) {
    return null;
  }
  try {
    const response = await refreshClient.post(ApiEndPoints.apiRefreshToken, {
      refreshToken,
    });
    const nextToken = response?.data?.data?.token;
    const nextRefresh = response?.data?.data?.refreshToken;
    if (!nextToken || typeof nextToken !== 'string') {
      return null;
    }
    storage.set(StorageKeys.TOKEN, nextToken);
    if (nextRefresh && typeof nextRefresh === 'string') {
      storage.set(StorageKeys.REFRESH_TOKEN, nextRefresh);
    }
    return nextToken;
  } catch {
    return null;
  }
}

function queueRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

axiosInstance.interceptors.request.use(
  async (config: CustomRequestConfig): Promise<CustomRequestConfig> => {
    const controller = new AbortController();
    config.signal = controller.signal;
    config.controller = controller;
    cancelTokens.push(controller);

    if (config.authRequired) {
      let token = storage.getString(StorageKeys.TOKEN);
      const url = config.url || '';

      if (token && isTokenExpired(token) && !isAuthEndpoint(url)) {
        const refreshed = await queueRefresh();
        if (refreshed) {
          token = refreshed;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Session Expired',
            text2: 'Your session has expired. Please log in again.',
          });
          logoutUser();
          return Promise.reject(new Error('Token expired'));
        }
      }

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

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const skipTransform = (response.config as CustomRequestConfig)
      ?.skipResponseTransform;
    if (response.data && !skipTransform) {
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

    const original = error.config as CustomRequestConfig | undefined;
    const status = error.response?.status;
    const url = original?.url || '';

    // Access token rejected — try one refresh + retry (non-auth endpoints).
    if (
      status === 401 &&
      original?.authRequired &&
      !original._retryAfterRefresh &&
      !isAuthEndpoint(url)
    ) {
      const refreshed = await queueRefresh();
      if (refreshed) {
        original._retryAfterRefresh = true;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshed}`;
        return axiosInstance.request(original) as Promise<never>;
      }
    }

    if (status === 401) {
      const data = error.response?.data as any;
      const msg =
        data?.message || 'You are not authorised to perform this action.';
      Toast.show({
        type: 'error',
        text1: 'Action Not Allowed',
        text2: msg,
      });
    }
    return Promise.reject(error);
  },
);

export const cancelAllRequests = () => {
  cancelTokens.forEach(controller => controller.abort());
  cancelTokens.length = 0;
};

/**
 * Logs out the user. Best-effort revoke of refresh token, then clear local state.
 */
export const logoutUser = () => {
  const refreshToken = storage.getString(StorageKeys.REFRESH_TOKEN);
  if (refreshToken) {
    refreshClient
      .post(ApiEndPoints.apiLogout, {refreshToken})
      .catch(() => undefined);
  }
  cancelAllRequests();
  storage.clearAll();
  store.dispatch(authActions.resetAuthState());
  store.dispatch(userActions.clearUserInfo());
  store.dispatch(clearProgramSelection());
  store.dispatch(clearPermissions());
  store.dispatch(clearProductContext());
};

export default axiosInstance;
