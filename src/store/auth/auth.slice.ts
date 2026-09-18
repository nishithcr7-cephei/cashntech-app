import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  IAuthState,
  UserType,
  SignupPayloadWithCallback,
  OtpVerifyPayloadWithCallback,
  CreatePasswordPayloadWithCallback,
  ResetLinkPayloadWithCallback,
  SigninPayloadWithCallback,
  SigninOtpVerifyPayloadWithCallback,
  CompleteConsentPayloadWithCallback,
  BootstrapProductContextPayloadWithCallback,
} from './auth.types';

const initialState: IAuthState = {
  globalLoader: false,
  userType: 'client',
  isLoggedIn: false, // Start with false, will be set properly in MainNavigator
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Global Loader
    setGlobalLoader: (state, action: PayloadAction<boolean>) => {
      state.globalLoader = action.payload;
    },
    // User Type
    setUserType: (state, action: PayloadAction<UserType>) => {
      state.userType = action.payload;
    },
    // Is Logged In
    setIsLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggedIn = action.payload;
    },
    // Signup
    signupRequest: (
      state,
      _action: PayloadAction<SignupPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    // OTP Verify
    otpVerifyRequest: (
      state,
      _action: PayloadAction<OtpVerifyPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    // SignIn OTP Verify
    signinOtpVerifyRequest: (
      state,
      _action: PayloadAction<SigninOtpVerifyPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    completeConsentRequest: (
      state,
      _action: PayloadAction<CompleteConsentPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    // Create New Password
    createNewPassword: (
      state,
      _action: PayloadAction<CreatePasswordPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    // Send Password Reset Link
    sendResetLinkRequest: (
      state,
      _action: PayloadAction<ResetLinkPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    // Reset Password
    resetPassword: (
      state,
      _action: PayloadAction<CreatePasswordPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    // Signin
    signinRequest: (
      state,
      _action: PayloadAction<SigninPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    /**
     * Resolve available products from /user/scope and set/persist active product.
     * Does not toggle isLoggedIn — SuccessScreen / ProductSelectionScreen do that.
     */
    bootstrapProductContextRequest: (
      state,
      _action: PayloadAction<BootstrapProductContextPayloadWithCallback>,
    ) => {
      state.globalLoader = true;
    },
    // Reset Auth State
    resetAuthState: (state) => {
      state.isLoggedIn = false;
      state.globalLoader = false;
      state.userType = 'client';
    },
  },
});

export const {
  setUserType,
  setGlobalLoader,
  setIsLoggedIn,
  signupRequest,
  otpVerifyRequest,
  signinOtpVerifyRequest,
  completeConsentRequest,
  createNewPassword,
  sendResetLinkRequest,
  resetPassword,
  signinRequest,
  bootstrapProductContextRequest,
  resetAuthState,
} = authSlice.actions;
export default authSlice.reducer;
