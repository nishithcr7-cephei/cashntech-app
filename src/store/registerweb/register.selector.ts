import {RootState} from '@store/app/store';

// Contact selectors
export const selectContactState = (state: RootState) => state.contact;
export const selectContactFormData = (state: RootState) => state.contact.formData;
export const selectContactLoading = (state: RootState) => state.contact.loading;
export const selectContactError = (state: RootState) => state.contact.error;
export const selectContactSuccess = (state: RootState) => state.contact.success;
export const selectContactServerResponse = (state: RootState) => state.contact.serverResponse;
export const selectCaptchaText = (state: RootState) => state.contact.captchaText;

// Register selectors
export const selectRegisterState = (state: RootState) => state.register;
export const selectRegisterFormData = (state: RootState) => state.register.formData;
export const selectRegisterLoading = (state: RootState) => state.register.loading;
export const selectRegisterError = (state: RootState) => state.register.error;
export const selectRegisterSuccess = (state: RootState) => state.register.success;
export const selectRegisterServerResponse = (state: RootState) => state.register.serverResponse;
export const selectCaptchaImage = (state: RootState) => state.register.captchaImage;

// GST Lookup selectors
export const selectGstLookupState = (state: RootState) => state.gstLookup;
export const selectGstLookupLoading = (state: RootState) => state.gstLookup.loading;
export const selectGstLookupError = (state: RootState) => state.gstLookup.error;
export const selectGstLookupClientDetails = (state: RootState) => state.gstLookup.clientDetails;
export const selectGstLookupRegistrationId = (state: RootState) => state.gstLookup.registrationId;

// Apply selectors
export const selectApplyState = (state: RootState) => state.apply;
export const selectApplyFormData = (state: RootState) => state.apply.formData;
export const selectApplyLoading = (state: RootState) => state.apply.loading;
export const selectApplyError = (state: RootState) => state.apply.error;
export const selectApplySuccess = (state: RootState) => state.apply.success;
export const selectApplyServerResponse = (state: RootState) => state.apply.serverResponse;