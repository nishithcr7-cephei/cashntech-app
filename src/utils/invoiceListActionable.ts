import type {InvoiceListItemApi} from '@store/invoice/inv.types';

type ActionableRow = {
  actionable?: boolean | null;
  rawApprovalStatus?: string | null;
  rawAdminStatus?: string | null;
  rawInvoiceStatus?: string | null;
};

export type InvoiceEditRow = ActionableRow & {
  currentStepSequenceNo?: number | null;
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
 * Not shown to CashnTech admin (Vendor/Dealer makers raise finance request).
 */
export function canShowFinanceRequest(
  row: ActionableRow,
  canFinanceRequest: boolean,
  options?: {isCashnTechUser?: boolean},
): boolean {
  if (options?.isCashnTechUser) {
    return false;
  }
  return canFinanceRequest && row.actionable === true;
}

/**
 * Backend updateInvoice state gate (invoice.service.ts):
 * Draft | Rejected | current_step.sequence_no <= 2
 * UI also hides terminal invoice/admin statuses even when current_step is null
 * (backend treats null step as seq 0 — misleading for Submitted/Disbursed rows).
 */
export function isInvoiceEditableByBackendState(row: InvoiceEditRow): boolean {
  const status = (row.rawInvoiceStatus || '').trim();
  const adminS = (row.rawAdminStatus || '').trim().toLowerCase();

  if (['Draft', 'Rejected', 'REJECTED_BY_CHECKER'].includes(status)) {
    return true;
  }

  if (adminS === 'verified') {
    return false;
  }

  const terminalInvoice = [
    'submitted',
    'disbursed',
    'closed',
    'finance requested',
    'in progress',
  ];
  if (terminalInvoice.includes(status.toLowerCase())) {
    return false;
  }

  const seq = row.currentStepSequenceNo;
  if (typeof seq === 'number') {
    return seq <= 2;
  }

  return false;
}

/**
 * Edit re-runs workflow step 1 (Upload). Pull/VF → counterparty maker;
 * Push → anchor maker; CashnTech bypasses party role.
 */
export function canPerformInvoiceUploadEdit(context: {
  programMethod?: string | null;
  isAnchorMaker: boolean;
  isDealerMaker: boolean;
  isCashnTechUser: boolean;
  isAnchorAllAccess?: boolean;
  isDealerAllAccess?: boolean;
}): boolean {
  if (context.isCashnTechUser) {
    return true;
  }

  const method = (context.programMethod || '').trim().toLowerCase();
  if (method === 'push') {
    return !!(context.isAnchorMaker || context.isAnchorAllAccess);
  }

  return !!(context.isDealerMaker || context.isDealerAllAccess);
}

/** 3-dots Edit — permission + upload role + backend editable state. */
export function canShowInvoiceListEdit(
  row: InvoiceEditRow,
  canEdit: boolean,
  uploadContext: Parameters<typeof canPerformInvoiceUploadEdit>[0],
): boolean {
  if (!canEdit) {
    return false;
  }
  if (!canPerformInvoiceUploadEdit(uploadContext)) {
    return false;
  }
  return isInvoiceEditableByBackendState(row);
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
