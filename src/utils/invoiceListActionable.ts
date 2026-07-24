import type {InvoiceListItemApi} from '@store/invoice/inv.types';

type ActionableRow = {
  actionable?: boolean | null;
  rawApprovalStatus?: string | null;
  rawAdminStatus?: string | null;
  rawInvoiceStatus?: string | null;
};

type LegacyTurnContext = {
  isCashnTechUser?: boolean;
  isAnchorAllAccess?: boolean;
  isDealerAllAccess?: boolean;
  roleLabel?: string;
};

function isPendingVerificationStatus(adminStatus?: string | null): boolean {
  const aStatus = (adminStatus || '').trim().toLowerCase().replace(/_/g, ' ');
  return aStatus === 'pending verification';
}

/**
 * Whether Approve/Reject (workflow) should be offered for party users.
 * Prefers list `actionable` from unified backend; falls back to legacy parsing only when absent.
 */
export function canShowWorkflowApproveReject(
  row: ActionableRow,
  hasPermission: boolean,
  legacy: LegacyTurnContext,
): boolean {
  if (!hasPermission) {
    return false;
  }

  if (typeof row.actionable === 'boolean') {
    return row.actionable && hasPermission;
  }

  const iStatus = (row.rawInvoiceStatus || '').toLowerCase();
  const aStatus = (row.rawAdminStatus || '').toLowerCase();
  const isDraftState = ['draft', 'pending attachment', 'attachment pending'].includes(
    iStatus,
  );
  const isTerminalState = ['verified', 'rejected'].includes(aStatus);
  if (isDraftState || isTerminalState) {
    return false;
  }

  const approvalS = (row.rawApprovalStatus || '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ');

  if (legacy.isCashnTechUser) {
    return isPendingVerificationStatus(row.rawAdminStatus);
  }

  if (legacy.isAnchorAllAccess || legacy.isDealerAllAccess) {
    const base = legacy.isAnchorAllAccess ? 'ANCHOR' : 'DEALER';
    return (
      approvalS.includes(`PENDING ${base} CHECKER`) ||
      approvalS.includes(`PENDING ${base} MAKER`)
    );
  }

  const roleLabel = (legacy.roleLabel || '').trim().toUpperCase();
  return !!roleLabel && approvalS.includes(`PENDING ${roleLabel}`);
}

/**
 * CashnTech / bank: Invoice Verification menu — actionable && invoice_verification.
 * Fallback to Pending Verification only when actionable is absent from the API.
 */
export function canShowCashnTechInvoiceVerification(
  row: ActionableRow,
  canVerify: boolean,
): boolean {
  if (!canVerify) {
    return false;
  }
  if (typeof row.actionable === 'boolean') {
    return row.actionable;
  }
  return isPendingVerificationStatus(row.rawAdminStatus);
}

/**
 * Finance Request menu — actionable && finance_request permission.
 * No legacy admin_status fallback (matches web).
 */
export function canShowFinanceRequest(
  row: ActionableRow,
  canFinanceRequest: boolean,
): boolean {
  return canFinanceRequest && row.actionable === true;
}

/**
 * Bulk-select / pending eligibility.
 * CashnTech: actionable && invoice_verification (web Ze pending count).
 * Fallback to Pending Verification only when actionable is undefined.
 */
export function isInvoiceBulkSelectable(
  row: ActionableRow,
  context: {
    isCashnTechUser: boolean;
    hasFunctionalPermission: boolean;
    canVerify: boolean;
  },
): boolean {
  if (typeof row.actionable === 'boolean') {
    if (context.isCashnTechUser) {
      return row.actionable && context.canVerify;
    }
    return row.actionable && context.hasFunctionalPermission;
  }

  if (context.isCashnTechUser) {
    return context.canVerify && isPendingVerificationStatus(row.rawAdminStatus);
  }

  return false;
}

/**
 * Pending badge count for a single row (CashnTech / bank path).
 */
export function isCashnTechPendingRow(
  row: ActionableRow,
  canVerify: boolean,
): boolean {
  if (!canVerify) {
    return false;
  }
  if (typeof row.actionable === 'boolean') {
    return row.actionable;
  }
  return isPendingVerificationStatus(row.rawAdminStatus);
}

export function readActionableFromApi(
  item: InvoiceListItemApi,
): boolean | undefined {
  return typeof item.actionable === 'boolean' ? item.actionable : undefined;
}
