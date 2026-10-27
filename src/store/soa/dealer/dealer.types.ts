export interface DealerListItem {
  id: string;
  counterPartyName: string; // decoded entity_name
  odAccount: string; // decoded od_account_no
  odExpiryDate: string;
  sanctionLimit: string;
  drawingPower: string;
  utilizedAmount: string;
  pipelineRequests: string;
  excessCredit: string;
  availableLimit: string;
  /** API `total_os_amount` */
  totalOsAmount: string;
  /** API `total_amount_paid` */
  totalAmountPaid: string;
  overdueDays: string;
  status: string;
  /** Raw numbers for Total row (client sum; no backend change) */
  sanctionLimitRaw: number;
  utilizedAmountRaw: number;
  pipelineRequestsRaw: number;
  excessCreditRaw: number;
  availableLimitRaw: number;
  totalOsAmountRaw: number;
  totalAmountPaidRaw: number;
}

export interface FetchDealerListRequest {
  programIds: string[];
  isInitialLoad?: boolean;
  /**
   * SID SOA: dealers API may 500 while counter-party-summary still works.
   * Treat non-auth failures as empty list so the summary card can show.
   */
  treatErrorAsEmpty?: boolean;
}

export interface FetchProgramSummaryRequest {
  programIds: string[];
}

export interface ProgramSummaryAmounts {
  principal: string;
  interest: string;
  penalInterest: string;
  charges: string;
  total: string;
}

export interface ProgramSummaryLoanDetails {
  programName?: string;
  anchorName: string;
  bankName: string;
  programApprovalDate: string;
  programExpiryDate: string;
  status: string;
  programLimit: string;
  availableLimit: string;
  roiPercent: string;
}

export interface ProgramCounterPartySummary {
  loanDetails: ProgramSummaryLoanDetails;
  due: ProgramSummaryAmounts;
  received: ProgramSummaryAmounts;
}

export interface DealerState {
  dealerList: DealerListItem[];
  loading: boolean;
  error: string | null;
  totalDealers: number;
  programSummary: ProgramCounterPartySummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
}
