import {all, call, put, select, takeLatest, takeLeading} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {riskDashboardApi} from '@services/api/riskDashboard.api';
import {invoiceApi} from '@services/api/invoice.api';
import {normalizeBankOptions} from '@utils/normalizeRiskDashboard';
import {
  applyAlertFilters,
  clearAlertFilters,
  fetchAlertDispatchesFailure,
  fetchAlertDispatchesRequest,
  fetchAlertDispatchesSuccess,
  fetchAlertFilterOptionsFailure,
  fetchAlertFilterOptionsRequest,
  fetchAlertFilterOptionsSuccess,
  fetchBankRiskDetailFailure,
  fetchBankRiskDetailRequest,
  fetchBankRiskDetailSuccess,
  fetchBorrowerRiskFailure,
  fetchBorrowerRiskRequest,
  fetchBorrowerRiskSuccess,
  fetchEcosystemRiskFailure,
  fetchEcosystemRiskRequest,
  fetchEcosystemRiskSuccess,
  fetchPartyRiskProfileFailure,
  fetchPartyRiskProfileRequest,
  fetchPartyRiskProfileSuccess,
} from './riskDashboard.slice';
import {selectAlertFilters} from './riskDashboard.selector';
import type {AlertDispatchFilters} from './riskDashboard.types';

export function riskErrorMessage(error: any, fallback: string): string {
  const raw = error?.response?.data?.message;
  if (Array.isArray(raw) && raw.length) {
    return raw.filter(Boolean).join('\n');
  }
  if (typeof raw === 'string' && raw) {
    return raw;
  }
  return error?.message || fallback;
}

function* ecosystemWorker(): Generator<any, void, any> {
  try {
    const data = yield call(riskDashboardApi.getEcosystemRisk);
    yield put(fetchEcosystemRiskSuccess(data));
  } catch (error: any) {
    yield put(
      fetchEcosystemRiskFailure(
        riskErrorMessage(error, 'Failed to fetch ecosystem risk profile'),
      ),
    );
  }
}

function* bankDetailWorker(
  action: PayloadAction<{bankId: string}>,
): Generator<any, void, any> {
  try {
    const data = yield call(riskDashboardApi.getBankRiskDetail, action.payload.bankId);
    yield put(fetchBankRiskDetailSuccess(data));
  } catch (error: any) {
    yield put(
      fetchBankRiskDetailFailure(
        riskErrorMessage(error, 'Failed to fetch bank risk detail'),
      ),
    );
  }
}

function* partyProfileWorker(
  action: PayloadAction<{partyId: string}>,
): Generator<any, void, any> {
  try {
    const data = yield call(
      riskDashboardApi.getPartyRiskProfile,
      action.payload.partyId,
    );
    yield put(fetchPartyRiskProfileSuccess(data));
  } catch (error: any) {
    yield put(
      fetchPartyRiskProfileFailure(
        riskErrorMessage(error, 'Failed to fetch party risk profile'),
      ),
    );
  }
}

function* alertsWorker(): Generator<any, void, any> {
  try {
    const filters: AlertDispatchFilters = yield select(selectAlertFilters);
    const rows = yield call(riskDashboardApi.getAlertDispatches, filters);
    yield put(fetchAlertDispatchesSuccess(rows));
  } catch (error: any) {
    yield put(
      fetchAlertDispatchesFailure(riskErrorMessage(error, 'Failed to fetch alerts')),
    );
  }
}

/** Apply / Clear → exactly one list call. */
function* alertFiltersChangedWorker(): Generator<any, void, any> {
  yield put(fetchAlertDispatchesRequest());
}

function* filterOptionsWorker(): Generator<any, void, any> {
  try {
    const [bankBody, programs] = yield all([
      call(invoiceApi.getBankProductList),
      call(riskDashboardApi.getProgramDropdown),
    ]);
    yield put(
      fetchAlertFilterOptionsSuccess({
        banks: normalizeBankOptions(bankBody?.data),
        programs,
      }),
    );
  } catch (error: any) {
    yield put(
      fetchAlertFilterOptionsFailure(
        riskErrorMessage(error, 'Failed to load filter options'),
      ),
    );
  }
}

function* borrowersWorker(): Generator<any, void, any> {
  try {
    const rows = yield call(riskDashboardApi.getBorrowerRisk);
    yield put(fetchBorrowerRiskSuccess(rows));
  } catch (error: any) {
    yield put(
      fetchBorrowerRiskFailure(
        riskErrorMessage(error, 'Failed to fetch borrower risk dashboard'),
      ),
    );
  }
}

export function* riskDashboardSaga() {
  yield takeLatest(fetchEcosystemRiskRequest.type, ecosystemWorker);
  yield takeLatest(fetchBankRiskDetailRequest.type, bankDetailWorker);
  yield takeLatest(fetchPartyRiskProfileRequest.type, partyProfileWorker);
  yield takeLatest(fetchAlertDispatchesRequest.type, alertsWorker);
  yield takeLatest(
    [applyAlertFilters.type, clearAlertFilters.type],
    alertFiltersChangedWorker,
  );
  yield takeLeading(fetchAlertFilterOptionsRequest.type, filterOptionsWorker);
  yield takeLatest(fetchBorrowerRiskRequest.type, borrowersWorker);
}
