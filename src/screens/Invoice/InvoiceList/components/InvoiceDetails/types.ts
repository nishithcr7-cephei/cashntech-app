import type {InvoiceListItemApi} from '@store/invoice/inv.types';
import type {InvoiceApprovalLogApi} from '@services/api/invoice.api';
import type {CheckerApprovalEntry} from '@components/CheckerApprovalModal/CheckerApprovalModal';
import {decryptValue} from '@utils/decrypt';

export const NA_AD = 'N/A/AD';

export function mapApprovalLogToEntry(
  log: InvoiceApprovalLogApi | Record<string, any>,
): CheckerApprovalEntry {
  const user = log?.user ?? {};
  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const approvedBy =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : (log as any).action_by_role ?? (log as any).actionByRole ?? 'Unknown';
  const status: 'Approved' | 'Rejected' =
    log.action === 'Approve' || log.action === 'Verify' ? 'Approved' : 'Rejected';
  const role = (log as any).action_by_role ?? (log as any).actionByRole ?? '';
  const approvalLevelRaw = log.role_approval_level;
  const approvalLevel =
    typeof approvalLevelRaw === 'number'
      ? String(approvalLevelRaw)
      : approvalLevelRaw != null
        ? String(approvalLevelRaw)
        : undefined;
  const action = log.action ?? '';
  const remark = log.remark ?? '';
  const rejectionReason =
    (log as any).rejection_reason ?? (log as any).rejectionReason ?? '';
  return {
    id: log.id ?? String(Math.random()),
    approvedBy,
    approvalDate: formatDateDash((log as any).action_at ?? (log as any).actionAt ?? ''),
    status,
    role,
    approvalLevel,
    action,
    remark,
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

export function formatStatus(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export type InvoiceRow = {
  id: string;
  dealerName: string;
  dealerCode: string;
  creditAccountNumber?: string;
  invoiceNo: string;
  invoiceAmount: string;
  invoiceDate: string;
  requestDate: string;
  dueDate: string;
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
};

export function mapApiToRow(item: InvoiceListItemApi): InvoiceRow {
  const counterParty =
    decryptValue(
      item.counter_party_name ??
        item.anchorParticipantMapping?.party?.entity_name ??
        '',
    ) || '-';
  const rawAccountNumber =
    item.program?.bank_details?.[0]?.account_number ?? '';
  const creditAccountNumber =
    decryptValue(rawAccountNumber) || rawAccountNumber || '-';

  return {
    id: item.id,
    dealerName: counterParty,
    dealerCode: item.counter_party_code,
    creditAccountNumber,
    invoiceNo: item.invoice_ref_no,
    invoiceAmount:
      item.invoice_amount ??
      (item.final_total != null
        ? `${Number(item.final_total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`
        : '-'),
    invoiceDate: formatDateDash(item.invoice_date),
    requestDate: formatDateDash(item.request_date ?? item.created_at ?? ''),
    dueDate: formatDateDash(item.invoice_due_date),
    invoiceStatus: item.invoice_status ? formatStatus(item.invoice_status) : '',
    approvalStatus: item.approval_status ? formatStatus(item.approval_status) : '',
    adminStatus: item.admin_status ? formatStatus(item.admin_status) : '',
    rawInvoiceStatus: item.invoice_status,
    rawApprovalStatus: item.approval_status,
    rawAdminStatus: item.admin_status,
    loanRefNo: item.loan_ref_no ?? '-',
    bankName:
      item.bank_name ??
      item.program?.productConfig?.partnerBank?.bank_name ??
      '-',
    productName:
      item.product_name ??
      item.program?.productConfig?.product?.name ??
      '-',
    programName: item.program_name ?? item.program?.program_name ?? '-',
    primaryParty:
      decryptValue(
        item.primary_party_name ?? item.party?.entity_name ?? '',
      ) || '-',
    counterParty,
    approvalLogsCount: Array.isArray(item.approvalLogs) ? item.approvalLogs.length : 0,
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
