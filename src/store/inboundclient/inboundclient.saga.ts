import {call, put, takeLatest, select} from 'redux-saga/effects';
import {
  INBOUND_CLIENT_ACTION_TYPES,
  InboundClientActionTypes,
} from './inboundclient.types';
import {
  getInboundClientsSuccess,
  getInboundClientsFailure,
  filterInboundClientsSuccess,
  filterInboundClientsFailure,
  setInboundClientsLoading,
} from './inboundclient.slice';
import InboundClientApis from '@services/api/inboundclient.api';
import {InboundClientData} from '@components/InboundClientCard';

// Helper function to apply filters locally
function applyFiltersToClients(
  clients: InboundClientData[],
  filters: Record<string, string[]>
): InboundClientData[] {
  if (!filters || Object.keys(filters).length === 0) {
    return clients;
  }

  return clients.filter((client) => {
    // Filter by sector
    if (filters.Sector && filters.Sector.length > 0) {
      if (!filters.Sector.includes(client.sector)) {
        return false;
      }
    }

    // Filter by city
    if (filters.City && filters.City.length > 0) {
      if (!client.city || !filters.City.includes(client.city)) {
        return false;
      }
    }

    // Filter by registration status
    if (filters['Registration Status'] && filters['Registration Status'].length > 0) {
      if (!client.registration_status || !filters['Registration Status'].includes(client.registration_status)) {
        return false;
      }
    }

    // Filter by application status (from inboundApplicants)
    if (filters['Application Status'] && filters['Application Status'].length > 0) {
      const hasMatchingApplicationStatus = client.inboundApplicants.some(applicant =>
        filters['Application Status'].includes(applicant.application_status)
      );
      if (!hasMatchingApplicationStatus) {
        return false;
      }
    }

    // Filter by overall status (from inboundApplicants)
    if (filters['Overall Status'] && filters['Overall Status'].length > 0) {
      const hasMatchingOverallStatus = client.inboundApplicants.some(applicant =>
        filters['Overall Status'].includes(applicant.overall_status)
      );
      if (!hasMatchingOverallStatus) {
        return false;
      }
    }

    return true;
  });
}

// Get Inbound Clients Saga
function* getInboundClientsSaga(action: InboundClientActionTypes): Generator<any, void, any> {
  try {
    yield put(setInboundClientsLoading(true));
    
    const {data, error} = yield call(InboundClientApis.getInboundClients);
    
    if (error) {
      yield put(getInboundClientsFailure(error.message || 'Failed to fetch inbound clients'));
      return;
    }

    if (data && data.statusCode === 200) {
      yield put(getInboundClientsSuccess(data.data));
    } else {
      yield put(getInboundClientsFailure('Invalid response from server'));
    }
  } catch (error: any) {
    yield put(getInboundClientsFailure(error.message || 'An unexpected error occurred'));
  } finally {
    yield put(setInboundClientsLoading(false));
  }
}

// Filter Inbound Clients Saga
function* filterInboundClientsSaga(action: any): Generator<any, void, any> {
  try {
    yield put(setInboundClientsLoading(true));
    
    // Get current state to access inboundClients
    const state: any = yield select();
    const inboundClients = state.inboundClient.inboundClients;
    
    // Apply filters locally
    const filteredClients = applyFiltersToClients(inboundClients, action.payload);
    
    yield put(filterInboundClientsSuccess(filteredClients));
  } catch (error: any) {
    yield put(filterInboundClientsFailure(error.message || 'An unexpected error occurred'));
  } finally {
    yield put(setInboundClientsLoading(false));
  }
}

// Root Saga
export function* inboundClientSaga() {
  yield takeLatest(INBOUND_CLIENT_ACTION_TYPES.GET_INBOUND_CLIENTS_REQUEST, getInboundClientsSaga);
  yield takeLatest(INBOUND_CLIENT_ACTION_TYPES.FILTER_INBOUND_CLIENTS_REQUEST, filterInboundClientsSaga);
}

export default inboundClientSaga;
