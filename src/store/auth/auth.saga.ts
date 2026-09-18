import {call, put, select, takeLatest} from 'redux-saga/effects';
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
  ILmsUser,
  ILmsVerifyOtpData,
  IPendingConsentData,
  SignupPayloadWithCallback,
  OtpVerifyPayloadWithCallback,
  CreatePasswordPayloadWithCallback,
  ResetLinkPayloadWithCallback,
  IResetLinkSuccessResponse,
  ISigninSuccessResponse,
  ISigninErrorResponse,
  SigninPayloadWithCallback,
  SigninOtpVerifyPayloadWithCallback,
  CompleteConsentPayloadWithCallback,
  BootstrapProductContextPayloadWithCallback,
  ProductBootstrapResult,
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
  completeConsentRequest,
  bootstrapProductContextRequest,
} from './auth.slice';
import {setStorage} from '@services/localStorage';
import StorageKeys from '@constants/StorageKeys';
import {userActions, userSelector} from '@store/user';
import {
  deriveCapabilityFromUser,
  toLegacyAppRole,
} from '@utils/roleNormalizer';
import {
  fetchUserScopeSuccess,
  fetchUserScopeFailure,
} from '@store/programSelection/programSelection.slice';
import {fetchPermissionsRequest} from '@store/permissions';
import {
  extractResolvedProductsFromScope,
  mapUserScopeToBanks,
  userScopeApi,
} from '@services/api/userScope.api';
import {
  setActiveProduct,
  setAvailableProducts,
} from '@store/product/product.slice';
import {selectActiveProduct} from '@store/product/product.selectors';
import type {ResolvedProduct} from '@store/product/product.types';

function isPendingConsentData(
  data: ILmsVerifyOtpData | IPendingConsentData | undefined,
): data is IPendingConsentData {
  return !!data && (data as IPendingConsentData).pendingConsent === true;
}

function* persistAuthenticatedSession(session: ILmsVerifyOtpData): unknown {
  const {token: tokenVal, refreshToken, user: userData} = session;
  setStorage(StorageKeys.TOKEN, tokenVal);
  if (refreshToken) {
    setStorage(StorageKeys.REFRESH_TOKEN, refreshToken);
  }
  setStorage(StorageKeys.USER_INFO, JSON.stringify(userData));
  const capability = userData
    ? deriveCapabilityFromUser({
        ...userData,
        product_roles: userData.product_roles ?? null,
      })
    : null;
  const appRole = capability ? toLegacyAppRole(capability) : null;
  yield put(
    userActions.setUserInfo({
      ...userData,
      appRole,
      capability,
      product_roles: userData?.product_roles ?? null,
    }),
  );
  return userData as ILmsUser;
}

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
    const payloadData = data.data;
    if (isPendingConsentData(payloadData)) {
      action.payload.callbackSuccess?.({
        status: 'pendingConsent',
        mobile_number: action.payload.payload.mobile_number,
        continuationToken: payloadData.continuationToken,
        pendingAgreementTypes: payloadData.pendingAgreementTypes ?? [],
      });
      return;
    }
    if (!payloadData?.token || !payloadData?.user) {
      action.payload.callbackError?.('Invalid OTP response');
      return;
    }
    const userData: ILmsUser = yield call(
      persistAuthenticatedSession,
      payloadData,
    );
    action.payload.callbackSuccess?.({
      status: 'authenticated',
      user: userData,
    });
  } else {
    const errorMessage = error.response?.data?.message ?? 'Something went wrong';
    action.payload.callbackError?.(errorMessage);
  }
}

function* handleCompleteConsent(
  action: PayloadAction<CompleteConsentPayloadWithCallback>,
): unknown {
  const {
    data,
    error,
  }: Result<
    ISigninOtpVerifySuccessResponse,
    AxiosError<IOtpVerifyErrorResponse>
  > = yield call(AuthApis.apiCompleteConsent, action.payload.payload);
  yield put(setGlobalLoader(false));
  if (!error) {
    const payloadData = data.data;
    if (isPendingConsentData(payloadData) || !payloadData?.token || !payloadData?.user) {
      action.payload.callbackError?.('Consent completion did not return a session');
      return;
    }
    const userData: ILmsUser = yield call(
      persistAuthenticatedSession,
      payloadData as ILmsVerifyOtpData,
    );
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

function findMatchingAvailableProduct(
  available: ResolvedProduct[],
  previous: ResolvedProduct | null,
): ResolvedProduct | null {
  if (!previous || available.length === 0) {
    return null;
  }
  return (
    available.find(
      p =>
        (previous.id && p.id === previous.id) || p.code === previous.code,
    ) ?? null
  );
}

/**
 * Load /user/scope, sync programSelection + product context.
 * DF-only (0–1 products): auto-select, needsSelection=false.
 * Multi-product: needsSelection=true unless a persisted active product still matches.
 */
function* handleBootstrapProductContext(
  action: PayloadAction<BootstrapProductContextPayloadWithCallback>,
): unknown {
  try {
    const isClient = (yield select(userSelector.getIsClient)) ?? true;
    const response = yield call(userScopeApi.getUserScope, isClient);
    const data = response?.data;

    if (!Array.isArray(data) || data.length === 0) {
      yield put(
        fetchUserScopeFailure(response?.message || 'No programs available'),
      );
      yield put(setAvailableProducts([]));
      // Absent product context → DF default behavior (active stays null)
      const result: ProductBootstrapResult = {needsSelection: false};
      yield put(setGlobalLoader(false));
      action.payload.callbackSuccess?.(result);
      return;
    }

    const banks = mapUserScopeToBanks(data);
    yield put(fetchUserScopeSuccess(banks));
    yield put(fetchPermissionsRequest());

    const available = extractResolvedProductsFromScope(data);
    yield put(setAvailableProducts(available));

    const previousActive: ResolvedProduct | null = yield select(
      selectActiveProduct,
    );
    const matched = findMatchingAvailableProduct(available, previousActive);

    let needsSelection = false;

    if (available.length <= 1) {
      yield put(setActiveProduct(available[0] ?? null));
      needsSelection = false;
    } else if (matched) {
      yield put(setActiveProduct(matched));
      needsSelection = false;
    } else {
      needsSelection = true;
    }

    yield put(setGlobalLoader(false));
    action.payload.callbackSuccess?.({needsSelection});
  } catch (error: unknown) {
    const err = error as {message?: string; code?: string};
    const msg =
      err?.message?.includes('fetch') || err?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : err?.message || 'Failed to load product context';
    yield put(fetchUserScopeFailure(msg));
    yield put(setGlobalLoader(false));
    // Do not block DF login on scope/product failure
    action.payload.callbackSuccess?.({needsSelection: false});
    action.payload.callbackError?.(msg);
  }
}

export default function* authSaga() {
  yield takeLatest(signupRequest.type, handleSignup);
  yield takeLatest(otpVerifyRequest.type, handleOtpVerify);
  yield takeLatest(signinOtpVerifyRequest.type, handleSignInOtpVerify);
  yield takeLatest(completeConsentRequest.type, handleCompleteConsent);
  yield takeLatest(createNewPassword.type, handleCreateNewPassword);
  yield takeLatest(sendResetLinkRequest.type, handleSendResetLink);
  yield takeLatest(resetPassword.type, handleResetPassword);
  yield takeLatest(signinRequest.type, handleSignin);
  yield takeLatest(
    bootstrapProductContextRequest.type,
    handleBootstrapProductContext,
  );
}
