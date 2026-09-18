import type {
  EffectivePermissions,
  PermissionGrant,
} from '@store/permissions/permissions.types';

/**
 * Permission keys used by the app are encoded as:
 *   - `resource.action`           e.g. invoice_list.create_invoice
 *   - `module:<moduleKey>`        e.g. module:lms  (__moduleAccess)
 *   - `any:<resource>`            e.g. any:invoice_list (any action on resource)
 *   - `anyReport:view`            any seeded *_report resource with view
 */
const REPORT_RESOURCES = [
  'all_loans_report',
  'disbursement_report',
  'dpd_report',
  'daily_accrual_report',
  'monthly_interest_report',
  'repayment_report',
  'invoice_outstanding_report',
  'loan_status_report',
  'all_product_outstanding_report',
  'utilization_report',
] as const;

function asGrant(value: unknown): PermissionGrant | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  if (!('products' in value)) {
    return null;
  }
  const products = (value as PermissionGrant).products;
  if (products !== null && !Array.isArray(products)) {
    return null;
  }
  return {products};
}

function grantAllowsProduct(
  grant: PermissionGrant,
  productId?: string | null,
): boolean {
  if (grant.products === null) {
    return true;
  }
  if (!productId) {
    // No workspace product yet — treat as allowed if the user has the grant
    // for at least one product (menu should not stay grey forever).
    return grant.products.length > 0;
  }
  return grant.products.includes(productId);
}

export function hasActionGrant(
  permissions: EffectivePermissions | null | undefined,
  resource: string,
  action: string,
  productId?: string | null,
): boolean {
  if (!permissions || !resource || !action) {
    return false;
  }
  const resourceNode = permissions[resource];
  if (!resourceNode || typeof resourceNode !== 'object') {
    return false;
  }
  const grant = asGrant((resourceNode as Record<string, unknown>)[action]);
  if (!grant) {
    return false;
  }
  return grantAllowsProduct(grant, productId);
}

export function hasAnyActionOnResource(
  permissions: EffectivePermissions | null | undefined,
  resource: string,
  productId?: string | null,
): boolean {
  if (!permissions || !resource) {
    return false;
  }
  const resourceNode = permissions[resource];
  if (!resourceNode || typeof resourceNode !== 'object') {
    return false;
  }
  return Object.entries(resourceNode as Record<string, unknown>).some(
    ([key, value]) => {
      if (key === 'fields') {
        return false;
      }
      const grant = asGrant(value);
      return !!grant && grantAllowsProduct(grant, productId);
    },
  );
}

export function hasModuleAccess(
  permissions: EffectivePermissions | null | undefined,
  moduleKey: string,
): boolean {
  return permissions?.__moduleAccess?.[moduleKey] === true;
}

export function hasAnyReportAccess(
  permissions: EffectivePermissions | null | undefined,
  productId?: string | null,
): boolean {
  return REPORT_RESOURCES.some(
    resource =>
      hasActionGrant(permissions, resource, 'view', productId) ||
      hasAnyActionOnResource(permissions, resource, productId),
  );
}

/**
 * Evaluate a mobile permission key against the nested effective-permissions
 * payload. Keys are defined in `src/constants/permissions.ts`.
 */
export function evaluatePermissionKey(
  permissions: EffectivePermissions | null | undefined,
  permissionKey: string,
  productId?: string | null,
): boolean {
  if (!permissions || !permissionKey) {
    return false;
  }

  if (permissionKey === 'anyReport:view') {
    return hasAnyReportAccess(permissions, productId);
  }

  if (permissionKey.startsWith('module:')) {
    return hasModuleAccess(permissions, permissionKey.slice('module:'.length));
  }

  if (permissionKey.startsWith('any:')) {
    return hasAnyActionOnResource(
      permissions,
      permissionKey.slice('any:'.length),
      productId,
    );
  }

  const dot = permissionKey.indexOf('.');
  if (dot <= 0) {
    // Bare resource key → any action (legacy menu-style checks)
    return hasAnyActionOnResource(permissions, permissionKey, productId);
  }

  const resource = permissionKey.slice(0, dot);
  const action = permissionKey.slice(dot + 1);
  return hasActionGrant(permissions, resource, action, productId);
}
