export type InvoiceOverviewSummaryItem = {
  id: string;
  program_name: string;
  partyName: string;
  od_account_no: string | null;
  counterPartyName: string | null;
  sanctioned_limit: number | null;
  drawing_power: number | null;
  od_expiry_date: string | null;
};

export type InvoiceOverviewLatestItem = {
  id: string;
  invoice_ref_no: string;
  partyName?: string;
  counterPartyName?: string;
  invoice_date?: string;
  invoice_due_date?: string;
  grn_date?: string;
  invoice_status?: string;
  approval_status?: string;
  admin_status?: string;
  final_total?: number;
  utr_no?: string;
};

export type InvoiceOverviewState = {
  summary: InvoiceOverviewSummaryItem[];
  summaryLoading: boolean;
  summaryError: string | null;
  latest: InvoiceOverviewLatestItem[];
  latestLoading: boolean;
  latestError: string | null;
};

export const initialInvoiceOverviewState: InvoiceOverviewState = {
  summary: [],
  summaryLoading: false,
  summaryError: null,
  latest: [],
  latestLoading: false,
  latestError: null,
};

