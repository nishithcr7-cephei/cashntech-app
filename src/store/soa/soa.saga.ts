import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import axiosInstance from '@services/api/api';
import Endpoints from '@constants/ApiEndPoints';
import {API_URL} from '@config/config';
import {
  fetchProgramListRequest,
  fetchProgramListSuccess,
  fetchProgramListFailure,
} from './soa.slice';
import {FetchProgramListRequest} from './soa.types';

import {decryptValue} from '@utils/decrypt';
import {formatIndianNumber} from '@utils/Utils';

function* fetchProgramListWorker(action: PayloadAction<FetchProgramListRequest>): Generator<any, void, any> {
  try {
    const {page, limit, search} = action.payload;
    const url = `${API_URL}/${Endpoints.apiProgramList}`;
    const response = yield call(axiosInstance.post as any, url, {
      page,
      limit,
      search,
    }, {
      authRequired: true,
    });

    if (response.data?.statusCode === 200) {
      const rawData = response.data.data || [];
      const total = response.data.totalCount || rawData.length;

      const mappedData = rawData.map((item: any) => ({
        ...item,
        partyName: decryptValue(item.partyName || ''),
        totalSanctionedAmount: item.totalSanctionedAmount ? `₹${formatIndianNumber(item.totalSanctionedAmount)}` : '₹0.00',
        totaloutstanding: item.totaloutstanding ? `₹${formatIndianNumber(item.totaloutstanding)}` : '₹0.00',
      }));

      yield put(fetchProgramListSuccess({
        data: mappedData,
        total,
        page,
      }));
    } else {
      yield put(fetchProgramListFailure(response.data?.message || 'Failed to fetch program list'));
    }
  } catch (error: any) {
    yield put(fetchProgramListFailure(error?.message || 'Something went wrong'));
  }
}

export function* soaSaga() {
  yield takeLatest(fetchProgramListRequest.type, fetchProgramListWorker);
}
