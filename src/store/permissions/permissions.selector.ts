import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const selectPermissionsState = (state: RootState) => state.permissions;

export const selectPermissions = createSelector(
  selectPermissionsState,
  p => p.permissions,
);

export const selectPermissionsLoading = createSelector(
  selectPermissionsState,
  p => p.loading,
);

export const selectPermissionsError = createSelector(
  selectPermissionsState,
  p => p.error,
);

export const selectHasPermission = (permission: string) =>
  createSelector(selectPermissionsState, p =>
    p.permissions.includes(permission),
  );

export const selectCanSendMailToBank = createSelector(
  selectPermissionsState,
  p => p.canSendMailToBank,
);

export const selectCanMarkAsDisbursed = createSelector(
  selectPermissionsState,
  p => p.canMarkAsDisbursed,
);
