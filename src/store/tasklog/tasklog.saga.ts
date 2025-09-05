import {call, put, takeLatest} from 'redux-saga/effects';
import {Result} from '@utils/TryCatch';
import clientApi from '@services/api/client.api';
import taskApi from '@services/api/task.api';
import {
  IRemarkReportResponse,
  ITaskHistoryResponse,
  ITaskUpdateResponse,
  IUserTaskHistoryResponse,
} from './tasklog.types';
import * as tasklogActions from './tasklog.slice';

function* handleGetRemarkReport(): unknown {
  const {data, error}: Result<IRemarkReportResponse> = yield call(
    clientApi.getRemarkReport,
  );
  if (!error) {
    yield put(tasklogActions.setReportList(data.data));
  } else {
    yield put(tasklogActions.setReportList([]));
  }
}

function* handleGetTaskHistory(): unknown {
  const {data, error}: Result<ITaskHistoryResponse> = yield call(
    taskApi.getTaskHistory,
  );
  if (!error) {
    yield put(tasklogActions.setTaskHistoryList(data.data));
  } else {
    yield put(tasklogActions.setTaskHistoryList([]));
  }
}

function* handleUpdateTask(action: any): unknown {
  yield put(tasklogActions.setTaskUpdateLoader(true));
  const {taskId, data} = action.payload;
  
  const {data: responseData, error}: Result<ITaskUpdateResponse> = yield call(
    taskApi.taskUpdate,
    taskId,
    data,
  );
  
  yield put(tasklogActions.setTaskUpdateLoader(false));
  
  if (!error && responseData) {
    yield put(tasklogActions.setTaskUpdateSuccess(responseData.message));
  } else {
    const errorMessage = (error as any)?.response?.data?.message || error?.message || 'Failed to update task';
    yield put(tasklogActions.setTaskUpdateError(errorMessage));
  }
}

function* handleGetUserTaskHistory(action: any): unknown {
  yield put(tasklogActions.setUserTaskHistoryLoader(true));
  const userName = action.payload;
  
  const {data, error}: Result<IUserTaskHistoryResponse> = yield call(
    taskApi.getTaskHistory,
    userName,
  );
  
  if (!error && data) {
    const taskList = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];
    yield put(tasklogActions.setUserTaskHistoryList(taskList));
  } else {
    const errorMessage = error?.message || 'Failed to fetch user task history';
    yield put(tasklogActions.setUserTaskHistoryError(errorMessage));
  }
}

export default function* tasklogSaga() {
  yield takeLatest(tasklogActions.getReport.type, handleGetRemarkReport);
  yield takeLatest(tasklogActions.getTaskHistory.type, handleGetTaskHistory);
  yield takeLatest(tasklogActions.updateTask.type, handleUpdateTask);
  yield takeLatest(tasklogActions.getUserTaskHistory.type, handleGetUserTaskHistory);
}
