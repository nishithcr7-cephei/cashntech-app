import {
  deriveCapabilityFromUser,
  isMakerCapability,
  type RoleNormalizeInput,
} from '@utils/roleNormalizer';

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
