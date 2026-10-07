import type {
  ConsolidatedInvoiceApiRow,
  ConsolidatedInvoiceListResponse,
  ConsolidatedInvoiceRow,
  ConsolidatedSearchField,
} from '@store/consolidatedInvoice/consolidatedInvoice.types';
import {PRODUCT_CODES, ProductCode} from '@store/product/product.types';
import {resolveProductCodeFromName} from '@store/product/product.resolver';
import {decryptValue} from '@utils/decrypt';
import {formatStatus} from '@utils/invoiceStatusDisplay';
import {
  formatListAmount,
  resolveDisbursementRequestedAmount,
} from '@utils/invoiceListAmounts';

const EMPTY = '-';
/** Web table shows plain amounts (`11,700.00`), not the Invoice List `/-` suffix. */
const PLAIN_AMOUNT = {suffix: ''};

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return EMPTY;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return EMPTY;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${d.getFullYear()}`;
}

function readName(value: string | null | undefined): string {
  if (!value) {
    return EMPTY;
  }
  return decryptValue(value) || value || EMPTY;
}

/** Party labels follow the row's product, not the logged-in user's role. */
export function getConsolidatedPartyLabels(code: ProductCode | null): {
  primary: string;
  counter: string;
} {
  if (code === PRODUCT_CODES.DEALER_FINANCE) {
    return {primary: 'Anchor', counter: 'Dealer'};
  }
  if (
    code === PRODUCT_CODES.VENDOR_FINANCE ||
    code === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING
  ) {
    return {primary: 'Anchor', counter: 'Vendor'};
  }
  return {primary: 'Primary Party', counter: 'Counter Party'};
}

function resolveCounterPartyName(row: ConsolidatedInvoiceApiRow): string {
  const vendor = row.programVendorDetails;
  const raw =
    vendor?.vendor_name ||
    vendor?.name_as_per_bank ||
    row.anchorParticipantMapping?.party?.entity_name ||
    '';
  return readName(raw);
}

function resolveCurrentStep(row: ConsolidatedInvoiceApiRow): string {
  const step = row.current_step;
  if (!step?.role) {
    return EMPTY;
  }
  return step.department ? `${step.role} (${step.department})` : step.role;
}

export function normalizeConsolidatedInvoiceRow(
  row: ConsolidatedInvoiceApiRow,
): ConsolidatedInvoiceRow {
  const productCode = resolveProductCodeFromName(row.product?.name);
  const labels = getConsolidatedPartyLabels(productCode);
  const finalTotal =
    row.final_total != null && row.final_total !== ''
      ? Number(row.final_total)
      : Number.NaN;

  return {
    id: row.id,
    invoiceNo: row.invoice_ref_no || EMPTY,
    loanRefNo: row.loan_ref_no || EMPTY,
    productId: row.product?.id ?? '',
    productName: row.product?.name || EMPTY,
    productCode: productCode ?? '',
    bankName: row.partnerBank?.bank_name || EMPTY,
    programName: row.program?.program_name || EMPTY,
    primaryPartyLabel: labels.primary,
    primaryPartyName: readName(row.party?.entity_name),
    counterPartyLabel: labels.counter,
    counterPartyName: resolveCounterPartyName(row),
    uploadDate: formatDate(row.created_at),
    invoiceDate: formatDate(row.invoice_date),
    grnDate: formatDate(row.grn_date),
    dueDate: formatDate(row.invoice_due_date),
    invoiceAmount: Number.isFinite(finalTotal)
      ? formatListAmount(finalTotal, PLAIN_AMOUNT)
      : EMPTY,
    disbursementRequestedAmount: resolveDisbursementRequestedAmount(
      row,
      PLAIN_AMOUNT,
    ),
    netDisbursementAmount: formatListAmount(
      row.net_disbursement_amount,
      PLAIN_AMOUNT,
    ),
    invoiceStatus: row.invoice_status ? formatStatus(row.invoice_status) : EMPTY,
    approvalStatus: row.approval_status
      ? formatStatus(row.approval_status)
      : EMPTY,
    adminStatus: row.admin_status ? formatStatus(row.admin_status) : EMPTY,
    rawInvoiceStatus: row.invoice_status ?? '',
    rawAdminStatus: row.admin_status ?? '',
    currentStep: resolveCurrentStep(row),
  };
}

/**
 * Accepts the raw axios body: BaseResponseDto `{statusCode, message, data}`
 * or a bare `{rows, total, page, limit}`.
 */
export function normalizeConsolidatedInvoiceResponse(
  body: unknown,
): ConsolidatedInvoiceListResponse {
  const payload: any =
    body && typeof body === 'object' && 'data' in (body as any)
      ? (body as any).data
      : body;
  const rows: ConsolidatedInvoiceApiRow[] = Array.isArray(payload?.rows)
    ? payload.rows
    : [];
  const total = Number(payload?.total);
  const page = Number(payload?.page);
  const limit = Number(payload?.limit);
  return {
    rows,
    total: Number.isFinite(total) ? total : rows.length,
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : rows.length,
  };
}

/** Client-side search over loaded rows (backend has no search param yet). */
export function matchesConsolidatedSearch(
  row: ConsolidatedInvoiceRow,
  query: string,
  field: ConsolidatedSearchField,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const value = row[field];
  return !!value && value !== EMPTY && value.toLowerCase().includes(q);
}
