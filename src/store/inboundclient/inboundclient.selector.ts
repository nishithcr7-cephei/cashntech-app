import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';
import {InboundClientState} from './inboundclient.types';
import {InboundClientData} from '@components/InboundClientCard';
import {decryptConditionally} from '@utils/crypto';

// Base selector
const selectInboundClientState = (state: RootState): InboundClientState => state.inboundClient;

// Basic selectors
export const inboundClientSelectors = {
  // Get all inbound clients
  getInboundClients: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.inboundClients
  ),

  // Get filtered inbound clients
  getFilteredClients: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.filteredClients
  ),

  // Get loading state
  getLoading: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.loading
  ),

  // Get error state
  getError: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.error
  ),

  // Get applied filters
  getAppliedFilters: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.appliedFilters
  ),

  // Get clients count
  getClientsCount: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.inboundClients.length
  ),

  // Get filtered clients count
  getFilteredClientsCount: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.filteredClients.length
  ),

  // Check if there are any clients
  hasClients: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.inboundClients.length > 0
  ),

  // Check if there are any filtered clients
  hasFilteredClients: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => state.filteredClients.length > 0
  ),

  // Get unique sectors from all clients
  getUniqueSectors: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => {
      const sectors = state.inboundClients.map(client => client.sector);
      return [...new Set(sectors)].filter(Boolean);
    }
  ),

  // Get unique cities from all clients (decrypted)
  getUniqueCities: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => {
      const cities = state.inboundClients
        .map(client => decryptConditionally(client.city || ''))
        .filter(Boolean);
      return [...new Set(cities)];
    }
  ),

  // Get unique application statuses from all clients
  getUniqueApplicationStatuses: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => {
      const statuses = state.inboundClients
        .flatMap(client => client.inboundApplicants.map(applicant => applicant.application_status));
      return [...new Set(statuses)].filter(Boolean);
    }
  ),

  // Get unique registration statuses from all clients
  getUniqueRegistrationStatuses: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => {
      const statuses = state.inboundClients
        .map(client => client.registration_status)
        .filter(Boolean);
      return [...new Set(statuses)];
    }
  ),

  // Get unique overall statuses from all clients
  getUniqueOverallStatuses: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => {
      const statuses = state.inboundClients
        .flatMap(client => client.inboundApplicants.map(applicant => applicant.overall_status));
      return [...new Set(statuses)].filter(Boolean);
    }
  ),

  // Get filter options for FilterModal
  getFilterOptions: createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => ({
      Sector: [...new Set(state.inboundClients.map(client => client.sector))].filter(Boolean) as string[],
      City: [...new Set(state.inboundClients.map(client => decryptConditionally(client.city || '')).filter(Boolean))] as string[],
      'Application Status': [...new Set(state.inboundClients.flatMap(client => 
        client.inboundApplicants.map(applicant => applicant.application_status)
      ))].filter(Boolean) as string[],
      'Registration Status': [...new Set(state.inboundClients.map(client => 
        client.registration_status
      ).filter(Boolean))] as string[],
      'Overall Status': [...new Set(state.inboundClients.flatMap(client => 
        client.inboundApplicants.map(applicant => applicant.overall_status)
      ))].filter(Boolean) as string[],
    })
  ),

  // Get client by ID
  getClientById: (clientId: number) => createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => {
      return state.inboundClients.find(client => 
        client.inboundClient.some(ic => ic.id === clientId)
      );
    }
  ),

  // Get clients by registration ID
  getClientByRegistrationId: (registrationId: string) => createSelector(
    [selectInboundClientState],
    (state: InboundClientState) => {
      return state.inboundClients.find(client => client.registration_id === registrationId);
    }
  ),
};

export default inboundClientSelectors;
