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
  dealerName: string;       // Primary Party (Anchors) / counter party display
  dealerCode: string;
  invoiceNo: string;
  invoiceAmount: string;   // e.g. "25,000.00/-"
  invoiceDate: string;
  requestDate: string;
  dueDate: string;
  invoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;
  /** Web-aligned columns */
  loanRefNo: string;
  bankName: string;
  productName: string;
  programName: string;
  primaryParty: string;
  counterParty: string;
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
    loanRefNo: item.loan_ref_no ?? '-',
    bankName: item.bank_name ?? '-',
    productName: item.product_name ?? '-',
    programName: item.program_name ?? '-',
    primaryParty: item.primary_party_name ?? item.counter_party_name ?? '-',
    counterParty: item.counter_party_name ?? '-',
  };
}

/** Filter view for Invoice List & Approvals – matches web: Bank, Product, Program, Primary Party, Counter Party */
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
