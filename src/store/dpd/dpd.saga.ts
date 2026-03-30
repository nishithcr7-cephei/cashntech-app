import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import axiosInstance from '@services/api/api';
import Endpoints from '@constants/ApiEndPoints';
import {
  fetchDPDListRequest,
  fetchDPDListSuccess,
  fetchDPDListFailure,
} from './dpd.slice';
import {FetchDPDListRequest} from './dpd.types';

function* fetchDPDListWorker(action: PayloadAction<FetchDPDListRequest>): Generator<any, void, any> {
  try {
    const response = yield call(axiosInstance.post as any, Endpoints.apiDPDList, action.payload, {
      authRequired: true,
    });
    if (response.data?.statusCode === 200) {
      yield put(fetchDPDListSuccess(response.data.data || []));
    } else {
      yield put(fetchDPDListFailure(response.data?.message || 'Failed to fetch DPD list'));
    }
  } catch (error: any) {
    yield put(fetchDPDListFailure(error?.message || 'Something went wrong'));
  }
}

export function* dpdSaga() {
  yield takeLatest(fetchDPDListRequest.type, fetchDPDListWorker);
}
