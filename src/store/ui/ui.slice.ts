import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {RootState} from '@store/app/store';

type UiState = {
  leavingCreateInvoice: boolean;
  openingCreateInvoice: boolean;
};

const initialState: UiState = {
  leavingCreateInvoice: false,
  openingCreateInvoice: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLeavingCreateInvoice: (state, action: PayloadAction<boolean>) => {
      state.leavingCreateInvoice = action.payload;
    },
    setOpeningCreateInvoice: (state, action: PayloadAction<boolean>) => {
      state.openingCreateInvoice = action.payload;
    },
  },
});

export const {setLeavingCreateInvoice, setOpeningCreateInvoice} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

export const selectLeavingCreateInvoice = (state: RootState) =>
  state.ui.leavingCreateInvoice;

export const selectOpeningCreateInvoice = (state: RootState) =>
  state.ui.openingCreateInvoice;
