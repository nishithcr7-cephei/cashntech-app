import {call, put, takeEvery} from 'redux-saga/effects';
import {contactUsApi, registerApi, gstLookupApi, applyApi} from '@services/api/registerweb.api';
import {
  setContactLoading,
  setContactError,
  setContactSuccess,
  setContactServerResponse,
  resetContactForm,
  setRegisterLoading,
  setRegisterError,
  setRegisterSuccess,
  setRegisterServerResponse,
  resetRegisterForm,
  setGstLookupLoading,
  setGstLookupError,
  setGstLookupData,
  clearGstLookupData,
  setApplyLoading,
  setApplyError,
  setApplySuccess,
  setApplyServerResponse,
  resetApplyForm,
} from './register.slice';

// Action types
export const SUBMIT_CONTACT_FORM = 'SUBMIT_CONTACT_FORM';
export const SUBMIT_REGISTER_FORM = 'SUBMIT_REGISTER_FORM';
export const LOOKUP_GST_DETAILS = 'LOOKUP_GST_DETAILS';
export const SUBMIT_APPLY_FORM = 'SUBMIT_APPLY_FORM';

// Action creators
export const submitContactForm = (formData: any) => ({
  type: SUBMIT_CONTACT_FORM,
  payload: formData,
});

export const submitRegisterForm = (formData: any) => ({
  type: SUBMIT_REGISTER_FORM,
  payload: formData,
});

export const lookupGstDetails = (gstNumber: string) => ({
  type: LOOKUP_GST_DETAILS,
  payload: gstNumber,
});

export const submitApplyForm = (formData: any, registrationId: string) => ({
  type: SUBMIT_APPLY_FORM,
  payload: { formData, registrationId },
});

// Saga
function* submitContactFormSaga(action: any): Generator<any, void, any> {
  try {
    yield put(setContactLoading(true));
    yield put(setContactError(null));
    
    const response = yield call(contactUsApi.submitContactForm, action.payload);
    
    console.log('Saga received response:', response);
    
    // Store the server response
    yield put(setContactServerResponse(response));
    
    if (response.statusCode === 201) {
      console.log('Setting success to true');
      yield put(setContactSuccess(true));
      // Don't reset form here - let the UI handle it after showing alert
    } else {
      console.log('Setting error:', response.message);
      yield put(setContactError(response.message || 'Failed to submit form'));
    }
  } catch (error: any) {
    console.error('Contact form submission error:', error);
    yield put(setContactError(error.message || 'Network error occurred'));
  } finally {
    yield put(setContactLoading(false));
  }
}

// Register Saga
function* submitRegisterFormSaga(action: any): Generator<any, void, any> {
  try {
    yield put(setRegisterLoading(true));
    yield put(setRegisterError(null));
    
    const response = yield call(registerApi.submitRegistration, action.payload);
    
    console.log('Register Saga received response:', response);
    
    // Store the server response
    yield put(setRegisterServerResponse(response));
    
    if (response.statusCode === 201) {
      console.log('Setting register success to true');
      yield put(setRegisterSuccess(true));
      // Don't reset form here - let the UI handle it after showing alert
    } else {
      console.log('Setting register error:', response.message);
      yield put(setRegisterError(response.message || 'Failed to submit registration'));
    }
  } catch (error: any) {
    console.error('Register form submission error:', error);
    yield put(setRegisterError(error.message || 'Network error occurred'));
  } finally {
    yield put(setRegisterLoading(false));
  }
}

// GST Lookup Saga
function* lookupGstDetailsSaga(action: any): Generator<any, void, any> {
  try {
    yield put(setGstLookupLoading(true));
    yield put(clearGstLookupData());
    
    const response = yield call(gstLookupApi.lookupGstDetails, action.payload);
    
    console.log('GST Lookup Saga received response:', response);
    
    if (response.statusCode === 200) {
      yield put(setGstLookupData(response));
    } else {
      yield put(setGstLookupError(response.message || 'Failed to fetch GST details'));
    }
  } catch (error: any) {
    console.error('GST Lookup error:', error);
    yield put(setGstLookupError(error.message || 'Network error occurred'));
  } finally {
    yield put(setGstLookupLoading(false));
  }
}

// Root saga
export function* contactSaga() {
  yield takeEvery(SUBMIT_CONTACT_FORM, submitContactFormSaga);
}

export function* registerSaga() {
  yield takeEvery(SUBMIT_REGISTER_FORM, submitRegisterFormSaga);
}

// Apply Saga
function* submitApplyFormSaga(action: any): Generator<any, void, any> {
  try {
    yield put(setApplyLoading(true));
    yield put(setApplyError(null));
    
    const { formData, registrationId } = action.payload;
    const response = yield call(applyApi.submitApplication, formData, registrationId);
    
    console.log('Apply Saga received response:', response);
    
    // Store the server response
    yield put(setApplyServerResponse(response));
    
    if (response.statusCode === 201) {
      console.log('Setting apply success to true');
      yield put(setApplySuccess(true));
      // Don't reset form here - let the UI handle it after showing alert
    } else {
      console.log('Setting apply error:', response.message);
      yield put(setApplyError(response.message || 'Failed to submit application'));
    }
  } catch (error: any) {
    console.error('Apply form submission error:', error);
    yield put(setApplyError(error.message || 'Network error occurred'));
  } finally {
    yield put(setApplyLoading(false));
  }
}

export function* gstLookupSaga() {
  yield takeEvery(LOOKUP_GST_DETAILS, lookupGstDetailsSaga);
}

export function* applySaga() {
  yield takeEvery(SUBMIT_APPLY_FORM, submitApplyFormSaga);
}
