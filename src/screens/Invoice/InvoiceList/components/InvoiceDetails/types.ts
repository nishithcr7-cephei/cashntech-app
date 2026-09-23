import type {InvoiceListItemApi} from '@store/invoice/inv.types';
import type {InvoiceApprovalLogApi} from '@services/api/invoice.api';
import type {CheckerApprovalEntry} from '@components/CheckerApprovalModal/CheckerApprovalModal';
import type {WorkflowStep} from '@components/InvoiceTrackingModal/InvoiceTrackingModal';
import {decryptValue} from '@utils/decrypt';
import {formatStatus} from '@utils/invoiceStatusDisplay';

export {formatStatus};

export const NA_AD = 'N/A/AD';

function readApprovalLogUserName(log: InvoiceApprovalLogApi | Record<string, any>): string {
  const user = log?.user ?? {};
  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  return '';
}

function readApprovalLogRole(log: InvoiceApprovalLogApi | Record<string, any>): string {
  const raw =
    (log as any).action_by_role ??
    (log as any).actionByRole ??
    (log as any).role ??
    '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';
  // Backend sometimes sends "Vendor Maker (Workflow Name)" — show role only.
  const parenIdx = trimmed.indexOf('(');
  if (parenIdx > 0) {
    return trimmed.slice(0, parenIdx).trim();
  }
  return trimmed;
}

/** Remark / rejection text from approval log (web parity). */
function readApprovalLogRemark(
  log: InvoiceApprovalLogApi | Record<string, any>,
): string | undefined {
  const action = String(log.action ?? '').toLowerCase();
  const candidates = [
    log.remark,
    (log as any).approvalRemark,
    (log as any).approval_remark,
    (log as any).rejection_reason,
    (log as any).rejectionReason,
    (log as any).comments,
  ];
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim();
    if (!text || text === '-' || text === 'null' || text === 'undefined') {
      continue;
    }
    return text;
  }
  // Reject without explicit remark — nothing to show
  if (action.includes('reject')) {
    return undefined;
  }
  return undefined;
}

/** Web-style timeline timestamp: "21 Jul, 04:48 PM" */
export function formatTimelineTimestamp(isoDate: string): string {
  if (!isoDate) return '-';
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', {month: 'short'});
    const time = d
      .toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .replace(/\u202f/g, ' ');
    return `${day} ${month},\u00A0${time}`;
  } catch {
    return isoDate;
  }
}

function resolveTimelineStatus(
  action?: string | null,
  rejectionReason?: string | null,
): WorkflowStep['status'] {
  const a = (action || '').toLowerCase();
  if (a.includes('reject') || (rejectionReason || '').trim()) {
    return 'rejected';
  }
  return 'completed';
}

export function mapApprovalLogToTimelineStep(
  log: InvoiceApprovalLogApi | Record<string, any>,
): WorkflowStep {
  const roleLabel = readApprovalLogRole(log);
  const userName = readApprovalLogUserName(log);
  const action = log.action ?? '';
  const rejectionReason =
    (log as any).rejection_reason ?? (log as any).rejectionReason ?? '';
  const remark = readApprovalLogRemark(log);
  const rejectionText =
    (rejectionReason || '').trim() &&
    (rejectionReason || '').trim() !== '-' &&
    (rejectionReason || '').trim() !== remark
      ? (rejectionReason || '').trim()
      : undefined;
  return {
    id: log.id ?? String(Math.random()),
    action,
    roleLabel,
    userName: userName || 'Unknown',
    timestamp: formatTimelineTimestamp(
      (log as any).action_at ?? (log as any).actionAt ?? '',
    ),
    status: resolveTimelineStatus(action, rejectionReason),
    remark,
    rejectionReason: rejectionText,
  };
}

export function mapApprovalLogToEntry(
  log: InvoiceApprovalLogApi | Record<string, any>,
): CheckerApprovalEntry {
  const userName = readApprovalLogUserName(log);
  const role = readApprovalLogRole(log);
  const approvedBy = userName || role || 'Unknown';
  const action = log.action ?? '';
  const rejectionReason =
    (log as any).rejection_reason ?? (log as any).rejectionReason ?? '';
  const status: 'Approved' | 'Rejected' =
    resolveTimelineStatus(action, rejectionReason) === 'rejected'
      ? 'Rejected'
      : 'Approved';
  const approvalLevelRaw = log.role_approval_level;
  const approvalLevel =
    typeof approvalLevelRaw === 'number'
      ? String(approvalLevelRaw)
      : approvalLevelRaw != null
        ? String(approvalLevelRaw)
        : undefined;
  return {
    id: log.id ?? String(Math.random()),
    approvedBy,
    approvalDate: formatDateDash((log as any).action_at ?? (log as any).actionAt ?? ''),
    status,
    role,
    approvalLevel,
    action,
    remark: log.remark ?? '',
    rejectionReason,
  };
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

export function formatDateDash(isoDate: string): string {
  if (!isoDate) return 'dd-mm-yyyy';
  try {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return isoDate;
  }
}

function formatListAmount(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}/-`;
}

/**
 * DRA from API waterfall only:
 *   Invoice Amount (= sub − discount + tax) − TDS
 * Never use final_total (that is Net Disbursement).
 * List API usually omits these → returns '-'.
 */
function resolveDisbursementRequestedAmount(
  item: InvoiceListItemApi,
): string {
  const subRaw = item.sub_total;
  const subTotal =
    subRaw != null && subRaw !== '' ? Number(subRaw) : Number.NaN;
  const discountTotal = Number(item.discount_total) || 0;
  const taxTotal = Number(item.tax_total) || 0;
  const tdsAmount = Number(item.tds_amount) || 0;

  if (Number.isFinite(subTotal) && subTotal > 0) {
    const invoiceAmount = Math.max(0, subTotal - discountTotal + taxTotal);
    return formatListAmount(Math.max(0, invoiceAmount - tdsAmount));
  }

  // Bulk-upload rows often store amount in final_total_after_tds with sub_total=0.
  const draRaw = item.final_total_after_tds;
  if (draRaw != null && draRaw !== '') {
    const dra = Number(draRaw);
    if (Number.isFinite(dra)) {
      return formatListAmount(dra);
    }
  }

  return '-';
}

export type InvoiceRow = {
  id: string;
  dealerName: string;
  dealerCode: string;
  creditAccountNumber?: string;
  invoiceNo: string;
  invoiceAmount: string;
  /** From API waterfall when present; else '-' (do not invent from final_total) */
  disbursementRequestedAmount: string;
  invoiceDate: string;
  requestDate: string;
  dueDate: string;
  /** List column — empty string when not set */
  grnDate: string;
  invoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;
  rawInvoiceStatus?: string;
  rawApprovalStatus?: string;
  rawAdminStatus?: string;
  loanRefNo: string;
  bankName: string;
  productName: string;
  programName: string;
  primaryParty: string;
  counterParty: string;
  approvalLogsCount: number;
  absoluteIndex?: number;
  /** From list API — drives Approve/Reject when present */
  actionable?: boolean;
  /** From list API — drives Delete visibility when present */
  deletable?: boolean;
  currentStepRole?: string;
  currentStepActionType?: string;
  /** Backend edit gate: sequence_no <= 2 (or Draft/Rejected) */
  currentStepSequenceNo?: number | null;
};

export function mapApiToRow(item: InvoiceListItemApi): InvoiceRow {
  const counterParty =
    decryptValue(
      item.counter_party_name ??
        item.programVendorDetails?.vendor_name ??
        item.anchorParticipantMapping?.party?.entity_name ??
        '',
    ) || '-';
  const rawAccountNumber =
    item.program?.bank_details?.[0]?.account_number ?? '';
  const creditAccountNumber =
    decryptValue(rawAccountNumber) || rawAccountNumber || '-';

  const finalTotal =
    item.final_total != null && item.final_total !== ''
      ? Number(item.final_total)
      : NaN;

  return {
    id: item.id,
    dealerName: counterParty,
    dealerCode: item.counter_party_code,
    creditAccountNumber,
    invoiceNo: item.invoice_ref_no,
    invoiceAmount:
      item.invoice_amount ??
      (Number.isFinite(finalTotal) ? formatListAmount(finalTotal) : '-'),
    disbursementRequestedAmount: resolveDisbursementRequestedAmount(item),
    invoiceDate: formatDateDash(item.invoice_date),
    requestDate: formatDateDash(item.request_date ?? item.created_at ?? ''),
    dueDate: formatDateDash(item.invoice_due_date),
    grnDate: item.grn_date ? formatDateDash(String(item.grn_date)) : '',
    invoiceStatus: item.invoice_status ? formatStatus(item.invoice_status) : '',
    approvalStatus: item.approval_status ? formatStatus(item.approval_status) : '',
    adminStatus: item.admin_status ? formatStatus(item.admin_status) : '',
    rawInvoiceStatus: item.invoice_status,
    rawApprovalStatus: item.approval_status,
    rawAdminStatus: item.admin_status,
    loanRefNo: item.loan_ref_no ?? '-',
    bankName:
      item.bank_name ??
      item.partnerBank?.bank_name ??
      item.program?.productConfig?.partnerBank?.bank_name ??
      '-',
    productName:
      item.product?.name ||
      item.product_name ||
      item.program?.productConfig?.product?.name ||
      '-',
    programName: item.program_name ?? item.program?.program_name ?? '-',
    primaryParty:
      decryptValue(
        item.primary_party_name ?? item.party?.entity_name ?? '',
      ) || '-',
    counterParty,
    approvalLogsCount: Array.isArray(item.approvalLogs) ? item.approvalLogs.length : 0,
    actionable: typeof item.actionable === 'boolean' ? item.actionable : undefined,
    deletable: typeof item.deletable === 'boolean' ? item.deletable : undefined,
    currentStepRole: item.current_step?.role,
    currentStepActionType: item.current_step?.action_type,
    currentStepSequenceNo:
      typeof item.current_step?.sequence_no === 'number'
        ? item.current_step.sequence_no
        : null,
  };
}

export const invoiceFilterData = {
  'Bank': ['UGRO', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI'],
  'Product': ['Dealer Finance', 'Vendor Finance', 'PID', 'SID', 'OD'],
  'Program': ['UGRO DF Program', 'TCL DF Program', 'Sun Pharma PGM', 'Demo Program'],
  'Primary Party': ['Sun Pharma', 'Cipla', '24 hrs medical bodakdev', 'Hero Finance'],
  'Counter Party': ['24 hrs medical', 'All India Medicc', 'Rudraksh Medic...', 'Demo Dealer Pv...'],
  'Invoice Status': ['CREATED', 'IN_PROGRESS', 'SUBMITTED', 'REJECTED'],
  'Approval Status': [
    'PENDING_ANCHOR_CHECKER',
    'PENDING_DEALER_MAKER',
    'PENDING_DEALER_CHECKER',
    'APPROVAL_COMPLETE',
    'REJECTED_BY_ANCHOR_CHECKER',
    'REJECTED_BY_DEALER_MAKER',
    'REJECTED_BY_DEALER_CHECKER',
  ],
};
