import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {invoiceApi} from '@services/api/invoice.api';
import {
  fetchDailyInterestRequest,
  fetchDailyInterestSuccess,
  fetchDailyInterestFailure,
  fetchInterestAccrualListRequest,
  fetchInterestAccrualListSuccess,
  fetchInterestAccrualListFailure,
} from './interestAccrual.slice';
import {FetchDailyInterestRequest, FetchInterestAccrualListRequest} from './interestAccrual.types';

function* fetchDailyInterestWorker(action: PayloadAction<FetchDailyInterestRequest>): Generator<any, void, any> {
  try {
    const response = yield call(invoiceApi.getDailyInterest as any, action.payload.invoiceId);
    // The invoiceApi returns the array directly or through mapping.
    yield put(fetchDailyInterestSuccess(response || []));
  } catch (error: any) {
    yield put(fetchDailyInterestFailure(error?.message || 'Something went wrong'));
  }
}

function* fetchInterestAccrualListWorker(action: PayloadAction<FetchInterestAccrualListRequest>): Generator<any, void, any> {
  try {
    const response = yield call(invoiceApi.getDisbursedList as any, action.payload.programIds);
    yield put(fetchInterestAccrualListSuccess(response || []));
  } catch (error: any) {
    yield put(fetchInterestAccrualListFailure(error?.message || 'Failed to fetch interest accruals'));
  }
}

export function* interestAccrualSaga() {
  yield takeLatest(fetchDailyInterestRequest.type, fetchDailyInterestWorker);
  yield takeLatest(fetchInterestAccrualListRequest.type, fetchInterestAccrualListWorker);
}
