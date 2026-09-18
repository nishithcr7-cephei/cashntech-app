import {PayloadWithCallback} from '@type/global.types';

/** Auth State */
export type UserType = 'client' | 'internal';
export interface IAuthState {
  globalLoader: boolean;
  userType: UserType;
  isLoggedIn: boolean | undefined;
}

/** Signin  */
export interface ISigninPayload {
  email: string;
  password: string;
}

export type SigninPayloadWithCallback = PayloadWithCallback<
  ISigninPayload,
  [string, string],
  [string]
>;

export interface ISigninSuccessResponse {
  statusCode?: number;
  message: string;
  success?: boolean;
  data: string; // e.g. mobile number "9887114487" (LMS: Otp sent successfully)
}

export interface ISigninErrorResponse {
  statusCode: number;
  message: string;
}

/** SignUp  */
export interface ISignupPayload {
  country_code: string;
  mobile_number: string;
  is_internal?: boolean;
  is_client?: boolean;
  first_name: string;
  last_name: string;
  email: string;
}

export type SignupPayloadWithCallback = PayloadWithCallback<
  ISignupPayload,
  [string], // Success callback can accept a string (the message)
  [string]
>;

export interface ISignupSuccessResponse {
  message: string;
  success: boolean;
}

export interface ISignupErrorResponse {
  statusCode: number;
  message: string;
}

/** Otp Verify  */
export interface IOtpVerifyPayload {
  email: string;
  otp: string;
}

export type OtpVerifyPayloadWithCallback = PayloadWithCallback<
  IOtpVerifyPayload,
  [string | undefined],
  [string]
>;

export interface ISigninOtpVerifyPayload {
  mobile_number: string;
  otp: string;
}

/** LMS verify-otp response – full user detail */
export interface ILmsUser {
  id: number;
  is_client: boolean;
  is_internal: boolean;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  role?: string;
  scope?: { program_ids?: string[] };
  final_user_permission?: unknown;
  /**
   * CWF additive claim — optional.
   * PR3 roleNormalizer may use as fallback when permission_group has no party role.
   */
  product_roles?: Array<{
    product_id: string;
    role: string;
    level?: number | null;
  }> | null;
}

/** Session after OTP / complete-consent (mobile gets refreshToken in body). */
export interface ILmsVerifyOtpData {
  token: string;
  refreshToken?: string;
  user: ILmsUser;
}

/** SCF pending-consent branch from verify-otp (no session token yet). */
export interface IPendingConsentData {
  pendingConsent: true;
  continuationToken: string;
  pendingAgreementTypes: string[];
}

export type SigninOtpVerifySuccess =
  | {status: 'authenticated'; user: ILmsUser}
  | {
      status: 'pendingConsent';
      mobile_number: string;
      continuationToken: string;
      pendingAgreementTypes: string[];
    };

export interface ISigninOtpVerifySuccessResponse {
  statusCode: number;
  message: string;
  data: ILmsVerifyOtpData | IPendingConsentData;
}

export type SigninOtpVerifyPayloadWithCallback = PayloadWithCallback<
  ISigninOtpVerifyPayload,
  [SigninOtpVerifySuccess],
  [string]
>;

export interface ICompleteConsentPayload {
  mobile_number: string;
  continuationToken: string;
  acceptedAgreementTypes: string[];
}

export type CompleteConsentPayloadWithCallback = PayloadWithCallback<
  ICompleteConsentPayload,
  [ILmsUser],
  [string]
>;

/** Result of post-login product context bootstrap (PR2). */
export type ProductBootstrapResult = {
  needsSelection: boolean;
};

export type BootstrapProductContextPayloadWithCallback = PayloadWithCallback<
  null,
  [ProductBootstrapResult],
  [string]
>;

export interface IOtpVerifySuccessResponse {
  statusCode: number;
  message: string;
  data: string;
}

export interface IOtpVerifyErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

/** Create Password */
export interface ICreatePasswordPayload {
  token: string;
  password: string;
}

export type CreatePasswordPayloadWithCallback = PayloadWithCallback<
  ICreatePasswordPayload,
  [string],
  [string]
>;

export interface ICreatePasswordApiResponse {
  statusCode: number;
  message: string;
}

/** Forgot Password */
export interface IResetLinkPayload {
  email: string;
}

export type ResetLinkPayloadWithCallback = PayloadWithCallback<
  IResetLinkPayload,
  [string],
  [string]
>;

export interface IResetLinkSuccessResponse {
  success: boolean;
  message: string;
}

export interface IResetLinkErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

export interface VerifyPasswordPayload {
  //email: string;
  token?: string;
  password: string;
}
export interface ISignInPayload {
  email: string;
  password: string;
}

export interface SigninOtpVerifyPayload {
  mobile_number: string;
  otp: string;
}

export interface IverifyPasswordResponse {
  statusCode?: number;
  message: string;
}

export interface ISigninResponse {
  statusCode?: number;
  message: string;
}

export interface ISigninOtpVerifyResponse {
  message: string;
  statusCode?: number;
}
