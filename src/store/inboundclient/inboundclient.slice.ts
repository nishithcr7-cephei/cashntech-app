import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  InboundClientState,
  INBOUND_CLIENT_ACTION_TYPES,
  InboundClientActionTypes,
} from './inboundclient.types';
import {InboundClientData} from '@components/InboundClientCard';

// Initial State
const initialState: InboundClientState = {
  inboundClients: [],
  filteredClients: [],
  clientDetails: null,
  loading: false,
  detailsLoading: false,
  error: null,
  appliedFilters: {},
};

// Action Creators
export const inboundClientActions = {
  getInboundClientsRequest: (): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENTS_REQUEST,
  }),

  getInboundClientsSuccess: (payload: InboundClientData[]): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENTS_SUCCESS,
    payload,
  }),

  getInboundClientsFailure: (payload: string): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENTS_FAILURE,
    payload,
  }),

  getInboundClientDetailsRequest: (payload: string): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENT_DETAILS_REQUEST,
    payload,
  }),

  getInboundClientDetailsSuccess: (payload: any): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENT_DETAILS_SUCCESS,
    payload,
  }),

  getInboundClientDetailsFailure: (payload: string): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENT_DETAILS_FAILURE,
    payload,
  }),

  filterInboundClientsRequest: (payload: Record<string, string[]>): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.FILTER_INBOUND_CLIENTS_REQUEST,
    payload,
  }),

  filterInboundClientsSuccess: (payload: InboundClientData[]): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.FILTER_INBOUND_CLIENTS_SUCCESS,
    payload,
  }),

  filterInboundClientsFailure: (payload: string): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.FILTER_INBOUND_CLIENTS_FAILURE,
    payload,
  }),

  clearInboundClientsError: (): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.CLEAR_INBOUND_CLIENTS_ERROR,
  }),

  setInboundClientsLoading: (payload: boolean): InboundClientActionTypes => ({
    type: INBOUND_CLIENT_ACTION_TYPES.SET_INBOUND_CLIENTS_LOADING,
    payload,
  }),
};

// Slice
const inboundClientSlice = createSlice({
  name: 'inboundClient',
  initialState,
  reducers: {
    // Get Inbound Clients
    getInboundClientsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    getInboundClientsSuccess: (state, action: PayloadAction<InboundClientData[]>) => {
      state.loading = false;
      state.inboundClients = action.payload;
      state.filteredClients = action.payload;
      state.error = null;
    },
    getInboundClientsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get Inbound Client Details
    getInboundClientDetailsRequest: (state) => {
      state.detailsLoading = true;
      state.error = null;
    },
    getInboundClientDetailsSuccess: (state, action: PayloadAction<any>) => {
      state.detailsLoading = false;
      state.clientDetails = action.payload;
      state.error = null;
    },
    getInboundClientDetailsFailure: (state, action: PayloadAction<string>) => {
      state.detailsLoading = false;
      state.error = action.payload;
    },

    // Filter Inbound Clients
    filterInboundClientsRequest: (state, action: PayloadAction<Record<string, string[]>>) => {
      state.loading = true;
      state.appliedFilters = action.payload;
      state.error = null;
    },
    filterInboundClientsSuccess: (state, action: PayloadAction<InboundClientData[]>) => {
      state.loading = false;
      state.filteredClients = action.payload;
      state.error = null;
    },
    filterInboundClientsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Clear Error
    clearInboundClientsError: (state) => {
      state.error = null;
    },

    // Set Loading
    setInboundClientsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Reset State
    resetInboundClientState: () => initialState,
  },
});

export const {
  getInboundClientsRequest,
  getInboundClientsSuccess,
  getInboundClientsFailure,
  getInboundClientDetailsRequest,
  getInboundClientDetailsSuccess,
  getInboundClientDetailsFailure,
  filterInboundClientsRequest,
  filterInboundClientsSuccess,
  filterInboundClientsFailure,
  clearInboundClientsError,
  setInboundClientsLoading,
  resetInboundClientState,
} = inboundClientSlice.actions;

export default inboundClientSlice.reducer;
