import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  LeadState,
  ILeadProgressResponseDatum,
} from './lead.types';
import {PayloadWithCallback} from '@type/global.types';

const initialState: LeadState = {
  // Lead Progress fields
  leadLoader: false,
  leadList: [],
  leadProgressDetails: [],
  leadProgressDetailsLoading: false,
  leadProgressDetailsError: null,
};

const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    getLead: state => {
      console.log(
        'LeadSlice: getLead action dispatched, setting leadLoader = true',
      );
      state.leadLoader = true;
    },
    getLeadDesciption: (
      state,
      _payload: PayloadAction<PayloadWithCallback<string, [Array<any>]>>,
    ) => {
      state.leadLoader = true;
    },
    setLeadList: (
      state,
      action: PayloadAction<ILeadProgressResponseDatum[]>,
    ) => {
      console.log(
        'LeadSlice: setLeadList action dispatched, setting leadLoader = false, data length:',
        action.payload?.length || 0,
      );
      state.leadLoader = false;
      state.leadList = action.payload;
    },
    resetLeadList: state => {
      state.leadList = [];
      state.leadLoader = false;
    },
    getLeadProgressDetails: (state, _action: PayloadAction<number>) => {
      state.leadProgressDetailsLoading = true;
      state.leadProgressDetailsError = null;
    },
    setLeadProgressDetails: (state, action: PayloadAction<any[]>) => {
      state.leadProgressDetailsLoading = false;
      state.leadProgressDetails = action.payload;
      state.leadProgressDetailsError = null;
    },
    setLeadProgressDetailsError: (state, action: PayloadAction<string>) => {
      state.leadProgressDetailsLoading = false;
      state.leadProgressDetails = [];
      state.leadProgressDetailsError = action.payload;
    },
  },
});

export const {
  getLead,
  setLeadList,
  resetLeadList,
  getLeadDesciption,
  getLeadProgressDetails,
  setLeadProgressDetails,
  setLeadProgressDetailsError,
} = leadSlice.actions;

export default leadSlice.reducer;
