export type ProgramRecord = {
  status: string;
  programId: string;
  bankName: string;
  productName: string;
  programName: string;
  partyName: string;
  totalSanctionedAmount: string;
  /** API `utilizedAmount` — formatted for list display */
  utilizedAmount: string;
  /** Client: Sanction − Utilized (no backend change) */
  totalAvailableLimit: string;
  totalOutstanding: string;
  createdAt?: string; // Formatted date (e.g., "02 Apr 2026")
};

export type SOAState = {
  programList: ProgramRecord[];
  loading: boolean;
  error: string | null;
  totalPrograms: number;
};

export const initialSOAState: SOAState = {
  programList: [],
  loading: false,
  error: null,
  totalPrograms: 0,
};

export type FetchProgramListRequest = {
  programIds?: string[];
  /** Web SOA: product-scoped list only — do not lock to login-selected program. */
  productId?: string | null;
  isInitialLoad?: boolean;
};
