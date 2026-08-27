export type DPDRecord = {
  id: string;
  invoice_ref_no?: string;
  loan_ref_no?: string;
  invoice_date?: string;
  grn_date?: string;
  invoice_due_date?: string;
  disbursement_date?: string;
  final_total?: number | string;
  disbursed_amount?: number | string;
  total_outstanding?: number | string;
  invoice_status?: string;
  bank_name?: string;
  bankName?: string;
  name?: string;
  productName?: string;
  program_name?: string;
  partyName?: string;
  counterPartyName?: string;
  outstanding_principal?: number | string;
  upfront_interest?: number | string;
  dpd_days?: number;
  npa_status?: any;
  interest_accrued?: number | string;
  penal_interest?: number | string;
};

export type DPDState = {
  dpdList: DPDRecord[];
  loading: boolean;
  error: string | null;
};

export const initialDPDState: DPDState = {
  dpdList: [],
  loading: false,
  error: null,
};

export type FetchDPDListRequest = {
  programIds?: string[];
  /** Optional — included when VF product context is active (PR7); omitted for DF default. */
  productId?: string | null;
  buckets?: string[];
};
