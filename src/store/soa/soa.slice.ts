import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ProgramRecord, initialSOAState, FetchProgramListRequest} from './soa.types';

const soaSlice = createSlice({
  name: 'soa',
  initialState: initialSOAState,
  reducers: {
    fetchProgramListRequest: (state, action: PayloadAction<FetchProgramListRequest>) => {
      state.loading = true;
      state.error = null;
      if (action.payload.isInitialLoad) {
          state.page = 1;
          state.programList = [];
          state.hasMore = true;
      }
    },
    fetchProgramListSuccess: (
      state,
      action: PayloadAction<{data: ProgramRecord[]; total: number; page: number}>,
    ) => {
      const {data, total, page} = action.payload;
      if (page === 1) {
        state.programList = data;
      } else {
        state.programList = [...state.programList, ...data];
      }
      state.totalPrograms = total;
      state.page = page;
      state.hasMore = state.programList.length < total;
      state.loading = false;
      state.error = null;
    },
    fetchProgramListFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetSOAState: () => initialSOAState,
  },
});

export const {
  fetchProgramListRequest,
  fetchProgramListSuccess,
  fetchProgramListFailure,
  resetSOAState,
} = soaSlice.actions;

export default soaSlice.reducer;
