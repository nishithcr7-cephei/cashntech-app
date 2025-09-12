import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  MngState,
  SetTaskRecordsListPayload,
  SetSalesmanListPayload,
  SetFilteredTaskRecordsPayload,
  SetErrorPayload,
  TaskRecordsListPayload,
} from './mng.types';

const initialState: MngState = {
  // Task Records
  taskRecordsLoading: false,
  taskRecordsList: [],
  taskRecordsError: null,

  // Salesman List
  salesmanLoading: false,
  salesmanList: [],
  salesmanError: null,

  // Filtered Task Records
  filteredTaskRecords: [],
};

const mngSlice = createSlice({
  name: 'mng',
  initialState,
  reducers: {
    // Task Records Actions
    getTaskRecordsList: (state, action: PayloadAction<TaskRecordsListPayload>) => {
      state.taskRecordsLoading = true;
      state.taskRecordsError = null;
    },
    setTaskRecordsList: (state, action: PayloadAction<SetTaskRecordsListPayload>) => {
      state.taskRecordsLoading = false;
      state.taskRecordsList = action.payload.taskRecords;
      state.taskRecordsError = null;
    },
    setTaskRecordsError: (state, action: PayloadAction<SetErrorPayload>) => {
      state.taskRecordsLoading = false;
      state.taskRecordsError = action.payload.error;
    },
    resetTaskRecordsList: state => {
      state.taskRecordsList = [];
      state.taskRecordsLoading = false;
      state.taskRecordsError = null;
    },

    // Salesman List Actions
    getSalesmanList: state => {
      state.salesmanLoading = true;
      state.salesmanError = null;
    },
    setSalesmanList: (state, action: PayloadAction<SetSalesmanListPayload>) => {
      state.salesmanLoading = false;
      state.salesmanList = action.payload.salesmanList;
      state.salesmanError = null;
    },
    setSalesmanError: (state, action: PayloadAction<SetErrorPayload>) => {
      state.salesmanLoading = false;
      state.salesmanError = action.payload.error;
    },
    resetSalesmanList: state => {
      state.salesmanList = [];
      state.salesmanLoading = false;
      state.salesmanError = null;
    },

    // Filtered Task Records Actions
    setFilteredTaskRecords: (state, action: PayloadAction<SetFilteredTaskRecordsPayload>) => {
      state.filteredTaskRecords = action.payload.filteredRecords;
    },
    resetFilteredTaskRecords: state => {
      state.filteredTaskRecords = [];
    },
  },
});

export const {
  getTaskRecordsList,
  setTaskRecordsList,
  setTaskRecordsError,
  resetTaskRecordsList,
  getSalesmanList,
  setSalesmanList,
  setSalesmanError,
  resetSalesmanList,
  setFilteredTaskRecords,
  resetFilteredTaskRecords,
} = mngSlice.actions;

export default mngSlice.reducer;
