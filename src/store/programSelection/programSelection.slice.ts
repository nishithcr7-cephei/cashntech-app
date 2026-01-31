import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ProgramSelectionState} from './programSelection.types';
import type {Bank, UserType} from '@constants/programSelection';

const initialState: ProgramSelectionState = {
  bankId: null,
  bankName: null,
  productId: null,
  productName: null,
  programId: null,
  programName: null,
  userType: null,
  scopeData: null,
  scopeLoading: false,
  scopeError: null,
};

const programSelectionSlice = createSlice({
  name: 'programSelection',
  initialState,
  reducers: {
    setProgramSelection: (
      state,
      action: PayloadAction<{
        bankId?: string | null;
        bankName?: string | null;
        productId?: string | null;
        productName?: string | null;
        programId?: string | null;
        programName?: string | null;
        userType?: UserType | null;
      }>,
    ) => {
      const p = action.payload;
      if (p.bankId !== undefined) state.bankId = p.bankId;
      if (p.bankName !== undefined) state.bankName = p.bankName;
      if (p.productId !== undefined) state.productId = p.productId;
      if (p.productName !== undefined) state.productName = p.productName;
      if (p.programId !== undefined) state.programId = p.programId;
      if (p.programName !== undefined) state.programName = p.programName;
      if (p.userType !== undefined) state.userType = p.userType;
    },
    clearProgramSelection: () => initialState,
    fetchUserScopeRequest: state => {
      state.scopeLoading = true;
      state.scopeError = null;
    },
    fetchUserScopeSuccess: (state, action: PayloadAction<Bank[]>) => {
      state.scopeData = action.payload;
      state.scopeLoading = false;
      state.scopeError = null;
    },
    fetchUserScopeFailure: (state, action: PayloadAction<string>) => {
      state.scopeLoading = false;
      state.scopeError = action.payload;
    },
  },
});

export const {
  setProgramSelection,
  clearProgramSelection,
  fetchUserScopeRequest,
  fetchUserScopeSuccess,
  fetchUserScopeFailure,
} = programSelectionSlice.actions;
export default programSelectionSlice.reducer;
