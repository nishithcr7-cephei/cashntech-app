import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import axiosInstance from '@services/api/api';
import Endpoints from '@constants/ApiEndPoints';
import {selectOptionalProductId} from '@store/product/productContext.saga';
import {
  fetchRepaymentListRequest,
  fetchRepaymentListSuccess,
  fetchRepaymentListFailure,
} from './repayment.slice';
import {FetchRepaymentListRequest} from './repayment.types';

function* fetchRepaymentListWorker(action: PayloadAction<FetchRepaymentListRequest>): Generator<any, void, any> {
  try {
    const productId: string | null =
      action.payload.productId ?? (yield call(selectOptionalProductId));
    const body: FetchRepaymentListRequest = {...action.payload};
    if (productId) {
      body.productId = productId;
    } else {
      delete body.productId;
    }

    const response = yield call(axiosInstance.post as any, Endpoints.apiRepaymentList, body, {
      authRequired: true,
    });
    if (response.data?.statusCode === 200) {
      yield put(fetchRepaymentListSuccess(response.data.data || []));
    } else {
      yield put(fetchRepaymentListFailure(response.data?.message || 'Failed to fetch repayment list'));
    }
  } catch (error: any) {
    yield put(fetchRepaymentListFailure(error?.message || 'Something went wrong'));
  }
}

export function* repaymentSaga() {
  yield takeLatest(fetchRepaymentListRequest.type, fetchRepaymentListWorker);
}
