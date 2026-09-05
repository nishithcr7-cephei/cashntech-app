import {call, put, select, takeLatest} from 'redux-saga/effects';
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
import {selectOptionalProductId} from '@store/product/productContext.saga';
import {selectActiveProductId} from '@store/product/product.selectors';
import {decryptValue} from '@utils/decrypt';
import {formatIndianNumber} from '@utils/Utils';

function* fetchProgramListWorker(action: PayloadAction<FetchProgramListRequest>): Generator<any, void, any> {
  try {
    const productId: string | null =
      action.payload.productId ??
      (yield call(selectOptionalProductId)) ??
      (yield select(selectActiveProductId));

    const url = `${API_URL}/${Endpoints.apiProgramList}`;
    const body: {productId?: string} = {};
    if (productId) {
      body.productId = productId;
    }

    const response = yield call(axiosInstance.post as any, url, body, {
      authRequired: true,
    });

    if (response.data?.statusCode === 200) {
      const rawData = response.data.data || [];

      const mappedData = rawData.map((item: any) => {
        // Format createdAt to "02 Apr 2026" format
        let formattedDate = '';
        if (item.createdAt) {
          const date = new Date(item.createdAt);
          if (!isNaN(date.getTime())) {
            const days = String(date.getDate()).padStart(2, '0');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            formattedDate = `${days} ${month} ${year}`;
          }
        }

        const sanctionRaw = Number(item.totalSanctionedAmount ?? 0) || 0;
        const utilizedRaw = Number(item.utilizedAmount ?? 0) || 0;
        const outstandingRaw = Number(
          item.totalOutstanding ?? item.totaloutstanding ?? 0,
        ) || 0;
        // Web SOA: Available = Sanction − Utilized (not Outstanding)
        const availableRaw = Math.max(0, sanctionRaw - utilizedRaw);

        const formatInr = (n: number) =>
          `₹${formatIndianNumber(String(n))}`;

        return {
          ...item,
          partyName: decryptValue(item.partyName || ''),
          totalSanctionedAmount: formatInr(sanctionRaw),
          utilizedAmount: formatInr(utilizedRaw),
          totalAvailableLimit: formatInr(availableRaw),
          totalOutstanding: formatInr(outstandingRaw),
          createdAt: formattedDate,
        };
      });

      yield put(fetchProgramListSuccess({
        data: mappedData,
        total: mappedData.length,
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
