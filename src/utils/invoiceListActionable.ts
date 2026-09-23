import type {InvoiceListItemApi} from '@store/invoice/inv.types';

type ActionableRow = {
  actionable?: boolean | null;
  rawApprovalStatus?: string | null;
  rawAdminStatus?: string | null;
  rawInvoiceStatus?: string | null;
  /** Workflow step action — Approve | Finance Request | Verify | Upload */
  currentStepActionType?: string | null;
};

function normalizeStepActionType(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

function isPartyApproveStep(row: ActionableRow): boolean {
  const actionType = row.currentStepActionType;
  if (actionType?.trim()) {
    return normalizeStepActionType(actionType) === 'approve';
  }
  return true;
}

function isFinanceRequestStep(row: ActionableRow): boolean {
  const actionType = row.currentStepActionType;
  if (!actionType?.trim()) {
    return false;
  }
  return normalizeStepActionType(actionType) === 'finance request';
}

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
    return row.actionable && hasPermission && isPartyApproveStep(row);
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
 * CashnTech / bank: Invoice Verification menu — same turn as pending-count
 * (`actionable`). Do not require step === verify: admin 3-dots must still offer
 * Approve/Reject while the invoice is on their turn. Fallback to Pending
 * Verification only when actionable is absent from the API.
 */
export function canShowCashnTechInvoiceVerification(
  row: ActionableRow,
  canVerify: boolean,
): boolean {
  return isCashnTechPendingRow(row, canVerify);
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
  return (
    canFinanceRequest && row.actionable === true && isFinanceRequestStep(row)
  );
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
 * 3-dots Delete — permission + backend list `deletable` when present.
 * Falls back to Disbursed/Closed hide for older API responses.
 */
export function canShowInvoiceListDelete(
  row: Pick<InvoiceEditRow, 'rawInvoiceStatus'>,
  canDelete: boolean,
  listDeletable?: boolean,
): boolean {
  if (!canDelete) {
    return false;
  }
  if (typeof listDeletable === 'boolean') {
    return listDeletable;
  }
  const status = (row.rawInvoiceStatus || '').trim().toLowerCase();
  if (status.includes('disbursed') || status === 'closed') {
    return false;
  }
  return true;
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

type PendingApprovalDotContext = {
  isCashnTechUser?: boolean;
  canVerify?: boolean;
  isAnchorMaker?: boolean;
  isDealerMaker?: boolean;
  isAnchorChecker?: boolean;
  isDealerChecker?: boolean;
  isAnchorAllAccess?: boolean;
  isDealerAllAccess?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  /** ROLE_LABELS value, e.g. "Anchor Checker" */
  roleLabel?: string;
  /** Workflow approval level string when present */
  approvalLevel?: string;
};

/**
 * Same rules as invoice-list "Pending Invoice Approval" badge count.
 * Count only invoices waiting on this user's turn (actionable / pending role).
 */
export function isPendingInvoiceApprovalRow(
  row: ActionableRow,
  context: PendingApprovalDotContext,
): boolean {
  if (context.isCashnTechUser) {
    return isCashnTechPendingRow(row, !!context.canVerify);
  }

  const iStatusRaw = (row.rawInvoiceStatus || '').trim();
  const approvalStatus = (row.rawApprovalStatus || '').trim();
  const approvalS = approvalStatus.toLowerCase().replace(/_/g, ' ');
  const approvalSUpper = approvalStatus.toUpperCase().replace(/_/g, ' ');

  const isActionablePerm = !!(context.canApprove || context.canReject);

  if (typeof row.actionable === 'boolean') {
    return isActionablePerm && row.actionable === true && iStatusRaw === 'Created';
  }

  if (context.isAnchorAllAccess) {
    return (
      iStatusRaw === 'Created' &&
      (approvalSUpper.includes('PENDING ANCHOR MAKER') ||
        approvalSUpper.includes('PENDING ANCHOR CHECKER'))
    );
  }
  if (context.isDealerAllAccess) {
    return (
      iStatusRaw === 'Created' &&
      (approvalSUpper.includes('PENDING DEALER MAKER') ||
        approvalSUpper.includes('PENDING DEALER CHECKER'))
    );
  }

  const myApprovalLevel = String(context.approvalLevel || '');
  const roleLabel = (context.roleLabel || '').trim().toUpperCase();
  const isMyLevel =
    (!!myApprovalLevel && approvalStatus === myApprovalLevel) ||
    (context.isAnchorMaker && approvalS.includes('pending anchor maker')) ||
    (context.isAnchorChecker && approvalS.includes('pending anchor checker')) ||
    (context.isDealerMaker && approvalS.includes('pending dealer maker')) ||
    (context.isDealerChecker && approvalS.includes('pending dealer checker')) ||
    (!!roleLabel && approvalSUpper.includes(`PENDING ${roleLabel}`));

  return isActionablePerm && isMyLevel && iStatusRaw === 'Created';
}

export function readActionableFromApi(
  item: InvoiceListItemApi,
): boolean | undefined {
  return typeof item.actionable === 'boolean' ? item.actionable : undefined;
}
