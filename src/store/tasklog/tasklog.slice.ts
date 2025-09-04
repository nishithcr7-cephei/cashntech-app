import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  ITaskLogState,
  IRemarkReportResponseDatum,
  ITaskHistoryResponseDatum,
  ITaskUpdateRequest,
} from './tasklog.types';

const initialState: ITaskLogState = {
  reportList: [],
  reportLoader: false,
  TaskHistoryLoader: false,
  TaskHistoryList: [],
  taskUpdateLoader: false,
  taskUpdateSuccess: undefined,
  taskUpdateError: undefined,
  userTaskHistoryLoader: false,
  userTaskHistoryList: [],
  userTaskHistoryError: undefined,
};

const tasklogSlice = createSlice({
  name: 'tasklog',
  initialState,
  reducers: {
    getReport: state => {
      state.reportLoader = true;
    },
    setReportList: (
      state,
      action: PayloadAction<IRemarkReportResponseDatum[]>,
    ) => {
      state.reportLoader = false;
      state.reportList = action.payload;
    },
    resetReportList: state => {
      state.reportList = [];
      state.reportLoader = false;
    },
    getTaskHistory: state => {
      state.TaskHistoryLoader = true;
    },
    setTaskHistoryList: (
      state,
      action: PayloadAction<ITaskHistoryResponseDatum[]>,
    ) => {
      state.TaskHistoryLoader = false;
      state.TaskHistoryList = action.payload;
    },
    resetTaskHistoryList: state => {
      state.TaskHistoryList = [];
      state.TaskHistoryLoader = false;
    },
    updateTask: (state, action: PayloadAction<{taskId: string; data: ITaskUpdateRequest}>) => {
      // This action will be handled by saga
    },
    setTaskUpdateLoader: (state, action: PayloadAction<boolean>) => {
      state.taskUpdateLoader = action.payload;
    },
    setTaskUpdateSuccess: (state, action: PayloadAction<string>) => {
      state.taskUpdateSuccess = action.payload;
    },
    setTaskUpdateError: (state, action: PayloadAction<string>) => {
      state.taskUpdateError = action.payload;
    },
    getUserTaskHistory: (state, action: PayloadAction<string>) => {
      state.userTaskHistoryLoader = true;
      state.userTaskHistoryError = undefined;
    },
    setUserTaskHistoryLoader: (state, action: PayloadAction<boolean>) => {
      state.userTaskHistoryLoader = action.payload;
    },
    setUserTaskHistoryList: (state, action: PayloadAction<Array<any>>) => {
      state.userTaskHistoryLoader = false;
      state.userTaskHistoryList = action.payload;
      state.userTaskHistoryError = undefined;
    },
    setUserTaskHistoryError: (state, action: PayloadAction<string>) => {
      state.userTaskHistoryLoader = false;
      state.userTaskHistoryError = action.payload;
    },
    resetUserTaskHistory: (state) => {
      state.userTaskHistoryList = [];
      state.userTaskHistoryLoader = false;
      state.userTaskHistoryError = undefined;
    },
  },
});

export const {
  getReport,
  setReportList,
  resetReportList,
  getTaskHistory,
  setTaskHistoryList,
  resetTaskHistoryList,
  updateTask,
  setTaskUpdateLoader,
  setTaskUpdateSuccess,
  setTaskUpdateError,
  getUserTaskHistory,
  setUserTaskHistoryLoader,
  setUserTaskHistoryList,
  setUserTaskHistoryError,
  resetUserTaskHistory,
} = tasklogSlice.actions;

export default tasklogSlice.reducer;
