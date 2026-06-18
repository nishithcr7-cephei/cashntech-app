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

function getApiErrorMessage(error: any, fallback: string): string {
  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }
  if (
    error?.message?.includes('fetch') ||
    error?.message === 'Network Error' ||
    error?.code === 'ECONNABORTED'
  ) {
    return 'Network error. Check connection.';
  }
  return error?.message || fallback;
}

function* fetchInterestAccrualListWorker(action: PayloadAction<FetchInterestAccrualListRequest>): Generator<any, void, any> {
  try {
    const response = yield call(
      invoiceApi.getDisbursedList,
      action.payload.programIds,
      {
        byInvoiceStatus: action.payload.byInvoiceStatus ?? ['Disbursed', 'Closed'],
      },
    );
    yield put(fetchInterestAccrualListSuccess(response || []));
  } catch (error: any) {
    yield put(
      fetchInterestAccrualListFailure(
        getApiErrorMessage(error, 'Failed to fetch interest accruals'),
      ),
    );
  }
}

export function* interestAccrualSaga() {
  yield takeLatest(fetchDailyInterestRequest.type, fetchDailyInterestWorker);
  yield takeLatest(fetchInterestAccrualListRequest.type, fetchInterestAccrualListWorker);
}
