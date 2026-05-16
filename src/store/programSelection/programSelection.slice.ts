import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ProgramSelectionState, SelectedProgram} from './programSelection.types';
import type {Bank, UserType} from '@constants/programSelection';

const initialState: ProgramSelectionState = {
  programScope: 'selected',
  bankId: null,
  bankName: null,
  partyId: null,
  productId: null,
  productName: null,
  programId: null,
  programName: null,
  userType: null,
  method: null,
  role: null,
  status: null,
  selectedPrograms: [],
  scopeData: null,
  scopeLoading: false,
  scopeError: null,
  allProgramIds: null,
};

const programSelectionSlice = createSlice({
  name: 'programSelection',
  initialState,
  reducers: {
    setProgramScope: (state, action: PayloadAction<'all' | 'selected'>) => {
      state.programScope = action.payload;
    },
    setProgramSelection: (
      state,
      action: PayloadAction<{
        bankId?: string | null;
        bankName?: string | null;
        partyId?: string | null;
        productId?: string | null;
        productName?: string | null;
        programId?: string | null;
        programName?: string | null;
        userType?: UserType | null;
        method?: string | null;
        role?: string | null;
        status?: string | null;
      }>,
    ) => {
      const p = action.payload;
      if (p.bankId !== undefined) state.bankId = p.bankId;
      if (p.bankName !== undefined) state.bankName = p.bankName;
      if (p.partyId !== undefined) state.partyId = p.partyId;
      if (p.productId !== undefined) state.productId = p.productId;
      if (p.productName !== undefined) state.productName = p.productName;
      if (p.programId !== undefined) state.programId = p.programId;
      if (p.programName !== undefined) state.programName = p.programName;
      if (p.userType !== undefined) state.userType = p.userType;
      if (p.method !== undefined) state.method = p.method;
      if (p.role !== undefined) state.role = p.role;
      if (p.status !== undefined) state.status = p.status;
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
      // Save all program IDs so "All Program" can pass them to invoice/summary on next page
      const ids: string[] = [];
      action.payload?.forEach(bank =>
        bank.products?.forEach(p =>
          p.programs?.forEach(prog => ids.push(prog.id)),
        ),
      );
      state.allProgramIds = ids.length ? ids : null;
    },
    fetchUserScopeFailure: (state, action: PayloadAction<string>) => {
      state.scopeLoading = false;
      state.scopeError = action.payload;
    },
    // ============================================================================
    // SINGLE SELECTION MODE (Current Implementation)
    // ============================================================================
    // Currently, users can only select one program at a time.
    // When a new program is selected, it replaces any previously selected program.
    //
    // TO REVERT TO MULTIPLE SELECTION IN THE FUTURE:
    // 1. Replace this reducer with the commented code below (lines 88-134)
    // 2. In SelectProgramScreen.tsx: Uncomment checkbox rendering (lines 260-270)
    // 3. In SelectProgramScreen.tsx: Uncomment Done button in footer (lines 341-352)
    // 4. In SelectProgramScreen.tsx: Remove immediate navigation from handleProgramToggle
    // 5. In ProgramBreadcrumb.tsx: Uncomment expand/collapse logic and multi-program display
    // ============================================================================
    toggleProgramSelection: (state, action: PayloadAction<SelectedProgram>) => {
      const program = action.payload;
      // Selecting a specific program implies "selected" scope; next page gets only this ID
      state.programScope = 'selected';
      state.allProgramIds = null;
      // Single selection: Clear all previous selections and only keep the new one
      state.selectedPrograms = [program];
      // Update single selection fields
      state.bankId = program.bankId;
      state.bankName = program.bankName;
      state.partyId = program.partyId;
      state.productId = program.productId;
      state.productName = program.productName;
      state.programId = program.programId;
      state.programName = program.programName;
      state.userType = program.userType;
      state.method = program.method;
      state.role = program.role;
      state.status = program.status;
    },
    
    // ============================================================================
    // MULTIPLE SELECTION CODE (Commented for future use)
    // ============================================================================
    // Uncomment this code if multiple selection is needed in the future:
    /*
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
    */
    setSelectedPrograms: (state, action: PayloadAction<SelectedProgram[]>) => {
      state.selectedPrograms = action.payload;
    },
    clearSelectedPrograms: state => {
      state.selectedPrograms = [];
    },
  },
});

export const {
  setProgramScope,
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
