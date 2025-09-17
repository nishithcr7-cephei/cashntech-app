import {call, put, takeLatest} from 'redux-saga/effects';
import softApi from '@services/api/soft.api';
import {Result} from '@utils/TryCatch';
import {
  getSoftSanction,
  getSoftSanctionBnkPro,
  getSoftSanctionClientList,
  getSoftSanctionFields,
  getSoftSanctionRuleset,
  setSoftSanctionBnkProList,
  setSoftSanctionClientList,
  setSoftSanctionClientListError,
  setSoftSanctionFields,
  setSoftSanctionFieldsError,
  setSoftSanctionFieldsLoading,
  setSoftSanctionList,
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

export default function* softSaga() {
  yield takeLatest(getSoftSanction.type, handleGetSoftSantion);
  yield takeLatest(getSoftSanctionBnkPro.type, handleGetSoftSantionBnkPro);
  yield takeLatest(getSoftSanctionRuleset.type, handleGetSoftSanctionRuleset);
  yield takeLatest(getSoftSanctionClientList.type, handleGetSoftSanctionClientList);
  yield takeLatest(getSoftSanctionFields.type, handleGetSoftSanctionFields);
}


