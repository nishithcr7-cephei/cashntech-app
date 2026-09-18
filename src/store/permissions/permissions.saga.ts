import {call, put, select, takeLatest} from 'redux-saga/effects';
import {
  fetchPermissionsRequest,
  fetchPermissionsSuccess,
  fetchPermissionsFailure,
} from './permissions.slice';
import {userPermissionsApi} from '@services/api/userPermissions.api';
import {userSelector} from '@store/user';
import {isEffectivePermissions} from './permissions.types';

function* fetchPermissionsSaga() {
  try {
    const isClient = (yield select(userSelector.getIsClient)) ?? true;
    const groupId = yield select(userSelector.getPrimaryPermissionGroupId);

    if (groupId == null) {
      yield put(fetchPermissionsSuccess(null));
      return;
    }

    const response = yield call(
      userPermissionsApi.getUserPermissions,
      isClient,
      groupId,
    );
    const permissions = response?.data?.permissions;

    yield put(
      fetchPermissionsSuccess(
        isEffectivePermissions(permissions) ? permissions : null,
      ),
    );
  } catch (error: any) {
    const msg =
      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'
        ? 'Network error. Check connection.'
        : error?.message || 'Failed to load permissions';
    yield put(fetchPermissionsFailure(msg));
  }
}

export default function* permissionsSaga() {
  yield takeLatest(fetchPermissionsRequest.type, fetchPermissionsSaga);
}
