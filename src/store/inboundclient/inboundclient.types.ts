import {InboundClientData} from '@components/InboundClientCard';

// Action Types
export const INBOUND_CLIENT_ACTION_TYPES = {
  GET_INBOUND_CLIENTS_REQUEST: 'GET_INBOUND_CLIENTS_REQUEST',
  GET_INBOUND_CLIENTS_SUCCESS: 'GET_INBOUND_CLIENTS_SUCCESS',
  GET_INBOUND_CLIENTS_FAILURE: 'GET_INBOUND_CLIENTS_FAILURE',
  FILTER_INBOUND_CLIENTS_REQUEST: 'FILTER_INBOUND_CLIENTS_REQUEST',
  FILTER_INBOUND_CLIENTS_SUCCESS: 'FILTER_INBOUND_CLIENTS_SUCCESS',
  FILTER_INBOUND_CLIENTS_FAILURE: 'FILTER_INBOUND_CLIENTS_FAILURE',
  CLEAR_INBOUND_CLIENTS_ERROR: 'CLEAR_INBOUND_CLIENTS_ERROR',
  SET_INBOUND_CLIENTS_LOADING: 'SET_INBOUND_CLIENTS_LOADING',
} as const;

// State Interface
export interface InboundClientState {
  inboundClients: InboundClientData[];
  filteredClients: InboundClientData[];
  loading: boolean;
  error: string | null;
  appliedFilters: Record<string, string[]>;
}

// Action Interfaces
export interface GetInboundClientsRequestAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENTS_REQUEST;
}

export interface GetInboundClientsSuccessAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENTS_SUCCESS;
  payload: InboundClientData[];
}

export interface GetInboundClientsFailureAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENTS_FAILURE;
  payload: string;
}

export interface FilterInboundClientsRequestAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.FILTER_INBOUND_CLIENTS_REQUEST;
  payload: Record<string, string[]>;
}

export interface FilterInboundClientsSuccessAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.FILTER_INBOUND_CLIENTS_SUCCESS;
  payload: InboundClientData[];
}

export interface FilterInboundClientsFailureAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.FILTER_INBOUND_CLIENTS_FAILURE;
  payload: string;
}

export interface ClearInboundClientsErrorAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.CLEAR_INBOUND_CLIENTS_ERROR;
}

export interface SetInboundClientsLoadingAction {
  type: typeof INBOUND_CLIENT_ACTION_TYPES.SET_INBOUND_CLIENTS_LOADING;
  payload: boolean;
}

// Union type for all actions
export type InboundClientActionTypes =
  | GetInboundClientsRequestAction
  | GetInboundClientsSuccessAction
  | GetInboundClientsFailureAction
  | FilterInboundClientsRequestAction
  | FilterInboundClientsSuccessAction
  | FilterInboundClientsFailureAction
  | ClearInboundClientsErrorAction
  | SetInboundClientsLoadingAction;

// Filter payload interface
export interface InboundClientFilterPayload {
  sectors?: string[];
  cities?: string[];
  application_status?: string[];
  registration_status?: string[];
  overall_status?: string[];
}
