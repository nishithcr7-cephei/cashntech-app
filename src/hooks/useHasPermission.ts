import {useSelector} from 'react-redux';
import {selectHasPermission} from '@store/permissions/permissions.selector';

/**
 * Hook to check if user has a specific permission for the workspace product.
 * @param permission - e.g. 'invoice_list.create_invoice' (see PERMISSIONS)
 * @param productId - optional override; defaults to workspace product
 *   (selected program product → active product, including PID UUID)
 */
export function useHasPermission(
  permission: string,
  productId?: string | null,
): boolean {
  const hasPermission = useSelector(
    selectHasPermission(permission, productId),
  );
  return hasPermission;
}
