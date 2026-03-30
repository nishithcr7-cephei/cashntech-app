export type ProgramRecord = {
  status: string;
  programId: string;
  bankName: string;
  productName: string;
  programName: string;
  partyName: string;
  totalSanctionedAmount: string;
  totaloutstanding: string;
};

export type SOAState = {
  programList: ProgramRecord[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPrograms: number;
};

export const initialSOAState: SOAState = {
  programList: [],
  loading: false,
  error: null,
  page: 1,
  limit: 20,
  hasMore: true,
  totalPrograms: 0,
};

export type FetchProgramListRequest = {
  page: number;
  limit: number;
  search?: string;
  isInitialLoad?: boolean;
};
