/**
 * POST /report/all-loans-report request body (search / filter parameters).
 */
export type AllLoansReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw API row keys as returned by the backend (mixed casing).
 * Used only for normalization input typing.
 */
export type AllLoansReportApiRow = {
  srNo?: number;
  lmsId?: string;
  loanAccountNo?: string;
  invoiceNo?: string;
  productType?: string;
  productCode?: string;
  anchorName?: string;
  vendorDealerName?: string;
  bankName?: string;
  sanctionAmount?: number;
  disbursedAmount?: number;
  outstandingAmount?: number;
  loanStatus?: string;
  disbursementDate?: string;
  dueDate?: string;
  tenor?: number;
  roi?: string;
  repaidamount?: number;
  repaidAmount?: number;
  principaloutstanding?: number;
  principalOutstanding?: number;
  interestoutstanding?: number;
  interestOutstanding?: number;
  chargesoutstanding?: number;
  chargesOutstanding?: number;
  dpd?: number;
  npastatus?: string;
  npaStatus?: string;
  lastRepaymentDate?: string;
  lastrepaymentdate?: string;
  lastRepaymentAmount?: number;
  lastrepaymentamount?: number;
  overdueAmount?: number;
  overdueamount?: number;
  settlementStatus?: string;
  settlementstatus?: string;
  oDAccountNo?: string;
  odAccountNo?: string;
  branchName?: string;
  createdBy?: string;
  createdDate?: string;
};

/**
 * Normalized single row for UI / Redux (strict camelCase).
 */
export type AllLoanReportItem = {
  srNo: number;
  lmsId: string;
  loanAccountNo: string;
  productType: string;
  productCode: string;
  anchorName: string;
  vendorDealerName: string;
  bankName: string;
  sanctionAmount: number;
  disbursedAmount: number;
  outstandingAmount: number;
  loanStatus: string;
  disbursementDate: string;
  dueDate: string;
  tenor: number;
  roi: string;
  repaidAmount: number;
  principalOutstanding: number;
  interestOutstanding: number;
  chargesOutstanding: number;
  dpd: number;
  npaStatus: string;
  lastRepaymentDate: string;
  lastRepaymentAmount: number;
  overdueAmount: number;
  settlementStatus: string;
  odAccountNo: string;
  branchName: string;
  createdBy: string;
  createdDate: string;
};

/**
 * POST /report/disbursement request body (search / filter parameters).
 */
export type DisbursementReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw disbursement API row (optional fields for normalization).
 */
export type DisbursementReportApiRow = {
  anchorName?: string;
  anchorPan?: string;
  borrowerName?: string;
  borrowerPan?: string;
  masterProgramName?: string;
  programName?: string;
  programTypeName?: string;
  loanAccountNumber?: string;
  losId?: string;
  invoiceNumber?: string;
  tranchNumber?: string;
  finnone_bill_no?: string;
  invoiceDate?: string;
  disbursementDate?: string;
  maturityDate?: string;
  invoiceValue?: number;
  loanValue?: number;
  disbursementAmount?: number;
  roi?: string;
  margin?: number;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  status?: string;
  utrNo?: string;
  message?: string;
  generatedDate?: string;
};

/**
 * Normalized disbursement row — property names match API response keys.
 */
export type DisbursementReportItem = {
  anchorName: string;
  anchorPan: string;
  borrowerName: string;
  borrowerPan: string;
  masterProgramName: string;
  programName: string;
  programTypeName: string;
  loanAccountNumber: string;
  losId: string;
  invoiceNumber: string;
  tranchNumber: string;
  finnone_bill_no: string;
  invoiceDate: string;
  disbursementDate: string;
  maturityDate: string;
  invoiceValue: number;
  loanValue: number;
  disbursementAmount: number;
  roi: string;
  margin: number;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  status: string;
  utrNo: string;
  message: string;
  generatedDate: string;
};

/**
 * POST /report/overdue-report (DPD) request body.
 */
export type DpdReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw DPD / overdue API row (camelCase keys).
 */
export type DpdReportApiRow = Partial<{
  srNo: number | string;
  lmsId: string;
  invoiceNumber: string;
  invoiceDate: string;
  loanAccountNumber: string;
  programName: string;
  productType: string;
  bankName: string;
  anchorName: string;
  borrowerName: string;
  disbursementDate: string;
  dueDate: string;
  tenure: number | string;
  principalOS: number | string;
  principalDue: number | string;
  interestOS: number | string;
  interestDue: number | string;
  penalDue: number | string;
  totalOutstanding: number | string;
  dpd: number | string;
  principalDpd: number | string;
  interestDpd: number | string;
  bucket: string;
}>;

/**
 * Normalized DPD row.
 */
export type DpdReportItem = {
  srNo: number;
  lmsId: string;
  invoiceNumber: string;
  invoiceDate: string;
  loanAccountNumber: string;
  programName: string;
  productType: string;
  bankName: string;
  anchorName: string;
  borrowerName: string;
  disbursementDate: string;
  dueDate: string;
  tenure: number;
  principalOS: number;
  principalDue: number;
  interestOS: number;
  interestDue: number;
  penalDue: number;
  totalOutstanding: number;
  dpd: number;
  principalDpd: number;
  interestDpd: number;
  bucket: string;
};

/**
 * POST /report/daily-accrual request body.
 */
export type DailyAccrualReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw daily accrual API row (camelCase from backend; legacy spaced keys supported).
 */
export type DailyAccrualReportApiRow = Partial<{
  srNo: number | string;
  loanAccountNumber: string;
  invoiceNumber: string;
  customer: string;
  dailyInterest: number | string;
  date: string | Date;
  cumulative: number | string;
  /** @deprecated legacy API keys */
  'Sr No': number | string;
  'Account No': string;
  Customer: string;
  'Daily Interest': number | string;
  Date: string | Date;
  Cumulative: number | string;
}>;

/**
 * Normalized daily accrual row (camelCase).
 */
export type DailyAccrualReportItem = {
  srNo: number;
  loanAccountNumber: string;
  invoiceNumber: string;
  customer: string;
  dailyInterest: number;
  date: string;
  cumulative: number;
};

/**
 * POST /report/monthly-accrual request body.
 */
export type MonthlyAccrualReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw monthly accrual API row (camelCase keys).
 */
export type MonthlyAccrualReportApiRow = Partial<{
  srNo: number | string;
  loanAccountNumber: string;
  invoiceNumber: string;
  anchorName: string;
  bankName: string;
  customer: string;
  accruedInterestAmount: number | string;
  postedInterestAmount: number | string;
  rate: number | string;
  month: string;
  postedDate: string;
}>;

/**
 * Normalized monthly accrual row.
 */
export type MonthlyAccrualReportItem = {
  srNo: number;
  loanAccountNumber: string;
  invoiceNumber: string;
  anchorName: string;
  bankName: string;
  customer: string;
  accruedInterestAmount: number;
  postedInterestAmount: number;
  rate: number;
  month: string;
  postedDate: string;
};

/**
 * POST /report/repayment request body.
 */
export type RepaymentReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw repayment API row (snake_case keys).
 */
export type RepaymentReportApiRow = {
  id?: string;
  sr_no?: number | string;
  srNo?: number | string;
  lms_id?: string;
  lmsId?: string;
  loan_ref_no?: string;
  loanAccountNumber?: string;
  invoice_no?: string;
  invoiceNumber?: string;
  bank_name?: string;
  bankName?: string;
  product_name?: string;
  productName?: string;
  program_name?: string;
  programName?: string;
  anchor_name?: string;
  anchorName?: string;
  dealer_name?: string;
  borrowerName?: string;
  payment_date?: string;
  paymentDate?: string;
  invoice_amount?: number | string;
  invoiceValue?: number | string;
  disbursed_amount?: number | string;
  loanValue?: number | string;
  due_amount?: number | string;
  dueAmount?: number | string;
  paid_amount?: number | string;
  paidAmount?: number | string;
  principal_settled?: number | string;
  principalSettled?: number | string;
  interest_settled?: number | string;
  interestSettled?: number | string;
  penal_interest_settled?: number | string;
  penalInterestSettled?: number | string;
  settlement_priority?: string;
  settlementPriority?: string;
  total_outstanding_amount?: number | string;
  totalOutstanding?: number | string;
  processed_by_user?: string;
  processedByUser?: string;
  processed_on_date?: string;
  processedOnDate?: string;
  created_on?: string;
  createdDate?: string;
  status?: string;
  loanStatus?: string;
  utr_no?: string;
  utrNo?: string;
  excess_amount?: number | string;
  excessAmount?: number | string;
  outstanding_interest?: number | string;
  interestOS?: number | string;
  principal_amount?: number | string;
  principalAmount?: number | string;
  interest_amount?: number | string;
  interestAmount?: number | string;
  penal_amount?: number | string;
  penalAmount?: number | string;
  PrincipalOS?: number | string;
  principal_os?: number | string;
  principalOS?: number | string;
  transaction_date?: string;
  transactionDate?: string;
};

/**
 * Normalized repayment row — property names match API response (snake_case).
 */
/**
 * POST /report/invoice-outstanding request body.
 */
export type InvoiceOutstandingReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw invoice outstanding API row (camelCase keys).
 */
export type InvoiceOutstandingReportApiRow = {
  anchorName?: string;
  anchorPan?: string;
  borrowerName?: string;
  borrowerPan?: string;
  loanAccountNumber?: string;
  losId?: string;
  schemeType?: string;
  schemetype?: string;
  invoiceNumber?: string;
  tranchNumber?: string;
  invoiceDate?: string;
  disbursementDate?: string;
  invoiceStatus?: string;
  maturityDate?: string;
  roi?: number | string;
  invoiceValue?: number | string;
  loanValue?: number | string;
  disbursementAmount?: number | string;
  principalOS?: number | string;
  outstandingprincipal?: number | string;
  interestOS?: number | string;
  penalOS?: number | string;
  closedDate?: string;
};

/**
 * Normalized invoice outstanding row — property names match API response.
 */
export type InvoiceOutstandingReportItem = {
  anchorName: string;
  anchorPan: string;
  borrowerName: string;
  borrowerPan: string;
  loanAccountNumber: string;
  losId: string;
  schemeType: string;
  invoiceNumber: string;
  tranchNumber: string;
  invoiceDate: string;
  disbursementDate: string;
  maturityDate: string;
  roi: string;
  invoiceValue: number;
  loanValue: number;
  disbursementAmount: number;
  principalOS: number;
  interestOS: number;
  penalOS: number;
  invoiceStatus: string;
  closedDate: string;
};

/**
 * POST /report/loan-status request body.
 */
export type LoanStatusReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw loan status API row (camelCase / lowercase keys).
 */
export type LoanStatusReportApiRow = {
  programName?: string;
  programTypeName?: string;
  anchorName?: string;
  anchorPan?: string;
  loanAccNo?: string;
  loanAccountNumber?: string;
  borrowerName?: string;
  borrowerPan?: string;
  borrowerConstitution?: string;
  gstin?: string;
  anchorCity?: string;
  anchorState?: string;
  anchorPincode?: string;
  schemetype?: string;
  schemeType?: string;
  loanSanctionDate?: string;
  loanEndDate?: string;
  loanlivedate?: string;
  loanLiveDate?: string;
  sanctionedLimit?: number | string;
  sanctionLimit?: number | string;
  availableLimit?: number | string;
  availablelimit?: number | string;
  roi?: number | string;
  excessAmount?: number | string;
  excessamount?: number | string;
  rmName?: string;
  rmname?: string;
  borrowerCifNo?: string;
  status?: string;
  loanStatus?: string;
  loanTenure?: number | string;
  utilizedAmount?: number | string;
  generatedDate?: string;
  generateddate?: string;
  eodDate?: string;
  eoddate?: string;
};

/**
 * Normalized loan status row — property names match API response.
 */
export type LoanStatusReportItem = {
  programName: string;
  programTypeName: string;
  anchorName: string;
  anchorPan: string;
  loanAccNo: string;
  borrowerName: string;
  borrowerPan: string;
  borrowerConstitution: string;
  gstin: string;
  anchorCity: string;
  anchorState: string;
  anchorPincode: string;
  schemetype: string;
  loanSanctionDate: string;
  loanEndDate: string;
  loanlivedate: string;
  sanctionedLimit: number;
  availableLimit: number;
  roi: string;
  excessAmount: number;
  rmName: string;
  borrowerCifNo: string;
  status: string;
  loanTenure: number;
  generatedDate: string;
  eodDate: string;
};

/**
 * POST /report/all-product-outstanding request body.
 */
export type AllProductOutstandingReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw all product outstanding API row (camelCase).
 */
export type AllProductOutstandingReportApiRow = {
  srNo?: number | string;
  lmsId?: string;
  loanAccountNo?: string;
  productType?: string;
  productCode?: string;
  programName?: string;
  facilityType?: string;
  anchorName?: string;
  counterpartyType?: string;
  counterpartyName?: string;
  buyerName?: string;
  sellerName?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  disbursementDate?: string;
  dueDate?: string;
  bankName?: string;
  sanctionAmount?: number | string;
  invoiceAmount?: number | string;
  disbursedAmount?: number | string;
  principalOutstanding?: number | string;
  interestOutstanding?: number | string;
  chargesOutstanding?: number | string;
  totalOutstandingAmount?: number | string;
  overdueAmount?: number | string;
  dpd?: number | string;
  npaStatus?: string;
  loanStatus?: string;
  settlementStatus?: string;
  settlementPriority?: string;
  lastRepaymentDate?: string;
  lastRepaymentAmount?: number | string;
  odAccountNo?: string;
  branchName?: string;
  createdBy?: string;
  createdDate?: string;
};

/**
 * Normalized all product outstanding row.
 */
export type AllProductOutstandingReportItem = {
  srNo: number;
  lmsId: string;
  loanAccountNo: string;
  productType: string;
  productCode: string;
  programName: string;
  facilityType: string;
  anchorName: string;
  counterpartyType: string;
  counterpartyName: string;
  buyerName: string;
  sellerName: string;
  invoiceNo: string;
  invoiceDate: string;
  disbursementDate: string;
  dueDate: string;
  bankName: string;
  sanctionAmount: number;
  invoiceAmount: number;
  disbursedAmount: number;
  principalOutstanding: number;
  interestOutstanding: number;
  chargesOutstanding: number;
  totalOutstandingAmount: number;
  overdueAmount: number;
  dpd: number;
  npaStatus: string;
  loanStatus: string;
  settlementStatus: string;
  settlementPriority: string;
  lastRepaymentDate: string;
  lastRepaymentAmount: number;
  odAccountNo: string;
  branchName: string;
  createdBy: string;
  createdDate: string;
};

/**
 * POST /report/utilization-report request body.
 */
export type UtilizationReportRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

/**
 * Raw utilization report API row (camelCase / lowercase keys).
 */
export type UtilizationReportApiRow = {
  anchorName?: string;
  anchorPan?: string;
  borrowerName?: string;
  borrowerPan?: string;
  lan?: string;
  loanAccountNumber?: string;
  programName?: string;
  programTypeName?: string;
  masterProgramName?: string;
  losid?: string;
  losId?: string;
  schemetype?: string;
  schemeType?: string;
  loanaccountroi?: string | number;
  loanAccountRoi?: string | number;
  loanTenure?: number | string;
  limitCreationDate?: string;
  limitExpiryDate?: string;
  sanctionedLimit?: number | string;
  totalUtilizedLimit?: number | string;
  netAvailableLimit?: number | string;
  totalPrincipalOS?: number | string;
  totalPrincipalOs?: number | string;
  principalDue?: number | string;
  interestOS?: number | string;
  interestOs?: number | string;
  latePaymentDue?: number | string;
  totalChargesDue?: number | string;
  totalAmountDue?: number | string;
  dpd?: number | string;
  generationDate?: string;
  eodDate?: string;
};

/**
 * Normalized utilization report row.
 */
export type UtilizationReportItem = {
  anchorName: string;
  anchorPan: string;
  borrowerName: string;
  borrowerPan: string;
  lan: string;
  programName: string;
  programTypeName: string;
  masterProgramName: string;
  losid: string;
  schemetype: string;
  loanaccountroi: string;
  loanTenure: number;
  limitCreationDate: string;
  limitExpiryDate: string;
  sanctionedLimit: number;
  totalUtilizedLimit: number;
  netAvailableLimit: number;
  totalPrincipalOS: number;
  principalDue: number;
  interestOS: number;
  latePaymentDue: number;
  totalChargesDue: number;
  totalAmountDue: number;
  dpd: number;
  generationDate: string;
  eodDate: string;
};

export type RepaymentReportItem = {
  id: string;
  sr_no: number;
  lms_id: string;
  loan_ref_no: string;
  invoice_no: string;
  bank_name: string;
  product_name: string;
  program_name: string;
  anchor_name: string;
  dealer_name: string;
  payment_date: string;
  invoice_amount: number;
  disbursed_amount: number;
  due_amount: number;
  paid_amount: number;
  principal_settled: number;
  interest_settled: number;
  penal_interest_settled: number;
  settlement_priority: string;
  total_outstanding_amount: number;
  processed_by_user: string;
  processed_on_date: string;
  created_on: string;
  status: string;
  utr_no: string;
  excess_amount: number;
  outstanding_interest: number;
  principal_amount: number;
  interest_amount: number;
  penal_amount: number;
  principal_os: number;
  transaction_date: string;
};

export type ReportState = {
  allLoansReportData: AllLoanReportItem[];
  loading: boolean;
  error: string | null;
  disbursementReportData: DisbursementReportItem[];
  disbursementLoading: boolean;
  disbursementError: string | null;
  dpdReportData: DpdReportItem[];
  dpdLoading: boolean;
  dpdError: string | null;
  dailyAccrualReportData: DailyAccrualReportItem[];
  dailyAccrualLoading: boolean;
  dailyAccrualError: string | null;
  monthlyAccrualReportData: MonthlyAccrualReportItem[];
  monthlyAccrualLoading: boolean;
  monthlyAccrualError: string | null;
  repaymentReportData: RepaymentReportItem[];
  repaymentLoading: boolean;
  repaymentError: string | null;
  invoiceOutstandingReportData: InvoiceOutstandingReportItem[];
  invoiceOutstandingLoading: boolean;
  invoiceOutstandingError: string | null;
  loanStatusReportData: LoanStatusReportItem[];
  loanStatusLoading: boolean;
  loanStatusError: string | null;
  allProductOutstandingReportData: AllProductOutstandingReportItem[];
  allProductOutstandingLoading: boolean;
  allProductOutstandingError: string | null;
  utilizationReportData: UtilizationReportItem[];
  utilizationLoading: boolean;
  utilizationError: string | null;
};

export const initialReportState: ReportState = {
  allLoansReportData: [],
  loading: false,
  error: null,
  disbursementReportData: [],
  disbursementLoading: false,
  disbursementError: null,
  dpdReportData: [],
  dpdLoading: false,
  dpdError: null,
  dailyAccrualReportData: [],
  dailyAccrualLoading: false,
  dailyAccrualError: null,
  monthlyAccrualReportData: [],
  monthlyAccrualLoading: false,
  monthlyAccrualError: null,
  repaymentReportData: [],
  repaymentLoading: false,
  repaymentError: null,
  invoiceOutstandingReportData: [],
  invoiceOutstandingLoading: false,
  invoiceOutstandingError: null,
  loanStatusReportData: [],
  loanStatusLoading: false,
  loanStatusError: null,
  allProductOutstandingReportData: [],
  allProductOutstandingLoading: false,
  allProductOutstandingError: null,
  utilizationReportData: [],
  utilizationLoading: false,
  utilizationError: null,
};
