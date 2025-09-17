import {call, put, takeLatest} from 'redux-saga/effects';
import softApi from '@services/api/soft.api';
import {Result} from '@utils/TryCatch';
import {storage} from '@services/localStorage';
import {Config} from '@config/index';
import StorageKeys from '@constants/StorageKeys';
import {
  getSoftSanction,
  getSoftSanctionBnkPro,
  getSoftSanctionClientList,
  getSoftSanctionFields,
  getSoftSanctionResult,
  getSoftSanctionRuleset,
  runSoftSanction,
  setSoftSanctionBnkProList,
  setSoftSanctionClientList,
  setSoftSanctionClientListError,
  setSoftSanctionFields,
  setSoftSanctionFieldsError,
  setSoftSanctionFieldsLoading,
  setSoftSanctionList,
  setSoftSanctionResult,
  setSoftSanctionResultError,
  setSoftSanctionRuleset,
  setSoftSanctionRulesetError,
} from './soft.slice';

function* handleGetSoftSantion(): Generator<any, void, any> {
  const {data, error}: {data: any; error: any} = yield call(
    softApi.getSoftSanction as any,
  );
  if (!error) {
    yield put(setSoftSanctionList(data.data || []));
  } else {
    yield put(setSoftSanctionList([]));
  }
}

function* handleGetSoftSantionBnkPro(action: any): Generator<any, void, any> {
  const {bank, product} = action.payload;
  const {data, error}: {data: any; error: any} = yield call(
    (softApi as any).getSoftSanctionProductBank,
    bank,
    product,
  );
  if (!error) {
    yield put(setSoftSanctionBnkProList(data?.data || []));
  } else {
    yield put(setSoftSanctionBnkProList([]));
  }
}

function* handleGetSoftSanctionRuleset(action: any): Generator<any, void, any> {
  const {bank, product, method} = action.payload;
  const {data, error}: Result<any> = yield call(
    softApi.getSoftSanctionRuleset,
    bank,
    product,
    method,
  );
  if (!error) {
    yield put(setSoftSanctionRuleset(data || []));
  } else {
    yield put(setSoftSanctionRulesetError('Failed to fetch ruleset'));
  }
}

function* handleGetSoftSanctionClientList(): Generator<any, void, any> {
  const {data, error}: Result<any> = yield call(
    softApi.getSoftSanctionClientList,
  );
  if (!error) {
    yield put(setSoftSanctionClientList(data || []));
  } else {
    yield put(setSoftSanctionClientListError('Failed to fetch client list'));
  }
}

function* handleGetSoftSanctionFields(action: any): Generator<any, void, any> {
  yield put(setSoftSanctionFieldsLoading());
  const {bankName, productName, methodName} = action.payload;
  const {data, error}: Result<any> = yield call(
    softApi.getSoftSanctionFields,
    bankName,
    productName,
    methodName,
  );
  if (!error) {
    const fieldsArray = data?.data || data;
    if (Array.isArray(fieldsArray)) {
      const grouped: Record<string, any[]> = {};
      fieldsArray.forEach((item: any) => {
        if (!grouped[item.method_name]) grouped[item.method_name] = [];
        if (item.method_name === 'Turnover' && item.label === 'Monthly Turnover') {
          return;
        }
        grouped[item.method_name].push(item);
      });
      yield put(setSoftSanctionFields(grouped));
    } else {
      yield put(setSoftSanctionFieldsError('No fields found'));
    }
  } else {
    yield put(setSoftSanctionFieldsError('Failed to fetch fields'));
  }
}

function* handleRunSoftSanction(action: any): Generator<any, void, any> {
  try {
    const {url, payload} = action.payload;
    
    // Get token from storage
    
    const token = storage.getString(StorageKeys.TOKEN);
    
    const response = yield call(fetch, url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Device-Type': 'mobile',
      },
      body: JSON.stringify(payload),
    });

    const result = yield call([response, 'json']);
    
    yield put(setSoftSanctionResult(result));
  } catch (error: any) {
    yield put(setSoftSanctionResultError(error.message || 'Failed to run soft sanction'));
  }
}

function* handleGetSoftSanctionResult(action: any): Generator<any, void, any> {
  try {
    const {clientId, method, bank} = action.payload;
    
    const {data, error}: Result<any> = yield call(
      softApi.softSanctionResult,
      clientId,
      method,
      bank,
    );
    
    if (!error && data) {
      yield put(setSoftSanctionResult(data));
    } else {
      yield put(setSoftSanctionResultError(error?.message || 'Failed to fetch soft sanction result'));
    }
  } catch (error: any) {
    yield put(setSoftSanctionResultError(error.message || 'Failed to fetch soft sanction result'));
  }
}

export default function* softSaga() {
  yield takeLatest(getSoftSanction.type, handleGetSoftSantion);
  yield takeLatest(getSoftSanctionBnkPro.type, handleGetSoftSantionBnkPro);
  yield takeLatest(getSoftSanctionRuleset.type, handleGetSoftSanctionRuleset);
  yield takeLatest(getSoftSanctionClientList.type, handleGetSoftSanctionClientList);
  yield takeLatest(getSoftSanctionFields.type, handleGetSoftSanctionFields);
  yield takeLatest(runSoftSanction.type, handleRunSoftSanction);
  yield takeLatest(getSoftSanctionResult.type, handleGetSoftSanctionResult);
}
