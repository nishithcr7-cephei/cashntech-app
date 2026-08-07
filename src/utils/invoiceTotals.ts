/**
 * Invoice totals helpers.
 *
 * Invoice value (`final_total`) = Sub − Discount + Tax − TDS.
 * Advance interest is a lender financing charge, not part of the invoice
 * value, so it is never deducted here — the backend applies eligibility to
 * `final_total` and would otherwise deduct the interest a second time.
 */

export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

type LineItemLike = {
  total?: string;
  discountAmount?: string;
  taxAmount?: string;
  taxes?: Array<{taxAmount?: string}>;
};

type FieldsTaxFallback = {
  cgst?: string;
  sgst?: string;
  taxTotal?: string;
};

/** Line aggregates matching InvoiceForm summary (pre TDS / AI). */
export function computeInvoiceLineAggregates(
  items: LineItemLike[] | undefined,
  fields?: FieldsTaxFallback,
): {subTotal: number; discountTotal: number; taxTotal: number} {
  const list = items || [];
  const subTotal = list.reduce((sum, item) => sum + (parseFloat(item.total || '0') || 0), 0);
  const discountTotal = list.reduce(
    (sum, item) => sum + (parseFloat(item.discountAmount || '0') || 0),
    0,
  );
  const itemTaxSum = list.reduce((sum, item) => {
    if (item.taxes?.length) {
      return (
        sum +
        item.taxes.reduce((s, t) => s + (parseFloat(t.taxAmount || '0') || 0), 0)
      );
    }
    return sum + (parseFloat(item.taxAmount || '0') || 0);
  }, 0);
  const ocrTaxFallback =
    (parseFloat(fields?.cgst || '0') || 0) +
    (parseFloat(fields?.sgst || '0') || 0) +
    (parseFloat(fields?.taxTotal || '0') || 0);
  const taxTotal = itemTaxSum > 0 ? itemTaxSum : ocrTaxFallback;
  return {
    subTotal: round2(subTotal),
    discountTotal: round2(discountTotal),
    taxTotal: round2(taxTotal),
  };
}

export function computeInvoiceNetTotal(
  subTotal: number,
  discountTotal: number,
  taxTotal: number,
  tdsAmount = 0,
): number {
  return Math.max(0, round2(subTotal - discountTotal + taxTotal - tdsAmount));
}

/** Amount before TDS (used as the TDS base). */
export function computeInvoiceTaxableBase(
  subTotal: number,
  discountTotal: number,
  taxTotal: number,
): number {
  return Math.max(0, round2(subTotal - discountTotal + taxTotal));
}

export function isTdsPartyTaxName(name: string | undefined | null): boolean {
  return String(name || '')
    .toLowerCase()
    .includes('tds');
}

export type AdvanceInterestBreakdown = {
  /** True when the product and interest charge type make the charge payable. */
  chargeApplies: boolean;
  /**
   * True only when `chargeApplies` and every input is present. Callers use
   * this to decide whether a figure can be stated at all — `chargeApplies`
   * without `applicable` means the parameters are still missing.
   */
  applicable: boolean;
  eligibleLoanAmount: number;
  advanceInterest: number;
  netDisbursal: number;
};

const NOT_CHARGEABLE: AdvanceInterestBreakdown = {
  chargeApplies: false,
  applicable: false,
  eligibleLoanAmount: 0,
  advanceInterest: 0,
  netDisbursal: 0,
};

const CHARGEABLE_BUT_INCOMPLETE: AdvanceInterestBreakdown = {
  ...NOT_CHARGEABLE,
  chargeApplies: true,
};

/**
 * Vendor Finance advance (upfront) interest, mirroring the backend
 * finance-request preview — same per-step rounding and the same fixed
 * 365-day divisor — so the create screen and the disbursement flow can
 * never state different figures for the same invoice.
 *
 * Interest applies to the eligible loan amount, not the full invoice value.
 */
export function computeVendorFinanceAdvanceInterest(input: {
  isVendorFinance: boolean;
  interestChargeType?: string | null;
  /** Invoice value sent as `final_total` (Sub − Discount + Tax − TDS). */
  invoiceAmount: number;
  eligibilityPercent?: number | string | null;
  roiPercent?: number | string | null;
  tenorDays?: number | string | null;
}): AdvanceInterestBreakdown {
  const chargeType = String(input.interestChargeType || '')
    .trim()
    .toLowerCase();
  if (!input.isVendorFinance || chargeType !== 'upfront') {
    return NOT_CHARGEABLE;
  }

  const invoiceAmount = Number(input.invoiceAmount) || 0;
  const eligibilityPercent = Number(input.eligibilityPercent) || 0;
  const roiPercent = Number(input.roiPercent) || 0;
  const tenorDays = Number(input.tenorDays) || 0;

  // A missing parameter means no figure can be stated. Callers hide the row
  // instead of rendering ₹0.00, which would read as a calculated result.
  if (
    invoiceAmount <= 0 ||
    eligibilityPercent <= 0 ||
    roiPercent <= 0 ||
    tenorDays <= 0
  ) {
    return CHARGEABLE_BUT_INCOMPLETE;
  }

  const eligibleLoanAmount = round2(
    (invoiceAmount * eligibilityPercent) / 100,
  );
  const advanceInterest = round2(
    eligibleLoanAmount * (roiPercent / 100) * (tenorDays / 365),
  );

  return {
    chargeApplies: true,
    applicable: true,
    eligibleLoanAmount,
    advanceInterest,
    netDisbursal: round2(eligibleLoanAmount - advanceInterest),
  };
}

/**
 * TDS when YTD (sub_total FY) + current base crosses threshold (if set).
 * Rate = party tax `value` as percent of current base.
 * If threshold missing/0 → apply rate whenever a TDS tax config exists.
 */
export function computeTdsAmount(input: {
  ratePercent?: number | null;
  threshold?: number | null;
  ytdInvoiceTotal?: number | null;
  currentBase: number;
}): number {
  const rate = Number(input.ratePercent) || 0;
  const base = Number(input.currentBase) || 0;
  if (rate <= 0 || base <= 0) {
    return 0;
  }
  const threshold =
    input.threshold == null ? null : Number(input.threshold);
  const ytd = Number(input.ytdInvoiceTotal) || 0;
  if (threshold != null && Number.isFinite(threshold) && threshold > 0) {
    if (ytd + base < threshold) {
      return 0;
    }
  }
  return round2(base * (rate / 100));
}

/** Finance preview: DB upfront_interest is often 0; derive from net disbursal when needed. */
export function resolveAdvanceInterestFromPreview(
  preview: {
    upfront_interest_amount?: number | string | null;
    upfront_interest?: number | string | null;
    eligible_loan_amount?: number | string | null;
    net_disbursal_amount?: number | string | null;
  } | null | undefined,
): number {
  if (!preview) return 0;
  const db = Number(preview.upfront_interest_amount ?? preview.upfront_interest);
  if (Number.isFinite(db) && db > 0) {
    return round2(db);
  }
  const eligible = Number(preview.eligible_loan_amount);
  const net = Number(preview.net_disbursal_amount);
  if (Number.isFinite(eligible) && Number.isFinite(net) && eligible >= net) {
    return round2(eligible - net);
  }
  return 0;
}

/** Default disbursement amount: prefer net disbursal (VF Upfront), else eligible loan. */
export function resolveDefaultDisbursalAmount(
  preview: {
    net_disbursal_amount?: number | string | null;
    eligible_loan_amount?: number | string | null;
    requested_loan_amount?: number | string | null;
    final_total?: number | string | null;
    invoice_amount?: number | string | null;
  } | null | undefined,
): number {
  if (!preview) return 0;
  const candidates = [
    preview.net_disbursal_amount,
    preview.eligible_loan_amount,
    preview.requested_loan_amount,
    preview.final_total,
    preview.invoice_amount,
  ];
  for (const raw of candidates) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return round2(n);
  }
  return 0;
}

export function extractRoiPercent(interestParameters: unknown): number {
  if (!interestParameters || typeof interestParameters !== 'object') {
    return 0;
  }
  const p = interestParameters as {
    total_roi_percent?: number | string;
    interest_slabs?: Array<{total_roi_percent?: number | string}>;
  };
  const direct = Number(p.total_roi_percent);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }
  const slab = p.interest_slabs?.[0]?.total_roi_percent;
  const fromSlab = Number(slab);
  return Number.isFinite(fromSlab) && fromSlab > 0 ? fromSlab : 0;
}
