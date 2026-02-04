import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ProgramSelectionState, SelectedProgram} from './programSelection.types';
import type {Bank, UserType} from '@constants/programSelection';

const initialState: ProgramSelectionState = {
  bankId: null,
  bankName: null,
  productId: null,
  productName: null,
  programId: null,
  programName: null,
  userType: null,
  selectedPrograms: [],
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
    toggleProgramSelection: (state, action: PayloadAction<SelectedProgram>) => {
      const program = action.payload;
      const existingIndex = state.selectedPrograms.findIndex(
        p => p.programId === program.programId,
      );
      if (existingIndex >= 0) {
        // Remove if already selected
        const updatedPrograms = state.selectedPrograms.filter(
          p => p.programId !== program.programId,
        );
        state.selectedPrograms = updatedPrograms;
        // Update single selection to first remaining program, or clear if none
        if (updatedPrograms.length > 0) {
          const first = updatedPrograms[0];
          state.bankId = first.bankId;
          state.bankName = first.bankName;
          state.productId = first.productId;
          state.productName = first.productName;
          state.programId = first.programId;
          state.programName = first.programName;
          state.userType = first.userType;
        } else {
          state.bankId = null;
          state.bankName = null;
          state.productId = null;
          state.productName = null;
          state.programId = null;
          state.programName = null;
          state.userType = null;
        }
      } else {
        // Add if not selected
        const updatedPrograms = [...state.selectedPrograms, program];
        state.selectedPrograms = updatedPrograms;
        // Update single selection to this program (or keep first if multiple)
        if (updatedPrograms.length === 1) {
          // First selection - set as primary
          state.bankId = program.bankId;
          state.bankName = program.bankName;
          state.productId = program.productId;
          state.productName = program.productName;
          state.programId = program.programId;
          state.programName = program.programName;
          state.userType = program.userType;
        }
        // If multiple selections, keep the first one as primary
      }
    },
    setSelectedPrograms: (state, action: PayloadAction<SelectedProgram[]>) => {
      state.selectedPrograms = action.payload;
    },
    clearSelectedPrograms: state => {
      state.selectedPrograms = [];
    },
  },
});

export const {
  setProgramSelection,
  clearProgramSelection,
  fetchUserScopeRequest,
  fetchUserScopeSuccess,
  fetchUserScopeFailure,
  toggleProgramSelection,
  setSelectedPrograms,
  clearSelectedPrograms,
} = programSelectionSlice.actions;
export default programSelectionSlice.reducer;
