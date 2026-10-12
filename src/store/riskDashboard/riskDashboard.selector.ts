import {createSelector} from '@reduxjs/toolkit';
import {RiskDashboardState} from './riskDashboard.types';

export const selectRiskDashboardState = (state: any): RiskDashboardState =>
  state.riskDashboard;

export const selectEcosystemRisk = createSelector(
  [selectRiskDashboardState],
  s => s.ecosystem,
);

export const selectBankRiskDetail = createSelector(
  [selectRiskDashboardState],
  s => s.bankDetail,
);

export const selectPartyRiskProfile = createSelector(
  [selectRiskDashboardState],
  s => s.partyProfile,
);

export const selectAlertDispatches = createSelector(
  [selectRiskDashboardState],
  s => s.alerts,
);

export const selectAlertFilters = createSelector(
  [selectAlertDispatches],
  alerts => alerts.filters,
);

/** Count of non-empty alert filters (for the Filters button badge). */
export const selectActiveAlertFilterCount = createSelector(
  [selectAlertFilters],
  f => [f.bankId, f.programId, f.status, f.date].filter(Boolean).length,
);

export const selectAlertFilterOptions = createSelector(
  [selectRiskDashboardState],
  s => s.filterOptions,
);

export const selectBorrowerRisk = createSelector(
  [selectRiskDashboardState],
  s => s.borrowers,
);
