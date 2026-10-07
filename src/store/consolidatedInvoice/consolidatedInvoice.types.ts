import type {InvoiceCurrentStep} from '@store/invoice/inv.types';

export const CONSOLIDATED_PAGE_SIZE = 20;
/** Batch size used while scanning remaining pages for a client-side search. */
export const CONSOLIDATED_SEARCH_BATCH_SIZE = 100;
/** Upper bound of rows a single client-side search may load (matches web limit). */
export const CONSOLIDATED_SEARCH_MAX_ROWS = 1000;
export const CONSOLIDATED_SEARCH_MIN_CHARS = 3;

/**
 * POST /invoice/consolidated-list body.
 * - `productId` omitted = every product the user's consolidated_invoice_list grant covers.
 * - `programIds` omitted = all programs. Only sent when the user picks programs on
 *   this screen's program sheet (never taken from the global program selection).
 */
export type ConsolidatedInvoiceListRequest = {
  page: number;
  limit: number;
  productId?: string[];
  programIds?: string[];
  byInvoiceStatus?: string[];
  byAdminStatus?: string[];
};

export type ConsolidatedSearchField = 'invoiceNo' | 'loanRefNo' | 'programName';

/** Row shape returned by the backend `fields` projection. */
export type ConsolidatedInvoiceApiRow = {
  id: string;
  loan_ref_no?: string | null;
  invoice_ref_no?: string | null;
  partnerBank?: {id?: string; bank_name?: string} | null;
  product?: {id?: string; name?: string} | null;
  invoice_date?: string | null;
  invoice_due_date?: string | null;
  grn_date?: string | null;
  invoice_status?: string | null;
  approval_status?: string | null;
  admin_status?: string | null;
  final_total?: number | string | null;
  final_total_after_tds?: number | string | null;
  net_disbursement_amount?: number | string | null;
  attachment?: unknown;
  anchorParticipantMapping?: {
    party?: {id?: string; entity_name?: string} | null;
  } | null;
  party?: {entity_name?: string} | null;
  program?: {
    id?: string;
    program_name?: string;
    party?: {id?: string} | null;
  } | null;
  created_at?: string | null;
  programVendorDetails?: {
    id?: string;
    vendor_name?: string;
    name_as_per_bank?: string;
  } | null;
  current_step?: (Partial<InvoiceCurrentStep> & {department?: string}) | null;
};

export type ConsolidatedInvoiceListResponse = {
  rows: ConsolidatedInvoiceApiRow[];
  total: number;
  page: number;
  limit: number;
};

/** Normalised card / bottom-sheet view model. */
export type ConsolidatedInvoiceRow = {
  id: string;
  invoiceNo: string;
  loanRefNo: string;
  productId: string;
  productName: string;
  /** Resolved product code (DF / VF / PID …); '' when unknown. */
  productCode: string;
  bankName: string;
  programName: string;
  primaryPartyLabel: string;
  primaryPartyName: string;
  counterPartyLabel: string;
  counterPartyName: string;
  uploadDate: string;
  invoiceDate: string;
  grnDate: string;
  dueDate: string;
  invoiceAmount: string;
  disbursementRequestedAmount: string;
  netDisbursementAmount: string;
  invoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;
  rawInvoiceStatus: string;
  rawAdminStatus: string;
  currentStep: string;
};

export type ConsolidatedInvoiceFilters = {
  /** Empty = all permitted products (productId not sent). */
  productIds: string[];
  /** Empty = all programs (programIds not sent). */
  programIds: string[];
  invoiceStatuses: string[];
  adminStatuses: string[];
};

export type ConsolidatedSearchState = {
  query: string;
  field: ConsolidatedSearchField;
  /** True while remaining pages are being loaded for the current query. */
  isScanning: boolean;
  /** Rows loaded so far for the search (compare with `total`). */
  checkedCount: number;
  /** Stopped at CONSOLIDATED_SEARCH_MAX_ROWS before reaching `total`. */
  capped: boolean;
  /** Scan failed part-way; already-loaded rows stay visible. */
  error: string | null;
};

export type ConsolidatedInvoiceState = {
  rows: ConsolidatedInvoiceRow[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  filters: ConsolidatedInvoiceFilters;
  search: ConsolidatedSearchState;
};

export const initialConsolidatedFilters: ConsolidatedInvoiceFilters = {
  productIds: [],
  programIds: [],
  invoiceStatuses: [],
  adminStatuses: [],
};

export const initialConsolidatedSearch: ConsolidatedSearchState = {
  query: '',
  field: 'invoiceNo',
  isScanning: false,
  checkedCount: 0,
  capped: false,
  error: null,
};

export const initialConsolidatedInvoiceState: ConsolidatedInvoiceState = {
  rows: [],
  total: 0,
  page: 0,
  hasMore: false,
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
  filters: initialConsolidatedFilters,
  search: initialConsolidatedSearch,
};
