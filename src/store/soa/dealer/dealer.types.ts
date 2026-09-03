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
  overdueDays: string;
  status: string;
}

export interface FetchDealerListRequest {
  programIds: string[];
  isInitialLoad?: boolean;
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
