import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {
  fetchDealerInfoRequest,
  fetchDealerInfoSuccess,
  fetchDealerInfoFailure,
  fetchBankListRequest,
  fetchBankListSuccess,
  fetchBankListFailure,
  createInvoiceRequest,
  createInvoiceSuccess,
  createInvoiceFailure,
} from './inv.slice';
import {
  invoiceApi,
  CreateInvoicePayloadInput,
} from '@services/api/invoice.api';

function* fetchDealerInfoSaga(action: PayloadAction<string>) {
  try {
    const response = yield call(invoiceApi.getDealerInfo, action.payload);
    if (response?.data) {
      yield put(fetchDealerInfoSuccess(response.data));
    } else {
      yield put(
        fetchDealerInfoFailure(response?.message || 'Failed to fetch dealer info'),
      );
    }
  } catch (error: any) {
    const msg =
      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : error?.message || 'Network error';
    yield put(fetchDealerInfoFailure(msg));
  }
}

function* fetchBankListSaga() {
  try {
    const response = yield call(invoiceApi.getBankProductList);
    if (response?.data?.partnerBankList) {
      yield put(fetchBankListSuccess(response.data.partnerBankList));
    } else {
      yield put(
        fetchBankListFailure(response?.message || 'Failed to fetch bank list'),
      );
    }
  } catch (error: any) {
    const msg =
      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : error?.message || 'Network error';
    yield put(fetchBankListFailure(msg));
  }
}

function getErrorMessage(response: any, defaultMsg: string): string {
  if (!response) return defaultMsg;
  const statusCode = response.statusCode;
  const message = response.message;
  if (statusCode === 409) {
    return message || 'Invoice number already exists';
  }
  if (statusCode === 400 && Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'string') return message;
  return defaultMsg;
}

function* createInvoiceSaga(action: PayloadAction<CreateInvoicePayloadInput>) {
  try {
    const response = yield call(invoiceApi.createInvoice, action.payload);
    const statusCode = response?.statusCode;
    if (statusCode === 201) {
      yield put(createInvoiceSuccess(response));
    } else {
      yield put(
        createInvoiceFailure(
          getErrorMessage(response, 'Failed to create invoice'),
        ),
      );
    }
  } catch (error: any) {
    const data = error?.response?.data;
    let msg = 'Network error';
    if (error?.message?.includes('fetch') || error?.code === 'ECONNABORTED') {
      msg = 'Network error. Check connection.';
    } else if (data) {
      msg = getErrorMessage(data, 'Failed to create invoice');
    } else if (error?.message) {
      msg = error.message;
    }
    yield put(createInvoiceFailure(msg));
  }
}

export default function* invoiceSaga() {
  yield takeLatest(fetchDealerInfoRequest.type, fetchDealerInfoSaga);
  yield takeLatest(fetchBankListRequest.type, fetchBankListSaga);
  yield takeLatest(createInvoiceRequest.type, createInvoiceSaga);
}
