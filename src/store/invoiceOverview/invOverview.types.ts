export type InvoiceOverviewSummaryItem = {
  id: string;
  program_name: string;
  partyName: string;
  od_account_no: string | null;
  counterPartyName: string | null;
  sanctioned_limit: number | null;
  drawing_power: number | null;
  od_expiry_date: string | null;
  bank_name?: string | null;
  bank_id?: string | null;
  utilized_amount?: number | null;
  pipeline_requests?: number | null;
  available_limit?: number | null;
  overdue_amount?: number | null;
  principal_overdue?: number | null;
  interest_overdue?: number | null;
  dpd_days?: number | null;
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
  final_total?: string;
  disbursement_date?: string;
  disbursed_amount?: string;
  utr_no?: string;
  loan_ref_no?: string;
};

export type InvoiceOverviewState = {
  summary: InvoiceOverviewSummaryItem[];
  summaryLoading: boolean;
  summaryError: string | null;
  latest: InvoiceOverviewLatestItem[];
  latestLoading: boolean;
  latestError: string | null;
  kpis?: {
    total_program_limit: string;
    utilized_amount: string;
    utilized_rate: string;
    active_dealer_ratio: string;
    available_limit: string;
    overdue_amount: string;
    principal_overdue: string;
    interest_overdue: string;
    dpd_days: string;
  } | null;
  kpisLoading: boolean;
};

export const initialInvoiceOverviewState: InvoiceOverviewState = {
  summary: [],
  summaryLoading: false,
  summaryError: null,
  latest: [],
  latestLoading: false,
  latestError: null,
  kpis: null,
  kpisLoading: false,
};

