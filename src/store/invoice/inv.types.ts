export type DealerInfoParticipant = {
  id: string;
  company_code: string;
  company_code_given_by_party: string;
  od_account_no: string;
  default_payment_terms_days?: number | string;
  party: {id: string; entity_name: string};
  sanctioned_limit?: number | string;
  utilized_amount?: number | string;
  /** Pending invoice total (non-disbursed/closed/rejected) — used for available limit. */
  pipeline_requests?: number | string;
};

export type PartyBankDetail = {
  /**
   * Bank account row id (party-info `bankAccounts.id`).
   * Pass as `credit_to_account_id` on create (PR6).
   */
  id: string;
  account_number: string;
};

export type DealerInfoBasicParameters = {
  default_payment_terms_days?: number;
  stale_invoice_period_days?: number;
  [key: string]: unknown;
};

export type DealerInfoResponse = {
  id: string;
  program_name: string;
  basic_parameters?: DealerInfoBasicParameters;
  party: {
    id: string;
    entity_name?: string;
    party_bank_details: PartyBankDetail[];
  };
  participants: DealerInfoParticipant[];
  /** Program / counterparty bank accounts for credit-to (party-info). */
  bank_details?: PartyBankDetail[];
};

/** CWF list/detail additive step marker (ignored by DF UI until PR5). */
export type InvoiceCurrentStep = {
  role: string;
  level: number | null;
  id?: string;
  sequence_no?: number;
  action_type?: string;
};

export type PartnerBank = {
  id: string;
  bank_id: string;
  bank_name: string;
};

export type InvoiceListItemApi = {
  id: string;
  invoice_ref_no: string;
  counter_party_name: string;
  counter_party_code: string;
  invoice_amount?: string;
  /** Backend returns final_total from invoice_master */
  final_total?: number | string;
  invoice_date: string;
  request_date?: string;
  created_at?: string;
  invoice_due_date: string;
  invoice_status: string;
  approval_status: string;
  admin_status?: string | null;
  /** Web columns: Loan Ref No., Bank Name, Product Name, Program Name, Primary Party, Counter Party */
  loan_ref_no?: string;
  bank_name?: string;
  /** Populated on invoice list / approval APIs */
  partnerBank?: { id?: string; bank_name?: string };
  product_name?: string;
  program_name?: string;
  primary_party_name?: string;
  /** Nested from API when flat fields not present */
  program?: {
    program_name?: string;
    bank_details?: PartyBankDetail[];
    productConfig?: {
      partnerBank?: { bank_name?: string };
      product?: { name?: string };
    };
  };
  party?: { entity_name?: string };
  anchorParticipantMapping?: { party?: { entity_name?: string } };
  approvalLogs?: Array<{id: string}>;
  attachment?: unknown;
  attachments?: unknown;
  /** Whether the current user can act on this invoice now (unified backend list). */
  actionable?: boolean;
  /** Workflow pointer populated on unified backend list responses. */
  current_step?: InvoiceCurrentStep | null;
  /** VF/CWF create/detail: UUID of credit-to bank account row */
  credit_to_account_id?: string;
  credit_to_account_type?: string;
};

export type InvoiceState = {
  dealerInfo: DealerInfoResponse | null;
  dealerInfoLoading: boolean;
  dealerInfoError: string | null;
  bankList: PartnerBank[];
  bankListLoading: boolean;
  bankListError: string | null;
  createInvoiceLoading: boolean;
  createInvoiceError: string | null;
  createInvoiceSuccess: boolean;
  createInvoiceResponse: unknown | null;
  invoiceList: InvoiceListItemApi[];
  invoiceListLoading: boolean;
  invoiceListError: string | null;
  bulkDisbursementLoading: boolean;
  bulkDisbursementSuccess: boolean;
};

export const initialInvoiceState: InvoiceState = {
  dealerInfo: null,
  dealerInfoLoading: false,
  dealerInfoError: null,
  bankList: [],
  bankListLoading: false,
  bankListError: null,
  createInvoiceLoading: false,
  createInvoiceError: null,
  createInvoiceSuccess: false,
  createInvoiceResponse: null,
  invoiceList: [],
  invoiceListLoading: false,
  invoiceListError: null,
  bulkDisbursementLoading: false,
  bulkDisbursementSuccess: false,
};

export type UpdateInvoiceStatusRequest = {
  invoiceId: string;
  action: 'Approve' | 'Reject';
  approvalLevel: number;
  remark?: string;
  programId?: string;
  filters?: InvoiceListFilters;
  onSuccess?: () => void;
};

/** CashnTech admin verification (PATCH /invoice/admin/:invoiceId) */
export type UpdateInvoiceVerificationRequest = {
  invoiceId: string;
  action: 'Verify' | 'Reject';
  remark?: string;
  programId?: string;
  filters?: InvoiceListFilters;
  onSuccess?: () => void;
};
export type UpdateInvoicePayload = {
  invoiceId: string;
  fields: any;
  createdBy: string;
  attachment?: any;
  approval_level: number;
  /** VF/CWF optional pass-through; omitted for DF */
  creditToAccountId?: string;
};

export type BulkUpdateInvoiceRequest = {
  action: 'Approve' | 'Reject' | 'Verify' | 'On Hold';
  invoices: {
    invoiceId: string;
    action: string;
    remark: string;
    approval_level?: number;
    approvalRemark?: string;
  }[];
  programId?: string;
  filters?: InvoiceListFilters;
  onSuccess?: () => void;
  onFailure?: () => void;
  isVerification?: boolean;
};

/** Server-side list filters — unified backend honors byInvoiceStatus / byAdminStatus. */
export type InvoiceListFilters = {
  byInvoiceStatus?: string[];
  byAdminStatus?: string[];
};

export type BulkDisbursementRequest = {
  invoices: {
    invoiceId: string;
    status: string;
    utr_no?: string;
    transaction_no?: string;
    disbursed_amount: number;
    disbursement_date?: string;
    hold_category?: string;
    expected_release_date?: string;
    remark?: string;
    rejection_reason?: string;
  }[];
  onSuccess?: (message?: string) => void | Promise<void>;
};
