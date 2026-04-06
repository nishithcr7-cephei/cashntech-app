/**
 * Helper to determine if the "Create Invoice" button should be visible.
 * Replicates Web Portal logic based on user roles and permissions.
 */
export function shouldShowCreateInvoice(user: any, hasPermission: boolean): boolean {
  // Requirement: Permission string check first
  if (!hasPermission) return false;

  const pg = user?.permission_group?.[0];
  const bizRole = pg?.business_role?.toLowerCase() || '';
  const funcRole = pg?.functional_role?.toLowerCase() || '';

  // Rule 3: SHOW if both business_role and functional_role are null or empty 
  // (e.g., IT Department or All Access users)
  if (!bizRole && !funcRole) return true;

  // Rule 1: HIDE if functional_role is "Checker"
  if (funcRole.includes('checker')) return false;

  // Rule 2: SHOW if functional_role is "Maker"
  if (funcRole.includes('maker')) return true;

  // Default: Fallback to showing if permission exists, unless explicitly hidden above
  return true;
}
