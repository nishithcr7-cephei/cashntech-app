import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {
  AllLoanReportItem,
  AllLoansReportApiRow,
  AllLoansReportRequestPayload,
  DailyAccrualReportApiRow,
  DailyAccrualReportItem,
  DailyAccrualReportRequestPayload,
  MonthlyAccrualReportApiRow,
  MonthlyAccrualReportItem,
  MonthlyAccrualReportRequestPayload,
  RepaymentReportApiRow,
  RepaymentReportItem,
  RepaymentReportRequestPayload,
  InvoiceOutstandingReportApiRow,
  InvoiceOutstandingReportItem,
  InvoiceOutstandingReportRequestPayload,
  LoanStatusReportApiRow,
  LoanStatusReportItem,
  LoanStatusReportRequestPayload,
  AllProductOutstandingReportApiRow,
  AllProductOutstandingReportItem,
  AllProductOutstandingReportRequestPayload,
  UtilizationReportApiRow,
  UtilizationReportItem,
  UtilizationReportRequestPayload,
  DisbursementReportApiRow,
  DisbursementReportItem,
  DisbursementReportRequestPayload,
  DpdReportApiRow,
  DpdReportItem,
  DpdReportRequestPayload,
} from '@store/report/report.types';

function readNumber(
  ...values: Array<number | string | undefined | null>
): number {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function readString(
  ...values: Array<string | number | undefined | null>
): string {
  for (const v of values) {
    if (v === undefined || v === null || v === '') continue;
    return String(v);
  }
  return '-';
}

/**
 * Maps API row (mixed casing) to normalized `AllLoanReportItem`.
 */
export function normalizeAllLoanReportItem(
  raw: unknown,
  index: number,
): AllLoanReportItem {
  const r = raw as AllLoansReportApiRow & Record<string, unknown>;
  return {
    srNo: readNumber(r.srNo, index + 1),
    lmsId: readString(r.lmsId),
    loanAccountNo: readString(r.loanAccountNo),
    productType: readString(r.productType),
    productCode: readString(r.productCode),
    anchorName: readString(r.anchorName),
    vendorDealerName: readString(r.vendorDealerName),
    bankName: readString(r.bankName),
    sanctionAmount: readNumber(r.sanctionAmount),
    disbursedAmount: readNumber(r.disbursedAmount),
    outstandingAmount: readNumber(r.outstandingAmount),
    loanStatus: readString(r.loanStatus),
    disbursementDate: readString(r.disbursementDate),
    dueDate: readString(r.dueDate),
    tenor: readNumber(r.tenor),
    roi: readString(r.roi, '0%'),
    repaidAmount: readNumber(r.repaidamount, r.repaidAmount),
    principalOutstanding: readNumber(
      r.principaloutstanding,
      r.principalOutstanding,
    ),
    interestOutstanding: readNumber(
      r.interestoutstanding,
      r.interestOutstanding,
    ),
    chargesOutstanding: readNumber(
      r.chargesoutstanding,
      r.chargesOutstanding,
    ),
    dpd: readNumber(r.dpd),
    npaStatus: readString(r.npastatus, r.npaStatus),
    lastRepaymentDate: readString(
      r.lastRepaymentDate,
      r.lastrepaymentdate,
    ),
    lastRepaymentAmount: readNumber(
      r.lastRepaymentAmount,
      r.lastrepaymentamount,
    ),
    overdueAmount: readNumber(r.overdueAmount, r.overdueamount),
    settlementStatus: readString(
      r.settlementStatus,
      r.settlementstatus,
    ),
    odAccountNo: readString(r.oDAccountNo, r.odAccountNo),
    branchName: readString(r.branchName),
    createdBy: readString(r.createdBy),
    createdDate: readString(r.createdDate),
  };
}

/**
 * POST `/report/all-loans-report` with optional search/filter payload.
 */
export async function fetchAllLoansReportApi(
  payload: AllLoansReportRequestPayload = {},
): Promise<AllLoanReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiAllLoansReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map((row, index) =>
    normalizeAllLoanReportItem(row, index),
  );
}

/**
 * Maps disbursement API row to `DisbursementReportItem` (API key names preserved).
 */
export function normalizeDisbursementReportItem(
  raw: unknown,
): DisbursementReportItem {
  const r = raw as DisbursementReportApiRow & Record<string, unknown>;
  return {
    anchorName: readString(r.anchorName),
    anchorPan: readString(r.anchorPan),
    borrowerName: readString(r.borrowerName),
    borrowerPan: readString(r.borrowerPan),
    masterProgramName: readString(r.masterProgramName),
    programName: readString(r.programName),
    programTypeName: readString(r.programTypeName),
    loanAccountNumber: readString(r.loanAccountNumber),
    losId: readString(r.losId),
    invoiceNumber: readString(r.invoiceNumber),
    tranchNumber: readString(r.tranchNumber),
    finnone_bill_no: readString(r.finnone_bill_no),
    invoiceDate: readString(r.invoiceDate),
    disbursementDate: readString(r.disbursementDate),
    maturityDate: readString(r.maturityDate),
    invoiceValue: readNumber(r.invoiceValue),
    loanValue: readNumber(r.loanValue),
    disbursementAmount: readNumber(r.disbursementAmount),
    roi: readString(r.roi, '0%'),
    margin: readNumber(r.margin),
    bankName: readString(r.bankName),
    bankAccountNumber: readString(r.bankAccountNumber),
    ifscCode: readString(r.ifscCode),
    status: readString(r.status),
    utrNo: readString(r.utrNo),
    message: readString(r.message),
    generatedDate: readString(r.generatedDate),
  };
}

/**
 * POST `/report/disbursement` with optional search/filter payload.
 */
export async function fetchDisbursementReportApi(
  payload: DisbursementReportRequestPayload = {},
): Promise<DisbursementReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiDisbursementReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map(row => normalizeDisbursementReportItem(row));
}

/**
 * Maps overdue / DPD API row to `DpdReportItem` (API key names preserved, including spaces).
 */
export function normalizeDpdReportItem(
  raw: unknown,
  index: number,
): DpdReportItem {
  const r = raw as DpdReportApiRow & Record<string, unknown>;
  return {
    'Sr No': readNumber(r['Sr No'], index + 1),
    Customer: readString(r.Customer),
    'Account No': readString(r['Account No']),
    Outstanding: readNumber(r.Outstanding),
    'Overdue Amt': readNumber(r['Overdue Amt']),
    DPD: readNumber(r.DPD),
    Bucket: readString(r.Bucket),
  };
}

/**
 * POST `/report/overdue-report` with optional search/filter payload.
 */
export async function fetchDpdReportApi(
  payload: DpdReportRequestPayload = {},
): Promise<DpdReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiDpdOverdueReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map((row, index) =>
    normalizeDpdReportItem(row, index),
  );
}

/**
 * Maps daily accrual API row to `DailyAccrualReportItem` (API key names preserved).
 */
export function normalizeDailyAccrualReportItem(
  raw: unknown,
  index: number,
): DailyAccrualReportItem {
  const r = raw as DailyAccrualReportApiRow & Record<string, unknown>;
  return {
    'Sr No': readNumber(r['Sr No'], index + 1),
    'Account No': readString(r['Account No']),
    Customer: readString(r.Customer),
    'Daily Interest': readNumber(r['Daily Interest']),
    Date: readString(r.Date),
    Cumulative: readNumber(r.Cumulative),
  };
}

/**
 * POST `/report/daily-accrual` with optional search/filter payload.
 */
export async function fetchDailyAccrualReportApi(
  payload: DailyAccrualReportRequestPayload = {},
): Promise<DailyAccrualReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiDailyAccrualReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map((row, index) =>
    normalizeDailyAccrualReportItem(row, index),
  );
}

/**
 * Maps monthly accrual API row to `MonthlyAccrualReportItem` (API key names preserved).
 */
export function normalizeMonthlyAccrualReportItem(
  raw: unknown,
  index: number,
): MonthlyAccrualReportItem {
  const r = raw as MonthlyAccrualReportApiRow & Record<string, unknown>;
  const monthRaw = r.Month;
  const monthStr =
    monthRaw instanceof Date
      ? monthRaw.toISOString().slice(0, 10)
      : readString(monthRaw);

  return {
    'Sr No': readNumber(r['Sr No'], index + 1),
    'Account No': readString(r['Account No']),
    Customer: readString(r.Customer),
    'Interest Amount': readNumber(r['Interest Amount']),
    Rate: readNumber(r.Rate),
    Month: monthStr,
  };
}

/**
 * POST `/report/monthly-accrual` with optional search/filter payload.
 */
export async function fetchMonthlyAccrualReportApi(
  payload: MonthlyAccrualReportRequestPayload = {},
): Promise<MonthlyAccrualReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiMonthlyAccrualReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map((row, index) =>
    normalizeMonthlyAccrualReportItem(row, index),
  );
}

/**
 * Maps repayment API row to `RepaymentReportItem` (snake_case keys preserved).
 */
export function normalizeRepaymentReportItem(
  raw: unknown,
  index: number,
): RepaymentReportItem {
  const r = raw as RepaymentReportApiRow & Record<string, unknown>;
  return {
    id: readString(r.id, `repayment-${index}`),
    sr_no: readNumber(r.sr_no, index + 1),
    lms_id: readString(r.lms_id),
    loan_ref_no: readString(r.loan_ref_no),
    invoice_no: readString(r.invoice_no),
    bank_name: readString(r.bank_name),
    product_name: readString(r.product_name),
    program_name: readString(r.program_name),
    anchor_name: readString(r.anchor_name),
    dealer_name: readString(r.dealer_name),
    payment_date: readString(r.payment_date),
    invoice_amount: readNumber(r.invoice_amount),
    disbursed_amount: readNumber(r.disbursed_amount),
    due_amount: readNumber(r.due_amount),
    paid_amount: readNumber(r.paid_amount),
    principal_settled: readNumber(r.principal_settled),
    interest_settled: readNumber(r.interest_settled),
    penal_interest_settled: readNumber(r.penal_interest_settled),
    settlement_priority: readString(r.settlement_priority),
    total_outstanding_amount: readNumber(r.total_outstanding_amount),
    processed_by_user: readString(r.processed_by_user),
    processed_on_date: readString(r.processed_on_date),
    created_on: readString(r.created_on),
    status: readString(r.status),
    utr_no: readString(r.utr_no),
    excess_amount: readNumber(r.excess_amount),
    outstanding_interest: readNumber(r.outstanding_interest),
    transaction_date: readString(r.transaction_date),
  };
}

/**
 * POST `/report/repayment` with optional search/filter payload.
 */
export async function fetchRepaymentReportApi(
  payload: RepaymentReportRequestPayload = {},
): Promise<RepaymentReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiRepaymentReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map((row, index) =>
    normalizeRepaymentReportItem(row, index),
  );
}

function formatReportDateString(val: string | undefined | null): string {
  if (val == null || val === '' || val === '-') {
    return '-';
  }
  const t = Date.parse(val);
  if (Number.isNaN(t)) {
    return String(val);
  }
  return new Date(t).toLocaleDateString('en-GB');
}

function formatRoiString(val: string | number | undefined | null): string {
  if (val == null || val === '') {
    return '-';
  }
  const s = String(val).trim();
  if (s === '' || s === '-') {
    return '-';
  }
  return s.includes('%') ? s : `${s}%`;
}

/**
 * Maps invoice outstanding API row to `InvoiceOutstandingReportItem`.
 */
export function normalizeInvoiceOutstandingReportItem(
  raw: unknown,
): InvoiceOutstandingReportItem {
  const r = raw as InvoiceOutstandingReportApiRow & Record<string, unknown>;
  const schemeType = readString(r.schemeType, r.schemetype);
  const principalOS = readNumber(r.principalOS, r.outstandingprincipal);

  return {
    anchorName: readString(r.anchorName),
    anchorPan: readString(r.anchorPan),
    borrowerName: readString(r.borrowerName),
    borrowerPan: readString(r.borrowerPan),
    loanAccountNumber: readString(r.loanAccountNumber),
    losId: readString(r.losId),
    schemeType,
    invoiceNumber: readString(r.invoiceNumber),
    tranchNumber: readString(r.tranchNumber),
    invoiceDate: formatReportDateString(readString(r.invoiceDate)),
    disbursementDate: formatReportDateString(readString(r.disbursementDate)),
    maturityDate: formatReportDateString(readString(r.maturityDate)),
    roi: formatRoiString(r.roi),
    invoiceValue: readNumber(r.invoiceValue),
    loanValue: readNumber(r.loanValue),
    disbursementAmount: readNumber(r.disbursementAmount),
    principalOS,
  };
}

/**
 * POST `/report/invoice-outstanding` with optional search/filter payload.
 */
export async function fetchInvoiceOutstandingReportApi(
  payload: InvoiceOutstandingReportRequestPayload = {},
): Promise<InvoiceOutstandingReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiInvoiceOutstandingReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map(row => normalizeInvoiceOutstandingReportItem(row));
}

/**
 * Maps loan status API row to `LoanStatusReportItem`.
 */
export function normalizeLoanStatusReportItem(
  raw: unknown,
): LoanStatusReportItem {
  const r = raw as LoanStatusReportApiRow & Record<string, unknown>;
  const schemeType = readString(r.schemetype, r.schemeType);
  const loanLiveDate = readString(r.loanlivedate, r.loanLiveDate);
  const tenure = readNumber(r.loanTenure);

  return {
    programName: readString(r.programName),
    programTypeName: readString(r.programTypeName),
    anchorName: readString(r.anchorName),
    anchorPan: readString(r.anchorPan),
    loanAccNo: readString(r.loanAccNo),
    borrowerName: readString(r.borrowerName),
    borrowerPan: readString(r.borrowerPan),
    borrowerConstitution: readString(r.borrowerConstitution),
    gstin: readString(r.gstin),
    anchorCity: readString(r.anchorCity),
    anchorState: readString(r.anchorState),
    anchorPincode: readString(r.anchorPincode),
    schemetype: schemeType,
    loanSanctionDate: formatReportDateString(readString(r.loanSanctionDate)),
    loanEndDate: formatReportDateString(readString(r.loanEndDate)),
    loanlivedate: formatReportDateString(loanLiveDate),
    sanctionedLimit: readNumber(r.sanctionedLimit, r.sanctionLimit),
    availableLimit: readNumber(r.availableLimit, r.availablelimit),
    roi: formatRoiString(r.roi),
    excessAmount: readNumber(r.excessAmount, r.excessamount),
    rmName: readString(r.rmName, r.rmname),
    borrowerCifNo: readString(r.borrowerCifNo),
    status: readString(r.status),
    loanTenure: tenure,
    generatedDate: formatReportDateString(
      readString(r.generatedDate, r.generateddate),
    ),
    eodDate: formatReportDateString(readString(r.eodDate, r.eoddate)),
  };
}

/**
 * POST `/report/loan-status` with optional search/filter payload.
 */
export async function fetchLoanStatusReportApi(
  payload: LoanStatusReportRequestPayload = {},
): Promise<LoanStatusReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiLoanStatusReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map(row => normalizeLoanStatusReportItem(row));
}

/**
 * Maps all product outstanding API row to `AllProductOutstandingReportItem`.
 */
export function normalizeAllProductOutstandingReportItem(
  raw: unknown,
  index: number,
): AllProductOutstandingReportItem {
  const r = raw as AllProductOutstandingReportApiRow & Record<string, unknown>;

  return {
    srNo: readNumber(r.srNo, index + 1),
    lmsId: readString(r.lmsId),
    loanAccountNo: readString(r.loanAccountNo),
    productType: readString(r.productType),
    productCode: readString(r.productCode),
    programName: readString(r.programName),
    facilityType: readString(r.facilityType),
    anchorName: readString(r.anchorName),
    counterpartyType: readString(r.counterpartyType),
    counterpartyName: readString(r.counterpartyName),
    buyerName: readString(r.buyerName),
    sellerName: readString(r.sellerName),
    invoiceNo: readString(r.invoiceNo),
    invoiceDate: readString(r.invoiceDate),
    disbursementDate: readString(r.disbursementDate),
    dueDate: readString(r.dueDate),
    bankName: readString(r.bankName),
    sanctionAmount: readNumber(r.sanctionAmount),
    invoiceAmount: readNumber(r.invoiceAmount),
    disbursedAmount: readNumber(r.disbursedAmount),
    principalOutstanding: readNumber(r.principalOutstanding),
    interestOutstanding: readNumber(r.interestOutstanding),
    chargesOutstanding: readNumber(r.chargesOutstanding),
    totalOutstandingAmount: readNumber(r.totalOutstandingAmount),
    overdueAmount: readNumber(r.overdueAmount),
    dpd: readNumber(r.dpd),
    npaStatus: readString(r.npaStatus),
    loanStatus: readString(r.loanStatus),
    settlementStatus: readString(r.settlementStatus),
    settlementPriority: readString(r.settlementPriority),
    lastRepaymentDate: readString(r.lastRepaymentDate),
    lastRepaymentAmount: readNumber(r.lastRepaymentAmount),
    odAccountNo: readString(r.odAccountNo),
    branchName: readString(r.branchName),
    createdBy: readString(r.createdBy),
    createdDate: readString(r.createdDate),
  };
}

/**
 * POST `/report/all-product-outstanding` with optional filter payload.
 */
export async function fetchAllProductOutstandingReportApi(
  payload: AllProductOutstandingReportRequestPayload = {},
): Promise<AllProductOutstandingReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiAllProductOutstandingReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map((row, index) =>
    normalizeAllProductOutstandingReportItem(row, index),
  );
}

/**
 * Maps utilization report API row to `UtilizationReportItem`.
 */
export function normalizeUtilizationReportItem(
  raw: unknown,
): UtilizationReportItem {
  const r = raw as UtilizationReportApiRow & Record<string, unknown>;

  return {
    anchorName: readString(r.anchorName),
    anchorPan: readString(r.anchorPan),
    borrowerName: readString(r.borrowerName),
    borrowerPan: readString(r.borrowerPan),
    lan: readString(r.lan),
    programName: readString(r.programName),
    programTypeName: readString(r.programTypeName),
    masterProgramName: readString(r.masterProgramName),
    losid: readString(r.losid, r.losId),
    schemetype: readString(r.schemetype, r.schemeType),
    loanaccountroi: formatRoiString(r.loanaccountroi, r.loanAccountRoi),
    loanTenure: readNumber(r.loanTenure),
    limitCreationDate: formatReportDateString(
      readString(r.limitCreationDate),
    ),
    limitExpiryDate: formatReportDateString(readString(r.limitExpiryDate)),
    sanctionedLimit: readNumber(r.sanctionedLimit),
    totalUtilizedLimit: readNumber(r.totalUtilizedLimit),
    netAvailableLimit: readNumber(r.netAvailableLimit),
    totalPrincipalOS: readNumber(
      r.totalPrincipalOS,
      r.totalPrincipalOs,
    ),
    principalDue: readNumber(r.principalDue),
    interestOS: readNumber(r.interestOS, r.interestOs),
    latePaymentDue: readNumber(r.latePaymentDue),
    totalChargesDue: readNumber(r.totalChargesDue),
    totalAmountDue: readNumber(r.totalAmountDue),
    dpd: readNumber(r.dpd),
    generationDate: formatReportDateString(readString(r.generationDate)),
    eodDate: formatReportDateString(readString(r.eodDate)),
  };
}

/**
 * POST `/report/utilization-report` with optional filter payload.
 */
export async function fetchUtilizationReportApi(
  payload: UtilizationReportRequestPayload = {},
): Promise<UtilizationReportItem[]> {
  const response = await axiosInstance.post<{
    data?: unknown;
    statusCode?: number;
    message?: string;
  }>(ApiEndPoints.apiUtilizationReport, payload, {
    authRequired: true,
  } as Record<string, unknown>);

  const body = response?.data;
  const rowsUnknown = body?.data ?? body;
  if (!Array.isArray(rowsUnknown)) {
    return [];
  }

  return rowsUnknown.map(row => normalizeUtilizationReportItem(row));
}

/** @deprecated Use `fetchAllLoansReportApi` via Redux saga instead */
export const reportApi = {
  getAllLoansReport: fetchAllLoansReportApi,
};
