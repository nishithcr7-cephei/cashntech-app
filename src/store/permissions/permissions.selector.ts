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

export const selectHasPermission = (requiredPermission: string) =>
  createSelector(selectPermissionsState, p => {
    if (!p || !p.permissions || !Array.isArray(p.permissions)) return false;

    // 1. Exact match first (fast path)
    if (p.permissions.includes(requiredPermission)) return true;

    // 2. Robust Partial Match for functional actions
    const parts = (requiredPermission || '').split('.');
    const actionIndex = parts.indexOf('action');

    if (actionIndex !== -1 && actionIndex > 0) {
      const functionalPart = parts.slice(actionIndex - 1).join('.');
      return p.permissions.some(perm => perm && typeof perm === 'string' && perm.includes(functionalPart));
    }

    return false;
  });

export const selectCanSendMailToBank = createSelector(
  selectPermissionsState,
  p => p.canSendMailToBank,
);

export const selectCanMarkAsDisbursed = createSelector(
  selectPermissionsState,
  p => p.canMarkAsDisbursed,
);
