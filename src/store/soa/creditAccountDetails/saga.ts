import {call, put, takeLatest, all} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {soaDetailsApi} from '@services/api/soa_details.api';
import {
  fetchCreditAccountDetailsRequest,
  fetchCreditAccountDetailsSuccess,
  fetchCreditAccountDetailsFailure,
} from './slice';

function* fetchCreditAccountDetailsSaga(action: PayloadAction<{id: string; programId: string}>): Generator<any, void, any> {
  try {
    const {id, programId} = action.payload;
    // Sequential might be safer if backend has session constraints, 
    // but all() is faster and was requested implicitly by "trigger the following two POST requests".
    const [summary, dealers, transactions, openRes, closedRes, repaymentRes] = yield all([
      call(soaDetailsApi.getProgramSummary, programId),
      call(soaDetailsApi.getDealersDetails, id),
      call(soaDetailsApi.getTransactionDetails, id),
      call(soaDetailsApi.getOpenInvoices, id),
      call(soaDetailsApi.getClosedInvoices, id),
      call(soaDetailsApi.getRepayments, id),
    ]);
    
    // Typecast to handle results
    const openResult = (openRes as any);
    const closedResult = (closedRes as any);
    const repaymentResult = (repaymentRes as any);

    yield put(fetchCreditAccountDetailsSuccess({
      summary: summary as any, 
      dealers: dealers as any, 
      transactions: transactions as any,
      openInvoices: openResult?.invoices || [],
      closedInvoices: closedResult?.invoices || [],
      repayments: repaymentResult?.repayments || [],
      openMessage: openResult?.message,
      closedMessage: closedResult?.message,
      repaymentMessage: repaymentResult?.message,
    }));
  } catch (error: any) {
    yield put(fetchCreditAccountDetailsFailure(error?.message || 'Failed to fetch credit account details'));
  }
}

export function* creditAccountDetailsSaga(): Generator<any, void, any> {
  yield takeLatest(fetchCreditAccountDetailsRequest.type, fetchCreditAccountDetailsSaga);
}
