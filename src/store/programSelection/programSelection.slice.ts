import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ProgramSelectionState} from './programSelection.types';

const initialState: ProgramSelectionState = {
  bankId: null,
  bankName: null,
  productId: null,
  productName: null,
  programId: null,
  programName: null,
  userType: null,
};

const programSelectionSlice = createSlice({
  name: 'programSelection',
  initialState,
  reducers: {
    setProgramSelection: (
      state,
      action: PayloadAction<ProgramSelectionState>,
    ) => {
      return {...action.payload};
    },
    clearProgramSelection: () => initialState,
  },
});

export const {setProgramSelection, clearProgramSelection} =
  programSelectionSlice.actions;
export default programSelectionSlice.reducer;
