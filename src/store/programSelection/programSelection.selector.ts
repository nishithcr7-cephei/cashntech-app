import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const selectProgramSelectionState = (state: RootState) =>
  state.programSelection;

// Direct selector without createSelector since we're not transforming
export const selectProgramSelection = (state: RootState) =>
  state.programSelection;

export const selectIsProgramSelected = createSelector(
  [selectProgramSelectionState],
  selection => selection.programScope === 'all' || !!selection.programId,
);

export const selectProgramDisplayText = createSelector(
  [selectProgramSelectionState],
  selection => {
    if (selection.programScope === 'all') return 'All Program';
    if (!selection.bankName || !selection.programName) return null;
    return `${selection.bankName} > ${selection.productName} > ${selection.programName}`;
  },
);

export const selectProgramCompactText = createSelector(
  [selectProgramSelectionState],
  selection => {
    if (selection.programScope === 'all') return 'All Program';
    if (!selection.bankName || !selection.programName) return null;
    return `${selection.bankName} > ${selection.programName}`;
  },
);

export const selectBankProductText = createSelector(
  [selectProgramSelectionState],
  selection => {
    if (!selection.bankName || !selection.productName) return null;
    return `${selection.bankName} > ${selection.productName}`;
  },
);

export const selectScopeData = (state: RootState) =>
  state.programSelection.scopeData;
export const selectScopeLoading = (state: RootState) =>
  state.programSelection.scopeLoading;
export const selectScopeError = (state: RootState) =>
  state.programSelection.scopeError;
export const selectSelectedPrograms = (state: RootState) =>
  state.programSelection.selectedPrograms;
export const selectAllProgramIds = (state: RootState) =>
  state.programSelection.allProgramIds;
