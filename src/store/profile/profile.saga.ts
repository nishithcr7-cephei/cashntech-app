import {call, put, takeLatest} from 'redux-saga/effects';
import ProfileApis from '@services/api/profile.api';
import {
  getClientProfile,
  setClientProfile,
  setClientProfileError,
  getSoftSanctionDetails,
  setSoftSanctionDetails,
  setSoftSanctionError,
  getKycDocuments,
  setKycDocuments,
  setKycDocumentsError,
} from './profile.slice';
import {IClientProfileData, ISoftSanctionData, IKycDocumentsData} from './profile.types';

// Error messages
const ERROR_MESSAGES = {
  CLIENT_PROFILE: 'Failed to fetch client profile',
  SOFT_SANCTION: 'Failed to fetch soft sanction details',
  KYC_DOCUMENTS: 'Failed to fetch KYC documents',
} as const;

function* handleGetClientProfile(action: {payload: string | number}): Generator<any, void, any> {
  try {
    const response = yield call(ProfileApis.getClientProfile, action.payload);
    
    if (response?.data) {
      yield put(setClientProfile(response.data as IClientProfileData));
    } else {
      yield put(setClientProfileError(ERROR_MESSAGES.CLIENT_PROFILE));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.CLIENT_PROFILE;
    yield put(setClientProfileError(errorMessage));
  }
}

function* handleGetSoftSanctionDetails(action: {payload: string | number}): Generator<any, void, any> {
  try {
    const response = yield call(ProfileApis.getSoftSanctionDetails, action.payload);
    
    if (response?.data) {
      yield put(setSoftSanctionDetails(response.data as ISoftSanctionData[]));
    } else {
      yield put(setSoftSanctionError(ERROR_MESSAGES.SOFT_SANCTION));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.SOFT_SANCTION;
    yield put(setSoftSanctionError(errorMessage));
  }
}

function* handleGetKycDocuments(action: {payload: string | number}): Generator<any, void, any> {
  try {
    const response = yield call(ProfileApis.getKycDocuments, action.payload);
    
    if (response?.data) {
      yield put(setKycDocuments(response.data as IKycDocumentsData[]));
    } else {
      yield put(setKycDocumentsError(ERROR_MESSAGES.KYC_DOCUMENTS));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.KYC_DOCUMENTS;
    yield put(setKycDocumentsError(errorMessage));
  }
}

export default function* profileSaga(): Generator<any, void, any> {
  yield takeLatest(getClientProfile, handleGetClientProfile);
  yield takeLatest(getSoftSanctionDetails, handleGetSoftSanctionDetails);
  yield takeLatest(getKycDocuments, handleGetKycDocuments);
}
