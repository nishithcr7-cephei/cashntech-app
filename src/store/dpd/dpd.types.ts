export type DPDRecord = {
  id: string;
  invoice_ref_no?: string;
  loan_ref_no?: string;
  invoice_date?: string;
  invoice_due_date?: string;
  disbursed_amount?: string;
  total_outstanding?: string;
  invoice_status?: string;
  program_name?: string;
  partyName?: string;
  counterPartyName?: string;
  outstanding_principal?: string;
  dpd_days?: number;
  npa_status?: any;
  interest_accrued?: string;
  penal_interest?: string;
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
