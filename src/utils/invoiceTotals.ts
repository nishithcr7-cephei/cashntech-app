/**
 * Invoice totals helpers — aligned with web Create Invoice screen.
 *
 * Total (Net) = Sub − Discount + Tax − TDS − Advance Interest
 *
 * Advance Interest (VF + Upfront only) uses the net invoice value before deductions:
 *   (Sub Total − Discount Total + Tax Total) × (ROI% ÷ 100) × (Tenor ÷ 365)
 * TDS / Eligibility do NOT change the AI base.
 */

export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Keep digits and a single decimal; strip commas/other chars. */
export function stripAmountInput(text: string): string {
  const cleaned = String(text || '').replace(/,/g, '').replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1).replace(/\./g, '')}`;
}

/** Display helper for amount TextInputs (Indian grouping, preserves trailing decimal). */
export function formatIndianAmountInput(raw: string): string {
  const stripped = stripAmountInput(raw);
  if (!stripped) return '';
  const hasDot = stripped.includes('.');
  const [intPart, dec = ''] = stripped.split('.');
  const formattedInt = (intPart === '' ? '0' : Number(intPart)).toLocaleString(
    'en-IN',
  );
  return hasDot ? `${formattedInt}.${dec}` : formattedInt;
}

export function formatIndianCurrency(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

/** Web Create Total (Net) — includes Advance Interest deduct. */
export function computeInvoiceNetTotal(
  subTotal: number,
  discountTotal: number,
  taxTotal: number,
  tdsAmount = 0,
  advanceInterest = 0,
): number {
  return round2(subTotal - discountTotal + taxTotal - tdsAmount - advanceInterest);
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
  /** VF + Interest Charge Type Upfront. */
  chargeApplies: boolean;
  /** Show AI row on create (web shows even at ₹0.00). */
  applicable: boolean;
  advanceInterest: number;
};

/**
 * Client-confirmed VF + Upfront Advance Interest:
 *   Advance Interest =
 *     (Sub Total − Discount Total + Tax Total) × ROI% × (Tenor ÷ 365)
 */
export function computeVendorFinanceAdvanceInterest(input: {
  isVendorFinance: boolean;
  interestChargeType?: string | null;
  /** VF Upfront AI base = Sub Total − Discount + Tax. */
  subTotal: number;
  discountTotal?: number | string | null;
  taxTotal?: number | string | null;
  roiPercent?: number | string | null;
  tenorDays?: number | string | null;
}): AdvanceInterestBreakdown {
  const chargeType = String(input.interestChargeType || '')
    .trim()
    .toLowerCase();
  if (!input.isVendorFinance || chargeType !== 'upfront') {
    return {chargeApplies: false, applicable: false, advanceInterest: 0};
  }

  const subTotal = Number(input.subTotal) || 0;
  const discountTotal = Number(input.discountTotal) || 0;
  const taxTotal = Number(input.taxTotal) || 0;
  const aiBase = Math.max(
    0,
    round2(subTotal - discountTotal + taxTotal),
  );
  const roiPercent = Number(input.roiPercent) || 0;
  const tenorDays = Number(input.tenorDays) || 0;

  if (aiBase <= 0 || roiPercent <= 0 || tenorDays <= 0) {
    return {chargeApplies: true, applicable: true, advanceInterest: 0};
  }

  return {
    chargeApplies: true,
    applicable: true,
    advanceInterest: round2(aiBase * (roiPercent / 100) * (tenorDays / 365)),
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
  /** VF Upfront applies TDS only after purchases exceed the threshold. */
  requireThresholdExceeded?: boolean;
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
    const purchaseTotal = ytd + base;
    if (
      input.requireThresholdExceeded
        ? purchaseTotal <= threshold
        : purchaseTotal < threshold
    ) {
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
