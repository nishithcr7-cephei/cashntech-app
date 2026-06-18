export type DailyInterestRecord = {
  id: number;
  accrual_date: string;
  outstanding_principal?: number;
  outstanding_principal_date?: number;
  interest_rate: number;
  daily_interest: number;
  base_interest: number;
  grace_period_interest: number;
  penal_interest_on_interest: number;
  penal_interest_on_principal: number;
  cumulative_interest: number;
  accrual_type: string;
};

export type InterestAccrualRecord = {
  id: string;
  loan_ref_no?: string;
  invoice_ref_no?: string;
  bank_name?: string;
  name?: string;
  program_name?: string;
  partyName?: string;
  counterPartyName?: string;
  final_total?: number | string;
  invoice_date?: string;
  invoice_due_date?: string;
  disbursement_date?: string;
  disbursed_amount?: number | string;
  cumulative_interest?: number | string;
};

export type InterestAccrualState = {
  dailyInterestList: DailyInterestRecord[];
  interestAccrualList: InterestAccrualRecord[];
  loading: boolean;
  error: string | null;
};

export const initialInterestAccrualState: InterestAccrualState = {
  dailyInterestList: [],
  interestAccrualList: [],
  loading: false,
  error: null,
};

export type FetchDailyInterestRequest = {
  invoiceId: string;
};

export type FetchInterestAccrualListRequest = {
  programIds?: string[];
  byInvoiceStatus?: string[];
};
