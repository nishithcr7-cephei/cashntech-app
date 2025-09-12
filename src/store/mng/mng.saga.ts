import {call, put, takeLatest} from 'redux-saga/effects';
import {PayloadAction} from '@reduxjs/toolkit';
import {Result} from '@utils/TryCatch';
import mngApi from '@services/api/mg.api.ts';
import * as mngActions from './mng.slice';
import {
  TaskRecordsListPayload,
  TaskRecordsListResponse,
  SalesmanListResponse,
} from './mng.types';

function* handleGetTaskRecordsList(action: PayloadAction<TaskRecordsListPayload>): Generator<any, void, any> {
  try {
    console.log('Saga: handleGetTaskRecordsList called with payload:', action.payload);
    
    const {data, error}: Result<TaskRecordsListResponse> = yield call(
      mngApi.getTaskRecordsList,
      action.payload,
    );
    
    console.log('Saga: Task records API response:', {
      hasData: !!data,
      hasError: !!error,
      dataLength: data?.data?.length || 0,
    });

    if (!error && data) {
      console.log('Saga: Setting task records list with data length:', data.data?.length || 0);
      yield put(mngActions.setTaskRecordsList({taskRecords: data.data}));
    } else {
      console.log('Saga: Setting empty task records list due to error or no data');
      yield put(mngActions.setTaskRecordsList({taskRecords: []}));
    }
  } catch (error) {
    console.log('Saga: Error fetching task records:', error);
    yield put(mngActions.setTaskRecordsError({error: 'Failed to fetch task records'}));
  }
}

function* handleGetSalesmanList(): Generator<any, void, any> {
  try {
    console.log('Saga: handleGetSalesmanList called');
    
    const {data, error}: Result<SalesmanListResponse> = yield call(mngApi.getSalesmanList);
    
    console.log('Saga: Salesman API response:', {
      hasData: !!data,
      hasError: !!error,
      dataLength: data?.data?.length || 0,
    });

    if (!error && data) {
      console.log('Saga: Setting salesman list with data length:', data.data?.length || 0);
      yield put(mngActions.setSalesmanList({salesmanList: data.data}));
    } else {
      console.log('Saga: Setting empty salesman list due to error or no data');
      yield put(mngActions.setSalesmanList({salesmanList: []}));
    }
  } catch (error) {
    console.log('Saga: Error fetching salesman list:', error);
    yield put(mngActions.setSalesmanError({error: 'Failed to fetch salesman list'}));
  }
}

export default function* mngSaga() {
  yield takeLatest(mngActions.getTaskRecordsList.type, handleGetTaskRecordsList);
  yield takeLatest(mngActions.getSalesmanList.type, handleGetSalesmanList);
}
