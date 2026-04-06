import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import axiosInstance from '@services/api/api';
import Endpoints from '@constants/ApiEndPoints';
import {API_URL} from '@config/config';
import {
  fetchDealerListRequest,
  fetchDealerListSuccess,
  fetchDealerListFailure,
} from './dealer.slice';
import {FetchDealerListRequest, DealerListItem} from './dealer.types';
import {decryptValue} from '@utils/decrypt';
import moment from 'moment';
import {formatIndianNumber} from '@utils/Utils';

function* fetchDealerListWorker(action: PayloadAction<FetchDealerListRequest>): Generator<any, void, any> {
  try {
    const {programIds} = action.payload;
    const url = `${API_URL}/${Endpoints.apiProgramDealersList}`;
    const response = yield call(axiosInstance.post as any, url, {
      programIds,
    }, {
      authRequired: true,
    });

    if (response.data?.statusCode === 200) {
      const rawData = response.data.data || [];
      const total = response.data.totalCount || rawData.length;

      // Data Transformation: Mapper
      const mappedData: DealerListItem[] = rawData.map((item: any) => ({
        id: item.id || item.programDealerId,
        counterPartyName: decryptValue(item.entity_name || ''), 
        odAccount: decryptValue(item.od_account_no || ''),
        odExpiryDate: item.od_expiry_date ? moment(item.od_expiry_date).format('DD-MM-YYYY') : '-',
        sanctionLimit: item.sanctioned_limit ? `₹${formatIndianNumber(item.sanctioned_limit)}` : '₹0.00',
        drawingPower: item.drawing_power ? `₹${formatIndianNumber(item.drawing_power)}` : '₹0.00',
        utilizedLimit: item.utilized_amount ? `₹${formatIndianNumber(item.utilized_amount)}` : '₹0.00',
        pipelineRequests: item.pipeline_requests ? `₹${formatIndianNumber(item.pipeline_requests)}` : '₹0.00',
        excessCredit: item.excess_credit ? `₹${formatIndianNumber(item.excess_credit)}` : '₹0.00',
        availableLimit: item.available_limit ? `₹${formatIndianNumber(item.available_limit)}` : '₹0.00',
        overdueDays: `${item.overdue_days || '0'} Days`,
        status: item.status || 'N/A',
      }));

      yield put(fetchDealerListSuccess({
        data: mappedData,
        total,
      }));
    } else {
      yield put(fetchDealerListFailure(response.data?.message || 'Failed to fetch dealer list'));
    }
  } catch (error: any) {
    yield put(fetchDealerListFailure(error?.message || 'Something went wrong'));
  }
}

export function* dealerSaga() {
  yield takeLatest(fetchDealerListRequest.type, fetchDealerListWorker);
}
