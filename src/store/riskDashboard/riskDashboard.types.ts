/**
 * Dashboard Management (Ecosystem Risk / Alert / Borrower Risk).
 * Product-independent: none of these endpoints take productId.
 */

export type DpdBucket = {
  label: string;
  color: string;
  amount: number;
  pct: number;
};

export type BankHealthStatus = 'Stable' | 'Watch' | 'Elevated';
export type PartyRiskStatus = 'Standard' | 'SMA-0' | 'SMA-1' | 'SMA-2' | 'NPA';
export type PartyRole = 'Dealer' | 'Anchor';

// ── Ecosystem Risk Profile ──────────────────────────────────────────────
export type EcosystemOverview = {
  bankCount: number;
  totalExposure: number;
  overdueAmount: number;
  npaAmount: number;
  npaBankCount: number;
  flaggedParties: number;
  multiBankFlagged: number;
  dpdBuckets: DpdBucket[];
};

export type EcosystemBankRow = {
  bankId: string;
  bankName: string;
  products: string[];
  totalExposure: number;
  overdueAmount: number;
  flaggedParties: number;
  npaAmount: number;
  healthStatus: BankHealthStatus | string;
};

export type EcosystemRiskData = {
  overview: EcosystemOverview;
  rows: EcosystemBankRow[];
};

// ── Bank Risk Detail ────────────────────────────────────────────────────
export type BankProductSummary = {
  product: string;
  productShort: string;
  monitoredPartyType: string;
  programCount: number;
  outstanding: number;
  atRisk: number;
  flaggedParties: number;
};

export type BankRiskParty = {
  partyId: string;
  partyName: string;
  city: string | null;
  role: PartyRole | string;
  products: string[];
  outstanding: number;
  currentDpd: number;
  crossBankNote: string;
  crossBankFlagged: boolean;
  status: PartyRiskStatus | string;
};

export type BankRiskDetail = {
  bankId: string;
  bankName: string;
  products: string[];
  totalExposure: number;
  overdueAmount: number;
  npaAmount: number;
  flaggedParties: number;
  stressFromElsewhere: number;
  dpdBuckets: DpdBucket[];
  productSummaries: BankProductSummary[];
  parties: BankRiskParty[];
};

// ── Party Risk Profile ──────────────────────────────────────────────────
export type PartyRiskProgram = {
  bankId: string;
  bankName: string;
  product: string;
  role: PartyRole | string;
  programName: string;
  limit: number;
  outstanding: number;
  currentDpd: number;
  status: PartyRiskStatus | string;
};

export type PartyDpdHistoryPoint = {month: string; dpd: number};

export type PartyLinkedEntity = {
  name: string;
  relationship: string;
  note: string;
  flagged: boolean;
};

export type PartyAlert = {date: string; what: string; who: string};

export type PartyRiskProfile = {
  partyName: string;
  city: string | null;
  role: PartyRole | string;
  totalOutstanding: number;
  totalLimit: number;
  worstDpd: number;
  overduePrograms: number;
  totalPrograms: number;
  banksNotified: number;
  programs: PartyRiskProgram[];
  history: PartyDpdHistoryPoint[];
  linked: PartyLinkedEntity[];
  alerts: PartyAlert[];
  dpdBuckets: DpdBucket[];
};

// ── Alert Dashboard ─────────────────────────────────────────────────────
export type AlertDispatchRow = {
  id: string;
  crossingDate: string;
  triggerCode: string;
  emailTriggerType: string;
  program: string;
  monitoredParty: string;
  invoiceCount: number;
  maxDpd: number;
  totalOutstanding: number;
  status: string;
  statusLabel: string;
  actionStatus: string;
  caseId: string | null;
  caseStatus: string | null;
  closureDate: string | null;
  createdAt: string;
};

/** Backend `status` filter values; '' = all. */
export type AlertStatusFilter = '' | 'SENT' | 'PARTIAL' | 'FAILED';

export type AlertDispatchFilters = {
  bankId: string;
  programId: string;
  status: AlertStatusFilter;
  /** YYYY-MM-DD, exact match on crossing_date. */
  date: string;
};

export const initialAlertFilters: AlertDispatchFilters = {
  bankId: '',
  programId: '',
  status: '',
  date: '',
};

export const ALERT_STATUS_FILTER_OPTIONS: {value: AlertStatusFilter; label: string}[] = [
  {value: '', label: 'All statuses'},
  {value: 'SENT', label: 'Sent'},
  {value: 'PARTIAL', label: 'Partially Sent'},
  {value: 'FAILED', label: 'Failed'},
];

export type FilterOption = {id: string; label: string};

// ── Borrower Risk Dashboard ─────────────────────────────────────────────
export type BorrowerRiskCategory = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';

export type BorrowerRiskRow = {
  distributorId: string;
  distributorName: string;
  activeCompanies: number;
  activeBanks: number;
  totalExposure: number;
  currentDpd: number;
  riskCategory: BorrowerRiskCategory | string;
  alertStatus: string;
  stopSupplyStatus: string;
  resolutionStatus: string;
};

// ── State ───────────────────────────────────────────────────────────────
export type AsyncSlot<T> = {
  data: T | null;
  /** First load (or retry) — screen shows skeletons. */
  loading: boolean;
  /** Pull-to-refresh. */
  refreshing: boolean;
  /** Silent background refetch while the old data stays on screen. */
  updating: boolean;
  /** Epoch ms of the last successful load; drives stale refetch on focus. */
  fetchedAt: number | null;
  error: string | null;
};

export type RiskDashboardState = {
  ecosystem: AsyncSlot<EcosystemRiskData>;
  bankDetail: AsyncSlot<BankRiskDetail> & {bankId: string | null};
  partyProfile: AsyncSlot<PartyRiskProfile> & {partyId: string | null};
  alerts: AsyncSlot<AlertDispatchRow[]> & {filters: AlertDispatchFilters};
  borrowers: AsyncSlot<BorrowerRiskRow[]>;
  filterOptions: {
    banks: FilterOption[];
    programs: FilterOption[];
    loading: boolean;
    loaded: boolean;
    error: string | null;
  };
};

const emptySlot = <T>(): AsyncSlot<T> => ({
  data: null,
  loading: false,
  refreshing: false,
  updating: false,
  fetchedAt: null,
  error: null,
});

export const initialRiskDashboardState: RiskDashboardState = {
  ecosystem: emptySlot<EcosystemRiskData>(),
  bankDetail: {...emptySlot<BankRiskDetail>(), bankId: null},
  partyProfile: {...emptySlot<PartyRiskProfile>(), partyId: null},
  alerts: {...emptySlot<AlertDispatchRow[]>(), filters: initialAlertFilters},
  borrowers: emptySlot<BorrowerRiskRow[]>(),
  filterOptions: {
    banks: [],
    programs: [],
    loading: false,
    loaded: false,
    error: null,
  },
};

/** `refresh` = pull-to-refresh; `background` = silent refetch keeping current data. */
export type FetchMode = {refresh?: boolean; background?: boolean};

export type RefreshPayload = FetchMode | undefined;

/** Data older than this is refetched in the background when the screen regains focus. */
export const RISK_DASHBOARD_STALE_MS = 60 * 1000;
