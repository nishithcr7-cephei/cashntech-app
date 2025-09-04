import {call, put, takeLatest} from 'redux-saga/effects';
import {Result} from '@utils/TryCatch';
import clientApi from '@services/api/client.api';
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
    clientApi.getTaskHistory,
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
  
  // Console logs for debugging
  console.log('TaskUpdate: API URL:', `/client-info-master/${taskId}/task-update`);
  console.log('TaskUpdate: Request Body:', JSON.stringify(data, null, 2));
  
  const {data: responseData, error}: Result<ITaskUpdateResponse> = yield call(
    clientApi.taskUpdate,
    taskId,
    data,
  );
  
  // Console log for response
  console.log('TaskUpdate: API Response:', JSON.stringify(responseData, null, 2));
  console.log('TaskUpdate: API Error:', error);
  
  // Log detailed error information
  if (error) {
    console.log('TaskUpdate: Error Details:', {
      message: error.message,
      response: (error as any)?.response?.data,
      status: (error as any)?.response?.status,
    });
  }
  
  yield put(tasklogActions.setTaskUpdateLoader(false));
  
  if (!error && responseData) {
    yield put(tasklogActions.setTaskUpdateSuccess(responseData.message));
  } else {
    // Use the detailed error message from the server response
    const errorMessage = (error as any)?.response?.data?.message || error?.message || 'Failed to update task';
    console.log('TaskUpdate: Final Error Message:', errorMessage);
    yield put(tasklogActions.setTaskUpdateError(errorMessage));
  }
}

function* handleGetUserTaskHistory(action: any): unknown {
  yield put(tasklogActions.setUserTaskHistoryLoader(true));
  const userName = action.payload;
  
  // Console logs for debugging
  console.log('=== USER TASK HISTORY SAGA ===');
  console.log('UserTaskHistory: UserName:', userName);
  console.log('UserTaskHistory: UserName Type:', typeof userName);
  console.log('UserTaskHistory: UserName Characters:', userName.split('').map(c => `'${c}'`).join(', '));
  console.log('UserTaskHistory: Relative API URL:', `/client-info-master/${userName}/tasks`);
  console.log('UserTaskHistory: Full API URL Being Called:', `https://losapiuat.cashntech.com/client-info-master/${userName}/tasks`);
  console.log('UserTaskHistory: URL with encodeURIComponent:', `https://losapiuat.cashntech.com/client-info-master/${encodeURIComponent(userName)}/tasks`);
  console.log('UserTaskHistory: Calling clientApi.getTaskHistory with userName:', userName);
  
  const {data, error}: Result<IUserTaskHistoryResponse> = yield call(
    clientApi.getTaskHistory,
    userName,
  );
  
  // Console log for response
  console.log('UserTaskHistory: API Response:', JSON.stringify(data, null, 2));
  console.log('UserTaskHistory: API Error:', error);
  console.log('=== END USER TASK HISTORY SAGA ===');
  
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
