import {Colors} from '@constants/index';

function formatStatus(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const INVOICE_STATUS_COLORS = {
  ATTACHMENT_PENDING: {backgroundColor: '#FFF4E5', color: '#FF8C00'},
  CREATED: {backgroundColor: '#E3F2FD', color: '#1976D2'},
  DISBURSED: {backgroundColor: '#E8F5E9', color: '#2E7D32'},
  REJECTED: {backgroundColor: '#FFEBEE', color: '#D32F2F'},
  DEFAULT: {backgroundColor: '#F7F8FB', color: Colors.darkblack},
};

export function getInvoiceStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('attachment pending') || s.includes('draft')) {
    return INVOICE_STATUS_COLORS.ATTACHMENT_PENDING;
  }
  if (s.includes('created')) return INVOICE_STATUS_COLORS.CREATED;
  if (s.includes('disbursed') || s.includes('submitted')) {
    return INVOICE_STATUS_COLORS.DISBURSED;
  }
  if (s.includes('reject')) return INVOICE_STATUS_COLORS.REJECTED;
  return INVOICE_STATUS_COLORS.DEFAULT;
}

export function getApprovalStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('pending') || s.includes('will go')) {
    return INVOICE_STATUS_COLORS.ATTACHMENT_PENDING;
  }
  if (s.includes('reject')) return INVOICE_STATUS_COLORS.REJECTED;
  if (s.includes('completed') || s.includes('approval complete')) {
    return INVOICE_STATUS_COLORS.DISBURSED;
  }
  return INVOICE_STATUS_COLORS.DEFAULT;
}

export function getAdminStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'verify' || s === 'verified' || s === 'submitted') {
    return INVOICE_STATUS_COLORS.DISBURSED;
  }
  if (s === 'hold' || s.includes('hold')) {
    return {backgroundColor: '#E0E0E0', color: '#6B5B4F'};
  }
  if (s === 'reject' || s === 'rejected') return INVOICE_STATUS_COLORS.REJECTED;
  if (s.includes('pending')) return INVOICE_STATUS_COLORS.ATTACHMENT_PENDING;
  return INVOICE_STATUS_COLORS.DEFAULT;
}

/** Role the invoice waits on — from approval_status or current_step.role. */
export function resolveApprovalStatusLabel(
  approvalStatus?: string | null,
  currentStepRole?: string | null,
): string {
  const fromStatus = formatStatus(String(approvalStatus || '').trim());
  if (fromStatus) return fromStatus;
  const role = String(currentStepRole || '').trim();
  if (!role) return '';
  return `Pending ${formatStatus(role)}`;
}

/**
 * Create-invoice preview (invoice not saved yet).
 * Next step is the counterpart checker of the uploading maker.
 */
export function expectedNextApprovalAfterCreate(opts: {
  method?: string | null;
  isVendorFinance: boolean;
  userRole?: string | null;
}): string {
  const role = String(opts.userRole || '').toLowerCase();
  const method = String(opts.method || '').toLowerCase();
  const checkerLabel = opts.isVendorFinance
    ? 'Vendor Checker'
    : 'Dealer Checker';

  if (role.includes('anchor') && role.includes('maker')) {
    return 'Pending Anchor Checker';
  }
  if (
    (role.includes('dealer') || role.includes('vendor')) &&
    role.includes('maker')
  ) {
    return `Pending ${checkerLabel}`;
  }
  if (method === 'push') {
    return 'Pending Anchor Checker';
  }
  return `Pending ${checkerLabel}`;
}

export function formatPendingWithChip(
  approvalStatus: string,
  mode: 'preview' | 'live',
): string {
  const raw = String(approvalStatus || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower === 'completed' || lower.includes('approval complete')) {
    return mode === 'live' ? raw : '';
  }
  const role = raw.replace(/^pending\s+/i, '').trim();
  if (mode === 'preview') {
    return role ? `Will go to: ${role}` : raw;
  }
  if (/^pending\s+/i.test(raw)) {
    return `Pending with: ${role}`;
  }
  return raw;
}
