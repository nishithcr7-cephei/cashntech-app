import type {AppRole} from '@constants/roles';
import {
  deriveCapabilityFromUser,
  toLegacyAppRole,
  type RoleNormalizeInput,
} from '@utils/roleNormalizer';

/**
 * Derives AppRole from user data (permission_group, optional product_roles, first_name).
 * Thin wrapper over the PR3 role normalization layer — DF behavior preserved;
 * Vendor Maker/Checker map to dealer_* AppRoles (same action categories).
 */
export function deriveAppRoleFromUser(user: RoleNormalizeInput): AppRole {
  return toLegacyAppRole(deriveCapabilityFromUser(user));
}
