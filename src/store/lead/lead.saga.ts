import {call, put, takeEvery} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {
  getLead,
  setLeadList,
  getLeadDesciption,
  getLeadProgressDetails,
  setLeadProgressDetails,
  setLeadProgressDetailsError,
} from './lead.slice';
import leadApi from '@services/api/lead.api';
import {PayloadWithCallback} from '@type/global.types';

function* getLeadSaga() {
  try {
    console.log('LeadSaga: getLeadSaga started');
    const {data, error} = yield call(leadApi.getLeadProgress);
    
    if (error) {
      console.log('LeadSaga: getLeadSaga error:', error);
      yield put(setLeadList([]));
    } else {
      console.log('LeadSaga: getLeadSaga success, data length:', data?.data?.length || 0);
      yield put(setLeadList(data?.data || []));
    }
  } catch (error) {
    console.log('LeadSaga: getLeadSaga catch error:', error);
    yield put(setLeadList([]));
  }
}

function* getLeadDescriptionSaga(
  action: PayloadAction<PayloadWithCallback<string, [Array<any>]>>,
) {
  try {
    const {payload} = action;
    const {data, error} = yield call(leadApi.getLeadDesProgress, payload.payload);
    
    if (error) {
      console.log('LeadSaga: getLeadDescriptionSaga error:', error);
      payload.callbackSuccess?.([]);
    } else {
      console.log('LeadSaga: getLeadDescriptionSaga success');
      payload.callbackSuccess?.(data?.data || []);
    }
  } catch (error) {
    console.log('LeadSaga: getLeadDescriptionSaga catch error:', error);
    action.payload.callbackSuccess?.([]);
  }
}

function* getLeadProgressDetailsSaga(action: PayloadAction<number>) {
  try {
    const {data, error} = yield call(leadApi.getLeadDesProgress, action.payload.toString());
    
    if (error) {
      console.log('LeadSaga: getLeadProgressDetailsSaga error:', error);
      yield put(setLeadProgressDetailsError(error.message || 'Failed to fetch lead progress details'));
    } else {
      console.log('LeadSaga: getLeadProgressDetailsSaga success');
      yield put(setLeadProgressDetails(data?.data || []));
    }
  } catch (error) {
    console.log('LeadSaga: getLeadProgressDetailsSaga catch error:', error);
    yield put(setLeadProgressDetailsError('Failed to fetch lead progress details'));
  }
}

export function* leadSaga() {
  yield takeEvery(getLead.type, getLeadSaga);
  yield takeEvery(getLeadDesciption.type, getLeadDescriptionSaga);
  yield takeEvery(getLeadProgressDetails.type, getLeadProgressDetailsSaga);
}
