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
 * Verify signin OTP API
 */
const apiSigninOtpVerify = async (payload: ISigninOtpVerifyPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<IOtpVerifySuccessResponse>
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
  const {data, error} = await tryCatch<AxiosResponse<ISigninSuccessResponse>>(
    Api.post(Endpoints.apiSignin, payload),
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

export default {
  apiSignup,
  apiSignupOtpVerify,
  apiSigninOtpVerify,
  apiCreatePassword,
  apiSendResetLink,
  apiResetPassword,
  apiSignin,
};
