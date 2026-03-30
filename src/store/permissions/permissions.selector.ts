import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const selectPermissionsState = (state: RootState) => state.permissions;

export const selectPermissions = createSelector(
  selectPermissionsState,
  p => p.permissions,
);

export const selectPermissionsLoading = () => false;

export const selectPermissionsError = createSelector(
  selectPermissionsState,
  p => p.error,
);

/** Check if user has a specific permission (e.g. 'lms.transactions.invoice_list.action.export') */
export const selectHasPermission = (permission: string) =>
  createSelector(selectPermissionsState, p =>
    p.permissions.includes(permission),
  );
