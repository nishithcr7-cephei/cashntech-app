import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const selectVisitState = (state: RootState) => state.visit;

// Visit Details Selectors
export const selectVisitDetailsList = createSelector(
  [selectVisitState],
  (visit) => visit.visitDetailsList,
);

export const selectVisitDetailsLoading = createSelector(
  [selectVisitState],
  (visit) => visit.visitLoader,
);

export const selectVisitDetailsError = createSelector(
  [selectVisitState],
  (visit) => visit.visitDetailsError,
);

// Salesman Selectors
export const selectSalesmanList = createSelector(
  [selectVisitState],
  (visit) => visit.salesmanList,
);

export const selectSalesmanLoading = createSelector(
  [selectVisitState],
  (visit) => visit.salesmanLoader,
);

export const selectSalesmanError = createSelector(
  [selectVisitState],
  (visit) => visit.salesmanError,
);

// Locations Selectors
export const selectLocationsList = createSelector(
  [selectVisitState],
  (visit) => visit.locationsList,
);

export const selectLocationsLoading = createSelector(
  [selectVisitState],
  (visit) => visit.locationsLoader,
);

export const selectLocationsError = createSelector(
  [selectVisitState],
  (visit) => visit.locationsError,
);

// Save Visit Selectors
export const selectSaveVisitLoading = createSelector(
  [selectVisitState],
  (visit) => visit.saveVisitLoader,
);

export const selectSaveVisitError = createSelector(
  [selectVisitState],
  (visit) => visit.saveVisitError,
);
