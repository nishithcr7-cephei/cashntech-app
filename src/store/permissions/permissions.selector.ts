import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';
import {evaluatePermissionKey} from '@utils/effectivePermissions';
import {resolveWorkspaceProductId} from '@store/product/product.resolver';

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

const selectWorkspaceProductId = (state: RootState): string | null => {
  const programSelection = state.programSelection;
  const productId = state.product?.activeProduct?.id ?? null;
  return resolveWorkspaceProductId(programSelection, productId);
};

/**
 * Check a permission key against the nested effective-permissions object.
 * When productId is omitted, the workspace product (program → active) is used.
 */
export const selectHasPermission = (
  requiredPermission: string,
  productId?: string | null,
) =>
  createSelector(
    selectPermissionsState,
    selectWorkspaceProductId,
    (p, workspaceProductId) =>
      evaluatePermissionKey(
        p.permissions,
        requiredPermission,
        productId === undefined ? workspaceProductId : productId,
      ),
  );

export const selectCanSendMailToBank = createSelector(
  selectPermissionsState,
  selectWorkspaceProductId,
  (p, productId) =>
    evaluatePermissionKey(
      p.permissions,
      'disbursement.send_mail_to_bank',
      productId,
    ) || p.canSendMailToBank,
);

export const selectCanMarkAsDisbursed = createSelector(
  selectPermissionsState,
  selectWorkspaceProductId,
  (p, productId) =>
    evaluatePermissionKey(
      p.permissions,
      'disbursement.mark_as_disbursed',
      productId,
    ) || p.canMarkAsDisbursed,
);
