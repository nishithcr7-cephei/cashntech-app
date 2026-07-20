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

/**
 * Whether Approve/Reject (workflow) should be offered.
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
    return (row.rawAdminStatus || '').trim().toUpperCase().includes('PENDING');
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
      const aStatus = (row.rawAdminStatus || '').toLowerCase();
      return (
        row.actionable &&
        context.canVerify &&
        (aStatus === 'pending verification' || aStatus === 'pending_verification')
      );
    }
    return row.actionable && context.hasFunctionalPermission;
  }

  return false;
}

export function readActionableFromApi(
  item: InvoiceListItemApi,
): boolean | undefined {
  return typeof item.actionable === 'boolean' ? item.actionable : undefined;
}
