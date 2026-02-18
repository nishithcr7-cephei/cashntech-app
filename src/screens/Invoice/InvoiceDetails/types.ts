import type {InvoiceListItemApi} from '@store/invoice/inv.types';

export const NA_AD = 'N/A/AD';

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

/** dd-mm-yyyy for table/card display to match design */
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
  dealerName: string;       // Primary Party (Anchors)
  dealerCode: string;
  invoiceNo: string;
  invoiceAmount: string;    // e.g. "25,000.00/-"
  invoiceDate: string;
  requestDate: string;      // Request Date
  dueDate: string;          // Due Date (invoice_due_date)
  invoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;      // e.g. "Verify", "Hold", "Reject"
};

export function mapApiToRow(item: InvoiceListItemApi): InvoiceRow {
  return {
    id: item.id,
    dealerName: item.counter_party_name,
    dealerCode: item.counter_party_code,
    invoiceNo: item.invoice_ref_no,
    invoiceAmount: item.invoice_amount ?? '25,000.00/-',
    invoiceDate: formatDateDash(item.invoice_date),
    requestDate: item.request_date ? formatDateDash(item.request_date) : 'dd-mm-yyyy',
    dueDate: formatDateDash(item.invoice_due_date),
    invoiceStatus: formatStatus(item.invoice_status),
    approvalStatus: formatStatus(item.approval_status),
    adminStatus: item.admin_status ? formatStatus(item.admin_status) : 'Verify',
  };
}

export const invoiceFilterData = {
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
