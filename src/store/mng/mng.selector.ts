import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.mng;

// Task Records Selectors
const getTaskRecordsList = createSelector(_selectState, _state => _state.taskRecordsList);
const getTaskRecordsLoading = createSelector(_selectState, _state => _state.taskRecordsLoading);
const getTaskRecordsError = createSelector(_selectState, _state => _state.taskRecordsError);

// Salesman List Selectors
const getSalesmanList = createSelector(_selectState, _state => _state.salesmanList);
const getSalesmanLoading = createSelector(_selectState, _state => _state.salesmanLoading);
const getSalesmanError = createSelector(_selectState, _state => _state.salesmanError);

// Filtered Task Records Selectors
const getFilteredTaskRecords = createSelector(_selectState, _state => _state.filteredTaskRecords);

export default {
  getTaskRecordsList,
  getTaskRecordsLoading,
  getTaskRecordsError,
  getSalesmanList,
  getSalesmanLoading,
  getSalesmanError,
  getFilteredTaskRecords,
};
