import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  ContactState,
  ContactFormData,
  ContactApiResponse,
  initialContactState,
  RegisterState,
  RegisterFormData,
  RegisterApiResponse,
  initialRegisterState,
  GstLookupState,
  GstLookupApiResponse,
  ApplyState,
  ApplyFormData,
  ApplyApiResponse,
  initialApplyState,
} from './register.types';

const contactSlice = createSlice({
  name: 'contact',
  initialState: initialContactState,
  reducers: {
    setContactFormData: (state, action: PayloadAction<Partial<ContactFormData>>) => {
      state.formData = {...state.formData, ...action.payload};
    },
    setContactLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setContactError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setContactSuccess: (state, action: PayloadAction<boolean>) => {
      state.success = action.payload;
    },
    setContactServerResponse: (state, action: PayloadAction<ContactApiResponse | null>) => {
      state.serverResponse = action.payload;
    },
    setCaptchaText: (state, action: PayloadAction<string>) => {
      state.captchaText = action.payload;
    },
    resetContactForm: (state) => {
      state.formData = initialContactState.formData;
      state.error = null;
      state.success = false;
      state.serverResponse = null;
    },
    clearContactError: (state) => {
      state.error = null;
    },
  },
});

// Register Slice
const registerSlice = createSlice({
  name: 'register',
  initialState: initialRegisterState,
  reducers: {
    setRegisterFormData: (state, action: PayloadAction<Partial<RegisterFormData>>) => {
      state.formData = {...state.formData, ...action.payload};
    },
    setRegisterLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRegisterError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setRegisterSuccess: (state, action: PayloadAction<boolean>) => {
      state.success = action.payload;
    },
    setRegisterServerResponse: (state, action: PayloadAction<RegisterApiResponse | null>) => {
      state.serverResponse = action.payload;
    },
    setCaptchaImage: (state, action: PayloadAction<string>) => {
      state.captchaImage = action.payload;
    },
    resetRegisterForm: (state) => {
      state.formData = initialRegisterState.formData;
      state.error = null;
      state.success = false;
      state.serverResponse = null;
    },
    clearRegisterError: (state) => {
      state.error = null;
    },
  },
});

// GST Lookup Slice
const gstLookupSlice = createSlice({
  name: 'gstLookup',
  initialState: {
    loading: false,
    error: null,
    clientDetails: null,
    registrationId: null,
  } as GstLookupState,
  reducers: {
    setGstLookupLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setGstLookupError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setGstLookupData: (state, action: PayloadAction<GstLookupApiResponse>) => {
      state.clientDetails = action.payload.data.inboundClient;
      state.registrationId = action.payload.data.registration_id;
      state.error = null;
    },
    clearGstLookupData: (state) => {
      state.clientDetails = null;
      state.registrationId = null;
      state.error = null;
    },
    clearGstLookupError: (state) => {
      state.error = null;
    },
  },
});

// Apply Slice
const applySlice = createSlice({
  name: 'apply',
  initialState: initialApplyState,
  reducers: {
    setApplyFormData: (state, action: PayloadAction<Partial<ApplyFormData>>) => {
      state.formData = {...state.formData, ...action.payload};
    },
    setApplyLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setApplyError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setApplySuccess: (state, action: PayloadAction<boolean>) => {
      state.success = action.payload;
    },
    setApplyServerResponse: (state, action: PayloadAction<ApplyApiResponse | null>) => {
      state.serverResponse = action.payload;
    },
    resetApplyForm: (state) => {
      state.formData = initialApplyState.formData;
      state.error = null;
      state.success = false;
      state.serverResponse = null;
    },
    clearApplyError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setContactFormData,
  setContactLoading,
  setContactError,
  setContactSuccess,
  setContactServerResponse,
  setCaptchaText,
  resetContactForm,
  clearContactError,
  // Register actions
  setRegisterFormData,
  setRegisterLoading,
  setRegisterError,
  setRegisterSuccess,
  setRegisterServerResponse,
  setCaptchaImage,
  resetRegisterForm,
  clearRegisterError,
  // GST Lookup actions
  setGstLookupLoading,
  setGstLookupError,
  setGstLookupData,
  clearGstLookupData,
  clearGstLookupError,
  // Apply actions
  setApplyFormData,
  setApplyLoading,
  setApplyError,
  setApplySuccess,
  setApplyServerResponse,
  resetApplyForm,
  clearApplyError,
} = {
  ...contactSlice.actions,
  ...registerSlice.actions,
  ...gstLookupSlice.actions,
  ...applySlice.actions,
};

// Combine all reducers
const combinedReducer = {
  contact: contactSlice.reducer,
  register: registerSlice.reducer,
  gstLookup: gstLookupSlice.reducer,
  apply: applySlice.reducer,
};

export default combinedReducer;
