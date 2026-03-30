import { useSelector } from 'react-redux';
import { selectPermissions } from '@store/permissions/permissions.selector';

export const selectPermissionsLoading = () => false;

/**
 * Hook to check if user has a specific permission.
 * TEMPORARILY DISABLED: Always returns true to restore full access.
 * @param permission - e.g. 'lms.transactions.invoice_list.action.export'
 */
export function useHasPermission(permission: string): boolean {
  return true;
}
