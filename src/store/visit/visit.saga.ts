import {call, put, takeLatest} from 'redux-saga/effects';
import visitApi from '@services/api/visit.api';
import {
  getVisitDetailsListRequest,
  getVisitDetailsListSuccess,
  getVisitDetailsListFailure,
  getSalesmanListRequest,
  getSalesmanListSuccess,
  getSalesmanListFailure,
  getLocationsListRequest,
  getLocationsListSuccess,
  getLocationsListFailure,
  saveVisitFormRequest,
  saveVisitFormSuccess,
  saveVisitFormFailure,
} from './visit.slice';

// Visit Details List Saga
function* getVisitDetailsListSaga() {
  try {
    const {data, error} = yield call(visitApi.getVisitDetailsList);
    if (error) {
      yield put(getVisitDetailsListFailure(error.message || 'Failed to fetch visit details'));
    } else {
      yield put(getVisitDetailsListSuccess(data || []));
    }
  } catch (error: any) {
    yield put(getVisitDetailsListFailure(error.message || 'Network error'));
  }
}

// Salesman List Saga
function* getSalesmanListSaga() {
  try {
    const {data, error} = yield call(visitApi.getSalesmanList);
    if (error) {
      yield put(getSalesmanListFailure(error.message || 'Failed to fetch salesman list'));
    } else {
      yield put(getSalesmanListSuccess(data || []));
    }
  } catch (error: any) {
    yield put(getSalesmanListFailure(error.message || 'Network error'));
  }
}

// Locations List Saga
function* getLocationsListSaga() {
  try {
    const {data, error} = yield call(visitApi.getLocations);
    if (error) {
      yield put(getLocationsListFailure(error.message || 'Failed to fetch locations'));
    } else {
      yield put(getLocationsListSuccess(data || []));
    }
  } catch (error: any) {
    yield put(getLocationsListFailure(error.message || 'Network error'));
  }
}

// Save Visit Form Saga
function* saveVisitFormSaga(action: any) {
  try {
    const {clientId, payload} = action.payload;
    const {data, error} = yield call(visitApi.saveVisitForm, clientId, payload);
    if (error) {
      yield put(saveVisitFormFailure(error.message || 'Failed to save visit form'));
    } else {
      yield put(saveVisitFormSuccess());
    }
  } catch (error: any) {
    yield put(saveVisitFormFailure(error.message || 'Network error'));
  }
}

export function* visitSaga() {
  yield takeLatest(getVisitDetailsListRequest.type, getVisitDetailsListSaga);
  yield takeLatest(getSalesmanListRequest.type, getSalesmanListSaga);
  yield takeLatest(getLocationsListRequest.type, getLocationsListSaga);
  yield takeLatest(saveVisitFormRequest.type, saveVisitFormSaga);
}
