/**
 * Exact invoice_master status strings — must match backend
 * `src/common/constants/invoice-status.constants.ts`; the list/consolidated
 * filters compare these with `$in`, so labels must not be reformatted.
 */
export const INVOICE_STATUS_OPTIONS = [
  'Draft',
  'Created',
  'Finance Requested',
  'In Progress',
  'On Hold',
  'Rejected',
  'Submitted',
  'Disbursed',
  'Closed',
] as const;

/**
 * Multi-admin workflows also write "Pending Verification (<Admin>)"; those rows
 * do not match the plain "Pending Verification" filter value.
 */
export const ADMIN_STATUS_OPTIONS = [
  'Pending Verification',
  'Verified',
  'Rejected',
  'On Hold',
] as const;
