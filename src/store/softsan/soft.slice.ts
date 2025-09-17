import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  ISoftSanctionClient,
  ISoftSanctionRuleset,
  IsoftSanctionBankProductDatum,
  IsoftSanctionMethodDatum,
  SoftState,
} from './soft.types';

const initialState: SoftState = {
  SoftSanctionLoading: false,
  SoftSanctionData: [],
  SoftSanctionError: null,

  SoftSanctionBNKPROLoading: false,
  SoftSanctionBNKPROData: [],
  SoftSanctionBNKPROError: null,

  rulesetLoading: false,
  rulesetData: [],
  rulesetError: null,

  softSanctionClientLoading: false,
  softSanctionClientList: [],
  softSanctionClientError: null,

  softSanctionFields: {},
  softSanctionFieldsLoading: false,
  softSanctionFieldsError: null,

  // Dynamic API call result
  softSanctionResult: null,
  softSanctionResultLoading: false,
  softSanctionResultError: null,
};

const softSlice = createSlice({
  name: 'softsan',
  initialState,
  reducers: {
    // Methods list for bank
    setSoftSanctionLoader: (state, action: PayloadAction<boolean>) => {
      state.SoftSanctionLoading = action.payload;
    },
    getSoftSanction: state => {
      state.SoftSanctionLoading = true;
      state.SoftSanctionError = null;
    },
    setSoftSanctionList: (
      state,
      action: PayloadAction<Array<IsoftSanctionMethodDatum>>,
    ) => {
      state.SoftSanctionLoading = false;
      state.SoftSanctionData = action.payload;
    },
    resetSoftSanction: state => {
      state.SoftSanctionData = [];
      state.SoftSanctionLoading = false;
      state.SoftSanctionError = null;
    },

    // Methods for bank+product
    setSoftSanctionBnkProLoader: (state, action: PayloadAction<boolean>) => {
      state.SoftSanctionBNKPROLoading = action.payload;
    },
    getSoftSanctionBnkPro: state => {
      state.SoftSanctionBNKPROLoading = true;
      state.SoftSanctionBNKPROError = null;
    },
    setSoftSanctionBnkProList: (
      state,
      action: PayloadAction<Array<IsoftSanctionBankProductDatum>>,
    ) => {
      state.SoftSanctionBNKPROLoading = false;
      state.SoftSanctionBNKPROData = action.payload;
    },
    resetSoftSanctionBnkPro: state => {
      state.SoftSanctionBNKPROData = [];
      state.SoftSanctionBNKPROLoading = false;
      state.SoftSanctionBNKPROError = null;
    },

    // Ruleset list
    getSoftSanctionRuleset: (state, _action: PayloadAction<{bank: string; product: string; method?: string}>) => {
      state.rulesetLoading = true;
      state.rulesetError = null;
    },
    setSoftSanctionRuleset: (state, action: PayloadAction<ISoftSanctionRuleset[]>) => {
      state.rulesetLoading = false;
      state.rulesetData = action.payload;
    },
    setSoftSanctionRulesetError: (state, action: PayloadAction<string>) => {
      state.rulesetLoading = false;
      state.rulesetError = action.payload;
    },

    // Client list
    getSoftSanctionClientList: state => {
      state.softSanctionClientLoading = true;
      state.softSanctionClientError = null;
    },
    setSoftSanctionClientList: (state, action: PayloadAction<ISoftSanctionClient[]>) => {
      state.softSanctionClientLoading = false;
      state.softSanctionClientList = action.payload;
    },
    setSoftSanctionClientListError: (state, action: PayloadAction<string>) => {
      state.softSanctionClientLoading = false;
      state.softSanctionClientError = action.payload;
    },

    // Input fields
    setSoftSanctionFields: (state, action: PayloadAction<Record<string, any[]>>) => {
      state.softSanctionFields = action.payload;
      state.softSanctionFieldsLoading = false;
      state.softSanctionFieldsError = null;
    },
    setSoftSanctionFieldsLoading: state => {
      state.softSanctionFieldsLoading = true;
      state.softSanctionFieldsError = null;
    },
    setSoftSanctionFieldsError: (state, action: PayloadAction<string>) => {
      state.softSanctionFieldsLoading = false;
      state.softSanctionFieldsError = action.payload;
    },
    clearSoftSanctionFields: state => {
      state.softSanctionFields = {};
      state.softSanctionFieldsLoading = false;
      state.softSanctionFieldsError = null;
    },
    getSoftSanctionFields: (state, _action: PayloadAction<{bankName: string; productName: string; methodName?: string}>) => {},

    // Dynamic API call actions
    runSoftSanction: (state, _action: PayloadAction<{url: string; payload: any}>) => {
      state.softSanctionResultLoading = true;
      state.softSanctionResultError = null;
    },
    setSoftSanctionResult: (state, action: PayloadAction<any>) => {
      state.softSanctionResultLoading = false;
      state.softSanctionResult = action.payload;
      state.softSanctionResultError = null;
    },
    setSoftSanctionResultError: (state, action: PayloadAction<string>) => {
      state.softSanctionResultLoading = false;
      state.softSanctionResultError = action.payload;
    },
    clearSoftSanctionResult: (state) => {
      state.softSanctionResult = null;
      state.softSanctionResultLoading = false;
      state.softSanctionResultError = null;
    },
    getSoftSanctionResult: (state, _action: PayloadAction<{clientId: string; method: string; bank: string}>) => {
      state.softSanctionResultLoading = true;
      state.softSanctionResultError = null;
    },
  },
});

export const {
  setSoftSanctionLoader,
  getSoftSanction,
  setSoftSanctionList,
  resetSoftSanction,
  setSoftSanctionBnkProLoader,
  getSoftSanctionBnkPro,
  setSoftSanctionBnkProList,
  resetSoftSanctionBnkPro,
  getSoftSanctionRuleset,
  setSoftSanctionRuleset,
  setSoftSanctionRulesetError,
  getSoftSanctionClientList,
  setSoftSanctionClientList,
  setSoftSanctionClientListError,
  setSoftSanctionFields,
  setSoftSanctionFieldsLoading,
  setSoftSanctionFieldsError,
  clearSoftSanctionFields,
  getSoftSanctionFields,
  runSoftSanction,
  setSoftSanctionResult,
  setSoftSanctionResultError,
  clearSoftSanctionResult,
  getSoftSanctionResult,
} = softSlice.actions;

export default softSlice.reducer;
