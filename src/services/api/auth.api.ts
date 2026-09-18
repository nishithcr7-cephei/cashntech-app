import {AxiosResponse} from 'axios';
import {tryCatch} from '@utils/TryCatch';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
// Types
import {
  ICreatePasswordApiResponse,
  ICreatePasswordPayload,
  IOtpVerifyPayload,
  IOtpVerifySuccessResponse,
  IResetLinkPayload,
  IResetLinkSuccessResponse,
  ISigninOtpVerifyPayload,
  ISigninOtpVerifySuccessResponse,
  ICompleteConsentPayload,
  ISigninPayload,
  ISigninSuccessResponse,
  ISignupPayload,
  ISignupSuccessResponse,
} from '@store/auth';

/**
 * Signup API
 */
const apiSignup = async (payload: ISignupPayload) => {
  const {data, error} = await tryCatch<AxiosResponse<ISignupSuccessResponse>>(
    Api.post(Endpoints.apiSignup, payload),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

/**
 * Verify OTP API
 */
const apiSignupOtpVerify = async (payload: IOtpVerifyPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<IOtpVerifySuccessResponse>
  >(Api.post(Endpoints.apiSignupOtpVerify, payload));
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

/**
 * Verify signin OTP API (LMS: POST /auth/verify-otp)
 */
const apiSigninOtpVerify = async (payload: ISigninOtpVerifyPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<ISigninOtpVerifySuccessResponse>
  >(Api.post(Endpoints.apiSigninOtpVerify, payload));
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

/**
 * Complete SCF consent after verify-otp returned pendingConsent.
 */
const apiCompleteConsent = async (payload: ICompleteConsentPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<ISigninOtpVerifySuccessResponse>
  >(Api.post(Endpoints.apiCompleteConsent, payload));
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

/**
 * Exchange refresh token for a new access (+ rotated refresh) token.
 */
const apiRefreshToken = async (refreshToken: string) => {
  const {data, error} = await tryCatch<
    AxiosResponse<{
      statusCode: number;
      message: string;
      data: {token: string; refreshToken?: string};
    }>
  >(Api.post(Endpoints.apiRefreshToken, {refreshToken}));
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

/**
 * Revoke refresh token server-side (best-effort on logout).
 */
const apiLogout = async (refreshToken?: string | null) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiLogout, refreshToken ? {refreshToken} : {}),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

/**
 * Create Password API
 */
const apiCreatePassword = async (payload: ICreatePasswordPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<ICreatePasswordApiResponse>
  >(Api.post(Endpoints.apiCreatePassword, payload));
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

/**
 * Forgot Password API
 */
const apiSendResetLink = async (payload: IResetLinkPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<IResetLinkSuccessResponse>
  >(Api.post(Endpoints.apiForgotPassword, payload));
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

/**
 * Reset Password API
 */
const apiResetPassword = async (payload: ICreatePasswordPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<ICreatePasswordApiResponse>
  >(Api.post(Endpoints.apiResetPassword, payload));
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

/**
 * Signin API
 */
const apiSignin = async (payload: ISigninPayload) => {
  const fullUrl = `${Api.defaults.baseURL}${Endpoints.apiSignin}`;
  console.log('🟢 [auth.api] Signin API called');
  console.log('🟢 [auth.api] Full URL:', fullUrl);
  console.log('🟢 [auth.api] Method: POST');
  console.log('🟢 [auth.api] Payload:', JSON.stringify(payload, null, 2));
  
  const {data, error} = await tryCatch<AxiosResponse<ISigninSuccessResponse>>(
    Api.post(Endpoints.apiSignin, payload),
  );
  if (error) {
    const isNetworkError =
      (error as any)?.message === 'Network Error' ||
      (error as any)?.code === 'ERR_NETWORK';
    if (isNetworkError) {
      console.log(
        '🔴 [auth.api] Signin failed – cannot reach server. Check: (1) Backend is running (2) API_URL port matches backend PORT (e.g. 3000) (3) Device and PC on same WiFi. Full URL:',
        fullUrl,
      );
    }
    console.log('🔴 [auth.api] Signin API error:', error);
    return {
      data: null,
      error: error,
    };
  }
  console.log('✅ [auth.api] Signin API success:', data.data);
  return {
    data: data.data,
    error: null,
  };
};

export default {
  apiSignup,
  apiSignupOtpVerify,
  apiSigninOtpVerify,
  apiCompleteConsent,
  apiRefreshToken,
  apiLogout,
  apiCreatePassword,
  apiSendResetLink,
  apiResetPassword,
  apiSignin,
  apiResendOtp: async (payload: {email: string}) => {
    const {data, error} = await tryCatch<AxiosResponse<any>>(
      Api.post(Endpoints.apiResendOtp, payload),
    );
    if (error) return {data: null, error};
    return {data: data.data, error: null};
  },
};
