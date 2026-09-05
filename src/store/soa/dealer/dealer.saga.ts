import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import axiosInstance from '@services/api/api';
import Endpoints from '@constants/ApiEndPoints';
import {API_URL} from '@config/config';
import {
  fetchDealerListRequest,
  fetchDealerListSuccess,
  fetchDealerListFailure,
  fetchProgramSummaryRequest,
  fetchProgramSummarySuccess,
  fetchProgramSummaryFailure,
} from './dealer.slice';
import {
  FetchDealerListRequest,
  FetchProgramSummaryRequest,
  ProgramCounterPartySummary,
  ProgramSummaryAmounts,
} from './dealer.types';
import {decryptValue} from '@utils/decrypt';
import moment from 'moment';
import {formatIndianNumber} from '@utils/Utils';

function formatSummaryDate(value: unknown): string {
  if (!value) {
    return '-';
  }
  const formatted = moment(value).format('DD-MM-YYYY');
  return formatted === 'Invalid date' ? '-' : formatted;
}

function formatSummaryAmount(value: unknown): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return '₹0.00';
  }
  return `₹${formatIndianNumber(String(num))}`;
}

function mapSummaryAmounts(raw: any): ProgramSummaryAmounts {
  return {
    principal: formatSummaryAmount(raw?.principal),
    interest: formatSummaryAmount(raw?.interest),
    penalInterest: formatSummaryAmount(raw?.penal_interest),
    charges: formatSummaryAmount(raw?.charges),
    total: formatSummaryAmount(
      raw?.total_due ?? raw?.total_received ?? raw?.total,
    ),
  };
}

function* fetchDealerListWorker(
  action: PayloadAction<FetchDealerListRequest>,
): Generator<any, void, any> {
  try {
    const {programIds} = action.payload;
    const url = `${API_URL}/${Endpoints.apiProgramDealersList}`;
    const response = yield call(
      axiosInstance.post as any,
      url,
      {programIds},
      {
        authRequired: true,
      },
    );

    if (response.data?.statusCode === 200) {
      const rawData = response.data.data || [];
      const total = response.data.totalCount || rawData.length;

      const mappedData = rawData.map((item: any) => {
        const drawingPower = Number(item.drawing_power || 0);
        const utilizedAmount = Number(item.utilized_amount || 0);
        const availableLimit =
          item.available_limit != null
            ? Number(item.available_limit)
            : drawingPower - utilizedAmount;
        const sanctionLimitRaw = Number(item.sanctioned_limit || 0) || 0;
        const pipelineRequestsRaw = Number(item.pipeline_requests || 0) || 0;
        const excessCreditRaw = Number(item.excess_credit || 0) || 0;
        const totalOsAmountRaw = Number(item.total_os_amount || 0) || 0;
        const totalAmountPaidRaw = Number(item.total_amount_paid || 0) || 0;

        return {
          id: item.id || item.programDealerId,
          counterPartyName: decryptValue(item.entity_name || ''),
          odAccount: decryptValue(item.od_account_no || ''),
          odExpiryDate: item.od_expiry_date
            ? moment(item.od_expiry_date).format('DD-MM-YYYY')
            : '-',
          sanctionLimit: `₹${formatIndianNumber(String(sanctionLimitRaw))}`,
          drawingPower: `₹${formatIndianNumber(String(drawingPower))}`,
          utilizedAmount: `₹${formatIndianNumber(String(utilizedAmount))}`,
          pipelineRequests: `₹${formatIndianNumber(String(pipelineRequestsRaw))}`,
          excessCredit: `₹${formatIndianNumber(String(excessCreditRaw))}`,
          availableLimit: `₹${formatIndianNumber(String(availableLimit))}`,
          totalOsAmount: `₹${formatIndianNumber(String(totalOsAmountRaw))}`,
          totalAmountPaid: `₹${formatIndianNumber(String(totalAmountPaidRaw))}`,
          overdueDays: String(item.overdue_days ?? 0),
          status: item.status || 'N/A',
          sanctionLimitRaw,
          utilizedAmountRaw: utilizedAmount,
          pipelineRequestsRaw,
          excessCreditRaw,
          availableLimitRaw: availableLimit,
          totalOsAmountRaw,
          totalAmountPaidRaw,
        };
      });

      yield put(
        fetchDealerListSuccess({
          data: mappedData,
          total,
        }),
      );
    } else {
      yield put(
        fetchDealerListFailure(
          response.data?.message || 'Failed to fetch dealer list',
        ),
      );
    }
  } catch (error: any) {
    yield put(fetchDealerListFailure(error?.message || 'Something went wrong'));
  }
}

function* fetchProgramSummaryWorker(
  action: PayloadAction<FetchProgramSummaryRequest>,
): Generator<any, void, any> {
  try {
    const {programIds} = action.payload;
    const url = `${API_URL}/${Endpoints.apiProgramCounterPartySummary}`;
    const response = yield call(
      axiosInstance.post as any,
      url,
      {programIds},
      {
        authRequired: true,
      },
    );

    if (response.data?.statusCode === 200) {
      const raw = response.data.data || {};
      const loanDetails = raw.loanDetails || {};
      const due = raw.due || {};
      const received = raw.received || {};

      const roiPercent =
        loanDetails.roi_percent != null && loanDetails.roi_percent !== ''
          ? `${loanDetails.roi_percent}%`
          : '-';

      const summary: ProgramCounterPartySummary = {
        loanDetails: {
          anchorName: decryptValue(loanDetails.anchor_name || '') || '-',
          bankName: loanDetails.bank_name || '-',
          programApprovalDate: formatSummaryDate(loanDetails.program_approval_date),
          programExpiryDate: formatSummaryDate(loanDetails.program_expiry_date),
          status: loanDetails.status || '-',
          programLimit: formatSummaryAmount(loanDetails.program_limit),
          availableLimit: formatSummaryAmount(loanDetails.available_limit),
          roiPercent,
        },
        due: {
          ...mapSummaryAmounts(due),
          total: formatSummaryAmount(due.total_due),
        },
        received: {
          ...mapSummaryAmounts(received),
          total: formatSummaryAmount(received.total_received),
        },
      };

      yield put(fetchProgramSummarySuccess(summary));
    } else {
      yield put(
        fetchProgramSummaryFailure(
          response.data?.message || 'Failed to fetch program summary',
        ),
      );
    }
  } catch (error: any) {
    yield put(
      fetchProgramSummaryFailure(error?.message || 'Something went wrong'),
    );
  }
}

export function* dealerSaga() {
  yield takeLatest(fetchDealerListRequest.type, fetchDealerListWorker);
  yield takeLatest(fetchProgramSummaryRequest.type, fetchProgramSummaryWorker);
}
