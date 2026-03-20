import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {AuthApis} from '@services/api';
import {Result} from '@utils/TryCatch';
import {AxiosError} from 'axios';
// Types
import {
  ISignupErrorResponse,
  ISignupSuccessResponse,
  IOtpVerifySuccessResponse,
  IOtpVerifyErrorResponse,
  ICreatePasswordApiResponse,
  ISigninOtpVerifySuccessResponse,
  SignupPayloadWithCallback,
  OtpVerifyPayloadWithCallback,
  CreatePasswordPayloadWithCallback,
  ResetLinkPayloadWithCallback,
  IResetLinkSuccessResponse,
  ISigninSuccessResponse,
  ISigninErrorResponse,
  SigninPayloadWithCallback,
  SigninOtpVerifyPayloadWithCallback,
} from './auth.types';
// Slice
import {
  otpVerifyRequest,
  signupRequest,
  createNewPassword,
  setGlobalLoader,
  sendResetLinkRequest,
  resetPassword,
  signinRequest,
  signinOtpVerifyRequest,
} from './auth.slice';
import {setStorage} from '@services/localStorage';
import StorageKeys from '@constants/StorageKeys';
import {userActions} from '@store/user';
import {deriveAppRoleFromUser} from '@utils/deriveAppRole';

function* handleSignup(
  action: PayloadAction<SignupPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    ISignupSuccessResponse,
    AxiosError<ISignupErrorResponse>
  > = yield call(AuthApis.apiSignup, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    action.payload.callbackSuccess?.(data?.message);
  } else {
    const errorMessage = error.response?.data.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

function* handleOtpVerify(
  action: PayloadAction<OtpVerifyPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    IOtpVerifySuccessResponse,
    AxiosError<IOtpVerifyErrorResponse>
  > = yield call(AuthApis.apiSignupOtpVerify, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    action.payload.callbackSuccess?.(data.data);
  } else {
    const errorMessage = error.response?.data.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

function* handleSignInOtpVerify(
  action: PayloadAction<SigninOtpVerifyPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    ISigninOtpVerifySuccessResponse,
    AxiosError<IOtpVerifyErrorResponse>
  > = yield call(AuthApis.apiSigninOtpVerify, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    const {token: tokenVal, user: userData} = data.data || {};
    setStorage(StorageKeys.TOKEN, tokenVal);
    setStorage(StorageKeys.USER_INFO, JSON.stringify(userData));
    const appRole = userData ? deriveAppRoleFromUser(userData) : null;
    yield put(userActions.setUserInfo({...userData, appRole}));
    action.payload.callbackSuccess?.(userData);
  } else {
    const errorMessage = error.response?.data?.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

function* handleCreateNewPassword(
  action: PayloadAction<CreatePasswordPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    ICreatePasswordApiResponse,
    AxiosError<ICreatePasswordApiResponse>
  > = yield call(AuthApis.apiCreatePassword, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    action.payload.callbackSuccess?.(data.message);
  } else {
    const errorMessage = error.response?.data.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

function* handleSendResetLink(
  action: PayloadAction<ResetLinkPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    IResetLinkSuccessResponse,
    AxiosError<IResetLinkSuccessResponse>
  > = yield call(AuthApis.apiSendResetLink, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    action.payload.callbackSuccess?.(data.message);
  } else {
    const errorMessage = error.response?.data.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

function* handleResetPassword(
  action: PayloadAction<CreatePasswordPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    ICreatePasswordApiResponse,
    AxiosError<ICreatePasswordApiResponse>
  > = yield call(AuthApis.apiResetPassword, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    action.payload.callbackSuccess?.(data.message);
  } else {
    const errorMessage = error.response?.data.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

function* handleSignin(
  action: PayloadAction<SigninPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    ISigninSuccessResponse,
    AxiosError<ISigninErrorResponse>
  > = yield call(AuthApis.apiSignin, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    action.payload.callbackSuccess?.(
      data?.message || 'Login successful',
      data.data,
    );
  } else {
    const errorMessage = error.response?.data.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

export default function* authSaga() {
  yield takeLatest(signupRequest.type, handleSignup);
  yield takeLatest(otpVerifyRequest.type, handleOtpVerify);
  yield takeLatest(signinOtpVerifyRequest.type, handleSignInOtpVerify);
  yield takeLatest(createNewPassword.type, handleCreateNewPassword);
  yield takeLatest(sendResetLinkRequest.type, handleSendResetLink);
  yield takeLatest(resetPassword.type, handleResetPassword);
  yield takeLatest(signinRequest.type, handleSignin);
}
