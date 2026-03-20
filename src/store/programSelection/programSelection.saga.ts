import {call, put, select, takeLatest} from 'redux-saga/effects';
import {
  fetchUserScopeRequest,
  fetchUserScopeSuccess,
  fetchUserScopeFailure,
} from './programSelection.slice';
import {fetchPermissionsRequest} from '@store/permissions';
import {
  userScopeApi,
  mapUserScopeToBanks,
} from '@services/api/userScope.api';
import {userSelector} from '@store/user';

function* fetchUserScopeSaga() {
  try {
    const isClient = (yield select(userSelector.getIsClient)) ?? true;
    const response = yield call(userScopeApi.getUserScope, isClient);
    const data = response?.data;

    if (Array.isArray(data) && data.length > 0) {
      const banks = mapUserScopeToBanks(data);
      yield put(fetchUserScopeSuccess(banks));
      yield put(fetchPermissionsRequest());
    } else {
      yield put(
        fetchUserScopeFailure(response?.message || 'No programs available'),
      );
    }
  } catch (error: any) {
    const msg =
      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : error?.message || 'Failed to load programs';
    yield put(fetchUserScopeFailure(msg));
  }
}

export default function* programSelectionSaga() {
  yield takeLatest(fetchUserScopeRequest.type, fetchUserScopeSaga);
}
