export interface DealerListItem {
  id: string;
  counterPartyName: string; // decoded entity_name
  odAccount: string; // decoded od_account_no
  odExpiryDate: string;
  sanctionLimit: string;
  drawingPower: string;
  utilizedLimit: string;
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

export interface DealerState {
  dealerList: DealerListItem[];
  loading: boolean;
  error: string | null;
  totalDealers: number;
}
