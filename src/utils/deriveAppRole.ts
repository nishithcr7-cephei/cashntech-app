import type {AppRole} from '@constants/roles';

type PermissionItem = {
  department?: string;
  business_role?: string;
  functional_role?: string;
};

/**
 * Derives AppRole from user data (permission_group or first_name).
 * Role is determined by username/permissions - Anchor Maker, Dealer Checker, etc.
 */
export function deriveAppRoleFromUser(user: {
  first_name?: string;
  user_type?: string;
  permission_group?: PermissionItem[] | { getItems?: () => PermissionItem[] };
}): AppRole {
  const userType = (user?.user_type || '').toLowerCase();
  if (userType === 'cashntech') return 'cashntech_user';
  const fn = (user?.first_name || '').toLowerCase();
  const perms = Array.isArray(user?.permission_group)
    ? user.permission_group
    : (user?.permission_group as { getItems?: () => PermissionItem[] })?.getItems?.() ?? [];

  for (const p of perms) {
    const dept = (p?.department || '').toLowerCase();
    const bizRole = (p?.business_role || '').toLowerCase();
    const funcRole = (p?.functional_role || '').toLowerCase();
    const isAnchor = dept.includes('anchor') || bizRole.includes('anchor');
    const isDealer = dept.includes('dealer') || bizRole.includes('dealer');
    if (isAnchor && funcRole.includes('maker')) return 'anchor_maker';
    if (isAnchor && funcRole.includes('checker')) return 'anchor_checker';
    if (isDealer && funcRole.includes('maker')) return 'dealer_maker';
    if (isDealer && funcRole.includes('checker')) return 'dealer_checker';
  }

  if (fn.includes('anchor') && fn.includes('maker')) return 'anchor_maker';
  if (fn.includes('anchor') && fn.includes('checker')) return 'anchor_checker';
  if (fn.includes('dealer') && fn.includes('maker')) return 'dealer_maker';
  if (fn.includes('dealer') && fn.includes('checker')) return 'dealer_checker';

  return 'cashntech_user';
}
