import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.tasklog;

const getRemarkReport = createSelector(
  _selectState,
  _state => _state.reportList,
);

const getTaskHistory = createSelector(
  _selectState,
  _state => _state.TaskHistoryList,
);

const getReportLoader = createSelector(
  _selectState,
  _state => _state.reportLoader,
);

const getTaskHistoryLoader = createSelector(
  _selectState,
  _state => _state.TaskHistoryLoader,
);

const getTaskUpdateLoader = createSelector(
  _selectState,
  _state => _state.taskUpdateLoader,
);

const getTaskUpdateSuccess = createSelector(
  _selectState,
  _state => _state.taskUpdateSuccess,
);

const getTaskUpdateError = createSelector(
  _selectState,
  _state => _state.taskUpdateError,
);

const getUserTaskHistoryLoader = createSelector(
  _selectState,
  _state => _state.userTaskHistoryLoader,
);

const getUserTaskHistoryList = createSelector(
  _selectState,
  _state => _state.userTaskHistoryList,
);

const getUserTaskHistoryError = createSelector(
  _selectState,
  _state => _state.userTaskHistoryError,
);

export const tasklogSelector = {
  getRemarkReport,
  getTaskHistory,
  getReportLoader,
  getTaskHistoryLoader,
  getTaskUpdateLoader,
  getTaskUpdateSuccess,
  getTaskUpdateError,
  getUserTaskHistoryLoader,
  getUserTaskHistoryList,
  getUserTaskHistoryError,
};
