import type {AppRole} from '@constants/roles';
import {
  deriveCapabilityFromUser,
  isMakerCapability,
  normalizeRoleString,
  toLegacyAppRole,
  type RoleNormalizeInput,
} from '@utils/roleNormalizer';

/**
 * Program role from /user/scope ("Anchor All Access", "Vendor Maker", ...)
 * → AppRole. Vendor maps to dealer_*. Null when the label is unrecognised.
 */
export function toProgramAppRole(
  rawRole: string | null | undefined,
): AppRole | null {
  const capability = normalizeRoleString(rawRole);
  return capability ? toLegacyAppRole(capability) : null;
}

/**
 * Push → anchor maker / anchor all access; Pull → counterparty maker /
 * counterparty all access. Checkers never create.
 */
export function canCreateInvoiceForMethod(
  programMethod: string | null | undefined,
  role: AppRole | null | undefined,
): boolean {
  if (programMethod === 'Push') {
    return role === 'anchor_maker' || role === 'anchor_all_access';
  }
  if (programMethod === 'Pull') {
    return role === 'dealer_maker' || role === 'dealer_all_access';
  }
  return false;
}

/**
 * Helper to determine if the "Create Invoice" button should be visible.
 * Replicates Web Portal logic based on user roles and permissions.
 *
 * Uses the shared role normalizer so Vendor Maker/Checker follow the same
 * maker/checker rules as Dealer (and Anchor) without parsing free-text here.
 */
export function shouldShowCreateInvoice(
  user: RoleNormalizeInput | null | undefined,
  hasPermission: boolean,
): boolean {
  // Requirement: Permission string check first
  if (!hasPermission) {
    return false;
  }

  const pg = Array.isArray(user?.permission_group)
    ? user?.permission_group?.[0]
    : undefined;
  const bizRole = (pg?.business_role || '').toLowerCase().trim();
  const funcRole = (pg?.functional_role || '').toLowerCase().trim();

  // Rule 3: SHOW if both business_role and functional_role are null or empty
  // (e.g., IT Department or All Access users without explicit PG roles)
  if (!bizRole && !funcRole) {
    return true;
  }

  // Rule 1: HIDE if functional role resolves to Checker (not all_access)
  // Rule 2: SHOW if Maker or All Access
  const capability = deriveCapabilityFromUser(user || {});
  if (capability.functional === 'checker') {
    return false;
  }
  if (isMakerCapability(capability)) {
    return true;
  }

  // Default: Fallback to showing if permission exists, unless explicitly hidden above
  return true;
}
