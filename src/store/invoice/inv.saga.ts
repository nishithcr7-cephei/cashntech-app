import {call, put, select, takeLatest} from 'redux-saga/effects';
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
  bulkUpdateInvoiceRequest,
  bulkUpdateInvoiceSuccess,
  bulkUpdateInvoiceFailure,
  bulkDisbursementRequest,
  bulkDisbursementSuccess,
  bulkDisbursementFailure,
} from './inv.slice';
import {
  invoiceApi,
  CreateInvoicePayloadInput,
  toYYYYMMDD,
} from '@services/api/invoice.api';
import type {
  UpdateInvoiceStatusRequest,
  UpdateInvoiceVerificationRequest,
  UpdateInvoicePayload,
  BulkUpdateInvoiceRequest,
  BulkDisbursementRequest,
} from './inv.types';
import {
  selectActiveProductCode,
  selectActiveProductId,
} from '@store/product/product.selectors';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {resolveWorkspaceProductId} from '@store/product/product.resolver';
import {getUserCapability} from '@store/user/user.selector';
import type {InvoiceListFilters} from './inv.types';
import type {InvoicePartyInfoRouteOptions} from '@utils/invoicePartyInfoRoute';

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

function* selectPartyInfoRouteOptions(): Generator<
  any,
  InvoicePartyInfoRouteOptions,
  any
> {
  const productCode = yield select(selectActiveProductCode);
  const capability = yield select(getUserCapability);
  return {
    productCode: productCode ?? null,
    partySide: capability?.party ?? null,
  };
}

/**
 * productId for list/KPI bodies: selected program product, else active product.
 */
function* selectOptionalProductId(): Generator<any, string | null, any> {
  const programSelection = yield select(selectProgramSelection);
  const productId = yield select(selectActiveProductId);
  return resolveWorkspaceProductId(programSelection, productId);
}

function* fetchDealerInfoSaga(action: PayloadAction<string>): Generator {
  try {
    const routeOptions: InvoicePartyInfoRouteOptions = yield call(
      selectPartyInfoRouteOptions,
    );
    const response = yield call(
      invoiceApi.getDealerInfo,
      action.payload,
      routeOptions,
    );
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
  if (!response) {
    return defaultMsg;
  }
  const statusCode = response.statusCode;
  const message = response.message;
  if (statusCode === 409) {
    // Unified backend also raises 409 when the program has no workflow
    // steps configured (createInvoice/updateInvoice) — surface that
    // distinctly instead of the generic duplicate-invoice-number copy.
    if (typeof message === 'string' && /no workflow configured/i.test(message)) {
      return `${message}. Please contact your administrator to configure a workflow for this program.`;
    }
    return message || 'Invoice number already exists';
  }
  if (statusCode === 400 && Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'string') {
    return message;
  }
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
  action: PayloadAction<{programId: string; filters?: InvoiceListFilters}>,
): Generator {
  try {
    const {programId, filters} = action.payload;
    const productId: string | null = yield call(selectOptionalProductId);
    if (!String(programId || '').trim() && !productId) {
      return;
    }
    const data = yield call(
      invoiceApi.getInvoiceList,
      programId,
      filters,
      productId ? {productId} : undefined,
    );
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
      grnDate,
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
      grnDate,
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
    if (action.payload.onFailure) {
      yield call(action.payload.onFailure);
    }
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
          : act === 'On Hold'
            ? 'Invoice put on hold successfully'
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
    if (action.payload.onFailure) {
      yield call(action.payload.onFailure);
    }
  }
}

function* bulkUpdateInvoiceSaga(
  action: PayloadAction<BulkUpdateInvoiceRequest>,
): Generator {
  const {
    action: act,
    invoices,
    programId,
    filters,
    onSuccess,
    onFailure,
    isVerification,
  } = action.payload;

  try {
    let response: any;
    if (isVerification) {
      // Admin Bulk Verification API
      response = yield call(invoiceApi.bulkUpdateInvoiceVerification, {
        action: act as any,
        invoices: invoices.map(inv => ({
          invoiceId: inv.invoiceId,
          action: inv.action,
          remark: inv.remark,
          approvalRemark: inv.approvalRemark,
        })),
      });
    } else {
      // Regular User Bulk Approval API
      response = yield call(invoiceApi.bulkUpdateInvoiceStatus, {
        action: act as 'Approve' | 'Reject',
        invoices: invoices.map(inv => ({
          invoiceId: inv.invoiceId,
          action: inv.action,
          approval_level:
            inv.approval_level != null && Number.isFinite(Number(inv.approval_level))
              ? Number(inv.approval_level)
              : 1,
          remark: inv.remark,
          grn_date: inv.grnDate,
        })),
      });
    }

    showActionToast(
      'success',
      response?.message || `Bulk ${act.toLowerCase()} successful`,
    );
    yield put(bulkUpdateInvoiceSuccess());
    if (onSuccess) {
      yield call(onSuccess);
    }
    if (programId) {
      yield put(fetchInvoiceListRequest({programId, filters}));
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update bulk status';
    showActionToast('error', msg);
    yield put(bulkUpdateInvoiceFailure(msg));
    if (onFailure) {
      yield call(onFailure);
    }
  }
}

function* bulkDisbursementSaga(
  action: PayloadAction<BulkDisbursementRequest>,
): Generator {
  try {
    const {invoices, onSuccess} = action.payload;
    const formattedInvoices = invoices.map(inv => ({
      ...inv,
      disbursement_date: toYYYYMMDD(inv.disbursement_date ?? ''),
      expected_release_date: inv.expected_release_date
        ? toYYYYMMDD(inv.expected_release_date)
        : undefined,
    }));
    const response = yield call(invoiceApi.bulkDisbursement, {
      invoices: formattedInvoices,
    });
    yield put(bulkDisbursementSuccess());
    if (onSuccess) {
      const message =
        response?.message ||
        response?.data?.message ||
        'Bulk disbursement processed successfully';
      yield call(onSuccess, message);
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to perform bulk disbursement';
    showActionToast('error', msg);
    yield put(bulkDisbursementFailure(msg));
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
  yield takeLatest(bulkUpdateInvoiceRequest.type, bulkUpdateInvoiceSaga);
  yield takeLatest(bulkDisbursementRequest.type, bulkDisbursementSaga);
}
