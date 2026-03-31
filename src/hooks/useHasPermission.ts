import {useSelector} from 'react-redux';
import {selectHasPermission} from '@store/permissions/permissions.selector';

/**
 * Hook to check if user has a specific permission.
 * @param permission - e.g. 'lms.transactions.invoice_list.action.export'
 */
export function useHasPermission(permission: string): boolean {
  const hasPermission = useSelector(selectHasPermission(permission));
  return hasPermission;
}
