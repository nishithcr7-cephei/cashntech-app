import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
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
  resetCreateInvoiceState,
  updateInvoiceRequest,
  updateInvoiceSuccess,
  updateInvoiceFailure,
  fetchInvoiceListRequest,
  fetchInvoiceListSuccess,
  fetchInvoiceListFailure,
  updateInvoiceStatusRequest,
  updateInvoiceStatusSuccess,
  updateInvoiceStatusFailure,
  updateInvoiceVerificationRequest,
  updateInvoiceVerificationSuccess,
  updateInvoiceVerificationFailure,
} from './inv.slice';
import {
  invoiceApi,
  CreateInvoicePayloadInput,
} from '@services/api/invoice.api';
import type {UpdateInvoiceStatusRequest, UpdateInvoiceVerificationRequest, UpdateInvoicePayload} from './inv.types';

function showActionToast(
  type: 'success' | 'error',
  text1: string,
  text2?: string,
) {
  Toast.show({
    type,
    text1,
    ...(text2 ? {text2} : {}),
    visibilityTime: 3000,
  });
}

function* fetchDealerInfoSaga(action: PayloadAction<string>): Generator {
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

function* fetchBankListSaga(): Generator {
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

function* createInvoiceSaga(action: PayloadAction<CreateInvoicePayloadInput>): Generator {
  console.log('[inv.saga] createInvoiceSaga started', action.payload);
  try {
    const response = yield call(invoiceApi.createInvoice, action.payload);
    console.log('[inv.saga] createInvoice response', response);
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

function* updateInvoiceSaga(action: PayloadAction<UpdateInvoicePayload>): Generator {
  try {
    const response = yield call(invoiceApi.updateInvoice, action.payload);
    const statusCode = response?.statusCode;
    if (statusCode === 200 || statusCode === 201 || (response && !statusCode)) {
      yield put(updateInvoiceSuccess(response));
    } else {
      yield put(
        updateInvoiceFailure(
          getErrorMessage(response, 'Failed to update invoice'),
        ),
      );
    }
  } catch (error: any) {
    const data = error?.response?.data;
    let msg = 'Network error';
    if (error?.message?.includes('fetch') || error?.code === 'ECONNABORTED') {
      msg = 'Network error. Check connection.';
    } else if (data) {
      msg = getErrorMessage(data, 'Failed to update invoice');
    } else if (error?.message) {
      msg = error.message;
    }
    yield put(updateInvoiceFailure(msg));
  }
}

function* fetchInvoiceListSaga(
  action: PayloadAction<{programId: string; filters?: {byInvoiceStatus?: string[]; byApprovalStatus?: string[]}}>,
): Generator {
  try {
    const {programId, filters} = action.payload;
    const data = yield call(invoiceApi.getInvoiceList, programId, filters);
    yield put(fetchInvoiceListSuccess(data));
  } catch (error: any) {
    const msg =
      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : error?.message || 'Failed to fetch invoice list';
    yield put(fetchInvoiceListFailure(msg));
  }
}

function* updateInvoiceStatusSaga(
  action: PayloadAction<UpdateInvoiceStatusRequest>,
): Generator {
  try {
    const {
      invoiceId,
      action: act,
      approvalLevel,
      remark,
      programId,
      filters,
      onSuccess,
    } =
      action.payload;
    const response = yield call(invoiceApi.updateInvoiceStatus, {
      invoiceId,
      action: act,
      approvalLevel,
      remark,
    });
    showActionToast(
      'success',
      response?.message ||
        (act === 'Approve'
          ? 'Invoice approved successfully'
          : 'Invoice rejected successfully'),
    );
    yield put(updateInvoiceStatusSuccess());
    if (onSuccess) {
      yield call(onSuccess);
    }
    if (programId !== undefined) {
      yield put(fetchInvoiceListRequest({programId, filters}));
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update invoice status';
    showActionToast('error', msg);
    yield put(updateInvoiceStatusFailure(msg));
  }
}

function* updateInvoiceVerificationSaga(
  action: PayloadAction<UpdateInvoiceVerificationRequest>,
): Generator {
  try {
    const {invoiceId, action: act, remark, programId, filters, onSuccess} = action.payload;
    const response = yield call(invoiceApi.updateInvoiceVerification, {
      invoiceId,
      action: act,
      remark,
    });
    showActionToast(
      'success',
      response?.message ||
        (act === 'Verify'
          ? 'Invoice verified successfully'
          : 'Invoice rejected successfully'),
    );
    yield put(updateInvoiceVerificationSuccess());
    if (onSuccess) {
      yield call(onSuccess);
    }
    if (programId !== undefined) {
      yield put(fetchInvoiceListRequest({programId, filters}));
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update invoice verification';
    showActionToast('error', msg);
    yield put(updateInvoiceVerificationFailure(msg));
  }
}

export default function* invoiceSaga(): Generator {
  yield takeLatest(fetchDealerInfoRequest.type, fetchDealerInfoSaga);
  yield takeLatest(fetchBankListRequest.type, fetchBankListSaga);
  yield takeLatest(createInvoiceRequest.type, createInvoiceSaga);
  yield takeLatest(updateInvoiceRequest.type, updateInvoiceSaga);
  yield takeLatest(fetchInvoiceListRequest.type, fetchInvoiceListSaga);
  yield takeLatest(updateInvoiceStatusRequest.type, updateInvoiceStatusSaga);
  yield takeLatest(updateInvoiceVerificationRequest.type, updateInvoiceVerificationSaga);
}
