export type RepaymentRecord = {
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
  outstanding_principal?: number | string;
  upfront_interest?: number | string;
  /** O/S Interest Accrued — may also arrive as cumulative_interest from repayment list API */
  interest_accrued?: number | string;
  cumulative_interest?: number | string;
  penal_interest?: number | string;
  invoice_status?: string;
  anchorparticipantMappingId?: string;
  bank_name?: string;
  name?: string;
  programId?: string;
  program_name?: string;
  partyName?: string;
  counterPartyName?: string;
};

export type RepaymentState = {
  repaymentList: RepaymentRecord[];
  loading: boolean;
  error: string | null;
};

export const initialRepaymentState: RepaymentState = {
  repaymentList: [],
  loading: false,
  error: null,
};

export type FetchRepaymentListRequest = {
  programIds?: string[];
  /** Optional — included when VF product context is active (PR7); omitted for DF default. */
  productId?: string | null;
};
