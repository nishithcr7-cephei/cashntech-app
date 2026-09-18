/**
 * Shape of GET /user/permissions after the Resource/Action catalog rewrite.
 *
 * {
 *   __moduleAccess: { lms: true, ... },
 *   invoice_list: { create_invoice: { products: string[] | null }, ... },
 *   ...
 * }
 *
 * `products: null`  → grant applies to every product
 * `products: [...]` → grant only for those product UUIDs
 */
export type PermissionGrant = {
  products: string[] | null;
};

export type ResourceActionGrants = {
  [actionKey: string]: PermissionGrant | Record<string, unknown>;
};

export type EffectivePermissions = {
  __moduleAccess?: Record<string, boolean>;
  [resourceKey: string]:
    | ResourceActionGrants
    | Record<string, boolean>
    | undefined;
};

export function isEffectivePermissions(
  value: unknown,
): value is EffectivePermissions {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
