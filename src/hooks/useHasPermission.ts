import {useSelector} from 'react-redux';
import {selectPermissions} from '@store/permissions/permissions.selector';

/**
 * Hook to check if user has a specific permission.
 * Use for conditional rendering of buttons/actions.
 * @param permission - e.g. 'lms.transactions.invoice_list.action.export'
 */
export function useHasPermission(permission: string): boolean {
  const permissions = useSelector(selectPermissions);
  return permissions.includes(permission);
}
