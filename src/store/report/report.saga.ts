import {all, call, put, takeLatest} from 'redux-saga/effects';
import type {PayloadAction} from '@reduxjs/toolkit';
import {
  fetchAllLoansReportApi,
  fetchDisbursementReportApi,
  fetchDailyAccrualReportApi,
  fetchMonthlyAccrualReportApi,
  fetchRepaymentReportApi,
  fetchInvoiceOutstandingReportApi,
  fetchLoanStatusReportApi,
  fetchAllProductOutstandingReportApi,
  fetchUtilizationReportApi,
  fetchDpdReportApi,
} from '@services/api/report.api';
import {
  fetchAllLoansReportRequest,
  fetchAllLoansReportSuccess,
  fetchAllLoansReportFailure,
  fetchDisbursementReportRequest,
  fetchDisbursementReportSuccess,
  fetchDisbursementReportFailure,
  fetchDailyAccrualReportRequest,
  fetchDailyAccrualReportSuccess,
  fetchDailyAccrualReportFailure,
  fetchMonthlyAccrualReportRequest,
  fetchMonthlyAccrualReportSuccess,
  fetchMonthlyAccrualReportFailure,
  fetchRepaymentReportRequest,
  fetchRepaymentReportSuccess,
  fetchRepaymentReportFailure,
  fetchInvoiceOutstandingReportRequest,
  fetchInvoiceOutstandingReportSuccess,
  fetchInvoiceOutstandingReportFailure,
  fetchLoanStatusReportRequest,
  fetchLoanStatusReportSuccess,
  fetchLoanStatusReportFailure,
  fetchAllProductOutstandingReportRequest,
  fetchAllProductOutstandingReportSuccess,
  fetchAllProductOutstandingReportFailure,
  fetchUtilizationReportRequest,
  fetchUtilizationReportSuccess,
  fetchUtilizationReportFailure,
  fetchDpdReportRequest,
  fetchDpdReportSuccess,
  fetchDpdReportFailure,
} from './report.slice';
import type {
  AllLoanReportItem,
  AllLoansReportRequestPayload,
  DailyAccrualReportItem,
  DailyAccrualReportRequestPayload,
  MonthlyAccrualReportItem,
  MonthlyAccrualReportRequestPayload,
  RepaymentReportItem,
  RepaymentReportRequestPayload,
  InvoiceOutstandingReportItem,
  InvoiceOutstandingReportRequestPayload,
  LoanStatusReportItem,
  LoanStatusReportRequestPayload,
  AllProductOutstandingReportItem,
  AllProductOutstandingReportRequestPayload,
  UtilizationReportItem,
  UtilizationReportRequestPayload,
  DisbursementReportItem,
  DisbursementReportRequestPayload,
  DpdReportItem,
  DpdReportRequestPayload,
} from './report.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

function* fetchAllLoansReportSaga(
  action: PayloadAction<AllLoansReportRequestPayload>,
): Generator {
  try {
    const data: AllLoanReportItem[] = yield call(
      fetchAllLoansReportApi,
      action.payload,
    );
    yield put(fetchAllLoansReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchAllLoansReportFailure(getErrorMessage(error)));
  }
}

function* fetchDisbursementReportSaga(
  action: PayloadAction<DisbursementReportRequestPayload>,
): Generator {
  try {
    const data: DisbursementReportItem[] = yield call(
      fetchDisbursementReportApi,
      action.payload,
    );
    yield put(fetchDisbursementReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchDisbursementReportFailure(getErrorMessage(error)));
  }
}

function* fetchDpdReportSaga(
  action: PayloadAction<DpdReportRequestPayload>,
): Generator {
  try {
    const data: DpdReportItem[] = yield call(
      fetchDpdReportApi,
      action.payload,
    );
    yield put(fetchDpdReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchDpdReportFailure(getErrorMessage(error)));
  }
}

function* fetchDailyAccrualReportSaga(
  action: PayloadAction<DailyAccrualReportRequestPayload>,
): Generator {
  try {
    const data: DailyAccrualReportItem[] = yield call(
      fetchDailyAccrualReportApi,
      action.payload,
    );
    yield put(fetchDailyAccrualReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchDailyAccrualReportFailure(getErrorMessage(error)));
  }
}

function* fetchMonthlyAccrualReportSaga(
  action: PayloadAction<MonthlyAccrualReportRequestPayload>,
): Generator {
  try {
    const data: MonthlyAccrualReportItem[] = yield call(
      fetchMonthlyAccrualReportApi,
      action.payload,
    );
    yield put(fetchMonthlyAccrualReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchMonthlyAccrualReportFailure(getErrorMessage(error)));
  }
}

function* fetchRepaymentReportSaga(
  action: PayloadAction<RepaymentReportRequestPayload>,
): Generator {
  try {
    const data: RepaymentReportItem[] = yield call(
      fetchRepaymentReportApi,
      action.payload,
    );
    yield put(fetchRepaymentReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchRepaymentReportFailure(getErrorMessage(error)));
  }
}

function* fetchInvoiceOutstandingReportSaga(
  action: PayloadAction<InvoiceOutstandingReportRequestPayload>,
): Generator {
  try {
    const data: InvoiceOutstandingReportItem[] = yield call(
      fetchInvoiceOutstandingReportApi,
      action.payload,
    );
    yield put(fetchInvoiceOutstandingReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchInvoiceOutstandingReportFailure(getErrorMessage(error)));
  }
}

function* fetchLoanStatusReportSaga(
  action: PayloadAction<LoanStatusReportRequestPayload>,
): Generator {
  try {
    const data: LoanStatusReportItem[] = yield call(
      fetchLoanStatusReportApi,
      action.payload,
    );
    yield put(fetchLoanStatusReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchLoanStatusReportFailure(getErrorMessage(error)));
  }
}

function* fetchAllProductOutstandingReportSaga(
  action: PayloadAction<AllProductOutstandingReportRequestPayload>,
): Generator {
  try {
    const data: AllProductOutstandingReportItem[] = yield call(
      fetchAllProductOutstandingReportApi,
      action.payload,
    );
    yield put(fetchAllProductOutstandingReportSuccess(data));
  } catch (error: unknown) {
    yield put(
      fetchAllProductOutstandingReportFailure(getErrorMessage(error)),
    );
  }
}

function* fetchUtilizationReportSaga(
  action: PayloadAction<UtilizationReportRequestPayload>,
): Generator {
  try {
    const data: UtilizationReportItem[] = yield call(
      fetchUtilizationReportApi,
      action.payload,
    );
    yield put(fetchUtilizationReportSuccess(data));
  } catch (error: unknown) {
    yield put(fetchUtilizationReportFailure(getErrorMessage(error)));
  }
}

export function* reportSaga(): Generator {
  yield all([
    takeLatest(fetchAllLoansReportRequest.type, fetchAllLoansReportSaga),
    takeLatest(
      fetchDisbursementReportRequest.type,
      fetchDisbursementReportSaga,
    ),
    takeLatest(fetchDpdReportRequest.type, fetchDpdReportSaga),
    takeLatest(
      fetchDailyAccrualReportRequest.type,
      fetchDailyAccrualReportSaga,
    ),
    takeLatest(
      fetchMonthlyAccrualReportRequest.type,
      fetchMonthlyAccrualReportSaga,
    ),
    takeLatest(fetchRepaymentReportRequest.type, fetchRepaymentReportSaga),
    takeLatest(
      fetchInvoiceOutstandingReportRequest.type,
      fetchInvoiceOutstandingReportSaga,
    ),
    takeLatest(fetchLoanStatusReportRequest.type, fetchLoanStatusReportSaga),
    takeLatest(
      fetchAllProductOutstandingReportRequest.type,
      fetchAllProductOutstandingReportSaga,
    ),
    takeLatest(fetchUtilizationReportRequest.type, fetchUtilizationReportSaga),
  ]);
}
