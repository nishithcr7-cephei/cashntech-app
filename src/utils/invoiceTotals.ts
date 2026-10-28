/**
 * Invoice totals helpers — Santram waterfall (VF + DF).
 *
 * Invoice Amount = Basic − Discount + Tax
 * Disbursement Requested Amount = Invoice Amount − TDS
 * Advance Interest (VF + Upfront) on Requested Amount:
 *   (Invoice Amount − TDS) × (ROI% ÷ 100) × (Usance Days ÷ 365)
 *   Usance Days = Invoice Due Date − Disbursement Date
 * Net Disbursement = Requested Amount − Advance Interest
 */

import {
  computeUsanceDays,
  resolveUsanceDaysForDisplay,
} from '@utils/usanceDays';

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

/** Invoice Amount = Basic − Discount + Tax (no TDS). */
export function computeInvoiceTaxableBase(
  subTotal: number,
  discountTotal: number,
  taxTotal: number,
): number {
  return Math.max(0, round2(subTotal - discountTotal + taxTotal));
}

/** Disbursement Requested Amount = Invoice Amount − TDS. */
export function computeInvoiceSubTotalAfterTds(
  subTotal: number,
  discountTotal: number,
  taxTotal: number,
  tdsAmount = 0,
): number {
  return Math.max(
    0,
    round2(subTotal - discountTotal + taxTotal - (Number(tdsAmount) || 0)),
  );
}

export type InvoiceNetDisbursementSource = {
  /** DB / getInvoiceDetails (main) */
  net_disbursement_amount?: number | string | null;
  /** CamelCase alias on some list queries */
  netDisbursementAmount?: number | string | null;
  /** Legacy finance-preview computed field */
  net_disbursal_amount?: number | string | null;
  final_total?: number | string | null;
  upfront_interest?: number | string | null;
  sub_total?: number | string | null;
  discount_total?: number | string | null;
  tax_total?: number | string | null;
  tds_amount?: number | string | null;
};

/**
 * Net Disbursement from API fields only.
 * `final_total` is not always net (often Invoice Amount or DRA) — do not use it alone.
 */
export function resolveNetDisbursementAmountFromInvoice(
  data: InvoiceNetDisbursementSource | null | undefined,
): number {
  if (!data) return 0;

  const netFromApi = Number(
    data.net_disbursement_amount ??
      data.netDisbursementAmount ??
      data.net_disbursal_amount,
  );
  if (Number.isFinite(netFromApi) && netFromApi >= 0) {
    return round2(netFromApi);
  }

  const upfront = Number(data.upfront_interest) || 0;
  const sub = Number(data.sub_total);
  if (Number.isFinite(sub) && sub > 0) {
    const dra = computeInvoiceSubTotalAfterTds(
      sub,
      Number(data.discount_total) || 0,
      Number(data.tax_total) || 0,
      Number(data.tds_amount) || 0,
    );
    return round2(Math.max(0, upfront > 0 ? dra - upfront : dra));
  }

  const finalTotal = Number(data.final_total);
  if (Number.isFinite(finalTotal) && finalTotal > 0) {
    return round2(Math.max(0, finalTotal - upfront));
  }
  return 0;
}

export function isTdsPartyTaxName(name: string | undefined | null): boolean {
  return String(name || '')
    .toLowerCase()
    .includes('tds');
}

export type AdvanceInterestBreakdown = {
  /** VF|SID + Interest Charge Type Upfront. */
  chargeApplies: boolean;
  /** Show AI row on create (web shows even at ₹0.00). */
  applicable: boolean;
  advanceInterest: number;
};

/**
 * Products that can take Upfront Advance Interest (backend `hasUpfrontInterest`).
 * Prefer server `is_upfront` from financing-preview when available.
 */
export function productAllowsUpfrontInterest(
  productTypeOrCode?: string | null,
): boolean {
  const s = String(productTypeOrCode || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return (
    s === 'vendor_finance' ||
    s === 'vf' ||
    s.includes('vendor_finance') ||
    s === 'sales_invoice_discounting' ||
    s === 'sid' ||
    s.includes('sales_invoice_discounting')
  );
}

/** Charge type is Upfront (case-insensitive). */
export function isUpfrontInterestChargeType(
  interestChargeType?: string | null,
): boolean {
  return (
    String(interestChargeType || '')
      .trim()
      .toLowerCase() === 'upfront'
  );
}

/**
 * Local Advance Interest fallback only — Create/Edit before financing-preview,
 * or display helpers when DB AI is missing.
 * Authoritative figures: POST /invoice/financing-preview (create) and
 * POST /invoice/disbursement/preview (disburse).
 *
 * Applies when product allows upfront (VF or SID) AND charge type is Upfront.
 * Principal: `financedAmount` (F) when provided; else DRA (Invoice − TDS).
 */
export function computeVendorFinanceAdvanceInterest(input: {
  /** @deprecated Prefer `allowsUpfrontInterest` or productType. */
  isVendorFinance?: boolean;
  /** Explicit gate — true for VF or SID when charge may apply. */
  allowsUpfrontInterest?: boolean;
  /** Product code / type string (VF | SID). */
  productType?: string | null;
  interestChargeType?: string | null;
  /**
   * Financed amount F — preferred AI principal (margin already applied).
   * When omitted, falls back to Invoice Amount − TDS (legacy DRA).
   */
  financedAmount?: number | string | null;
  /** Basic (line subtotal). */
  subTotal: number;
  discountTotal?: number | string | null;
  taxTotal?: number | string | null;
  tdsAmount?: number | string | null;
  roiPercent?: number | string | null;
  /** Prefer usance (due − disb); tenorDays used when usance not supplied (e.g. create flow). */
  usanceDays?: number | string | null;
  tenorDays?: number | string | null;
}): AdvanceInterestBreakdown {
  const allows =
    input.allowsUpfrontInterest === true ||
    input.isVendorFinance === true ||
    productAllowsUpfrontInterest(input.productType);
  const chargeType = String(input.interestChargeType || '')
    .trim()
    .toLowerCase();
  if (!allows || chargeType !== 'upfront') {
    return {chargeApplies: false, applicable: false, advanceInterest: 0};
  }

  const financed = Number(input.financedAmount);
  const subTotal = Number(input.subTotal) || 0;
  const discountTotal = Number(input.discountTotal) || 0;
  const taxTotal = Number(input.taxTotal) || 0;
  const tdsAmount = Number(input.tdsAmount) || 0;
  const aiBase =
    Number.isFinite(financed) && financed > 0
      ? round2(financed)
      : Math.max(
          0,
          round2(subTotal - discountTotal + taxTotal - tdsAmount),
        );
  const roiPercent = Number(input.roiPercent) || 0;
  const usanceFromInput = Number(input.usanceDays);
  const interestDays =
    Number.isFinite(usanceFromInput) && usanceFromInput > 0
      ? usanceFromInput
      : Number(input.tenorDays) || 0;

  if (aiBase <= 0 || roiPercent <= 0 || interestDays <= 0) {
    return {chargeApplies: true, applicable: true, advanceInterest: 0};
  }

  return {
    chargeApplies: true,
    applicable: true,
    advanceInterest: round2(
      aiBase * (roiPercent / 100) * (interestDays / 365),
    ),
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

type InvoiceAmountPreview = {
  upfront_interest_amount?: number | string | null;
  upfront_interest?: number | string | null;
  eligible_loan_amount?: number | string | null;
  net_disbursement_amount?: number | string | null;
  netDisbursementAmount?: number | string | null;
  net_disbursal_amount?: number | string | null;
  sub_total?: number | string | null;
  discount_total?: number | string | null;
  tax_total?: number | string | null;
  tds_amount?: number | string | null;
  final_total?: number | string | null;
  invoice_amount?: number | string | null;
  eligibility_percent?: number | string | null;
  requested_loan_amount?: number | string | null;
  interest_charge_type?: string | null;
  interest_rate_percent?: number | string | null;
  transaction_interest_rate?: number | string | null;
  tenor_days?: number | string | null;
  tenor?: number | string | null;
  invoice_due_date?: string | null;
  due_date?: string | null;
  program?: {eligibility?: number | string | null} | null;
  anchorParticipantMapping?:
    | {interest_parameters?: unknown; [key: string]: unknown}
    | null;
};

export type VfDisbursementModalAmounts = {
  grossTaxable: number;
  advanceInterest: number;
  netInvoiceAmount: number;
  usanceDays: number;
};

export type VfDisbursementModalOptions = {
  disbursementDate?: string | null;
  /** When set, skips due − disb derivation. */
  usanceDays?: number | null;
};

/**
 * @deprecated Fallback only — prefer POST /invoice/disbursement/preview.
 * Legacy web auto-fill when Disbursement Date is selected (Upfront):
 *   Eligible = final_total × Eligibility%
 *   AI       = Eligible × ROI% × (Usance ÷ 365)
 *   Disbursed = Eligible − AI − TDS
 * Prefer financed principal via server preview (F − AI).
 */
export function computeDisbursedAmountLikeWeb(input: {
  netInvoice: number;
  eligibilityPercent?: number | string | null;
  roiPercent?: number | string | null;
  usanceDays: number;
  tdsAmount?: number | string | null;
  applyUpfrontInterest: boolean;
}): {eligible: number; advanceInterest: number; disbursedAmount: number} {
  const net = Number(input.netInvoice) || 0;
  const eligPct = Number(input.eligibilityPercent);
  const eligibility =
    Number.isFinite(eligPct) && eligPct > 0 ? eligPct : 100;
  const eligible = round2(net * (eligibility / 100));
  const roi = Number(input.roiPercent) || 0;
  const usance = Number(input.usanceDays) || 0;
  const tds = Number(input.tdsAmount) || 0;

  if (!input.applyUpfrontInterest) {
    return {eligible, advanceInterest: 0, disbursedAmount: eligible};
  }

  const advanceInterest =
    eligible > 0 && roi > 0 && usance > 0
      ? round2(eligible * (roi / 100) * (usance / 365))
      : 0;

  return {
    eligible,
    advanceInterest,
    disbursedAmount: round2(Math.max(0, eligible - advanceInterest - tds)),
  };
}

/** @deprecated Use `isUpfrontInterestChargeType`. */
export function isVfUpfrontChargeType(
  interestChargeType?: string | null,
): boolean {
  return isUpfrontInterestChargeType(interestChargeType);
}

/**
 * @deprecated Fallback only — prefer POST /invoice/disbursement/preview.
 * Local VF/SID disbursement modal recalculation (not DB upfront_interest).
 */
export function resolveVfDisbursementModalAmounts(
  details: InvoiceAmountPreview | null | undefined,
  options?: VfDisbursementModalOptions,
): VfDisbursementModalAmounts {
  const empty: VfDisbursementModalAmounts = {
    grossTaxable: 0,
    advanceInterest: 0,
    netInvoiceAmount: 0,
    usanceDays: 0,
  };
  if (!details) return empty;

  const sub = Number(details.sub_total) || 0;
  const disc = Number(details.discount_total) || 0;
  const tax = Number(details.tax_total) || 0;
  const tds = Number(details.tds_amount) || 0;
  const grossTaxable = round2(sub - disc + tax - tds);

  const eligPct = Number(
    details.eligibility_percent ?? details.program?.eligibility ?? 100,
  );
  const eligibility = Number.isFinite(eligPct) && eligPct > 0 ? eligPct : 100;

  const roi = Number(
    details.transaction_interest_rate ??
      details.interest_rate_percent ??
      extractRoiPercent(details.anchorParticipantMapping?.interest_parameters),
  );

  const dueRaw = details.invoice_due_date ?? details.due_date ?? null;
  const usanceDays =
    options?.usanceDays ??
    computeUsanceDays({
      dueDate: dueRaw,
      disbursementDate: options?.disbursementDate,
    }) ??
    0;

  // Interest base excludes tax and is taken before any advance interest deduction.
  const aiBase = round2((sub - disc) * (eligibility / 100));
  const advanceInterest =
    aiBase > 0 && roi > 0 && usanceDays > 0
      ? round2(aiBase * (roi / 100) * (usanceDays / 365))
      : 0;

  const netInvoiceAmount = round2(Math.max(0, grossTaxable - advanceInterest));

  return {grossTaxable, advanceInterest, netInvoiceAmount, usanceDays};
}

/** Disbursement usance display: API → due − disb → optional tenor fallback. */
export function resolveDisbursementUsanceDaysDisplay(
  usanceDays?: number | string | null,
  dueDate?: string | null,
  disbursementDate?: string | null,
  tenor?: number | string | null,
): string {
  return resolveUsanceDaysForDisplay({
    usanceDaysFromApi: usanceDays,
    dueDate,
    disbursementDate,
    tenor,
  });
}

/**
 * Display helper: prefer stored AI, else local VF|SID Upfront on F (or DRA),
 * else eligible − net. Prefer financing / disbursement preview when live.
 */
export function resolveAdvanceInterestFromPreview(
  preview: InvoiceAmountPreview | null | undefined,
  opts?: {
    isVendorFinance?: boolean;
    allowsUpfrontInterest?: boolean;
    productType?: string | null;
    financedAmount?: number | string | null;
  },
): number {
  if (!preview) return 0;
  const db = Number(preview.upfront_interest_amount ?? preview.upfront_interest);
  if (Number.isFinite(db) && db > 0) {
    return round2(db);
  }

  const financedFromPreview = Number(
    opts?.financedAmount ??
      (preview as {financed_amount?: number; financedAmount?: number})
        .financed_amount ??
      (preview as {financedAmount?: number}).financedAmount,
  );

  const computed = computeVendorFinanceAdvanceInterest({
    isVendorFinance: opts?.isVendorFinance === true,
    allowsUpfrontInterest: opts?.allowsUpfrontInterest,
    productType: opts?.productType,
    interestChargeType: preview.interest_charge_type,
    financedAmount:
      Number.isFinite(financedFromPreview) && financedFromPreview > 0
        ? financedFromPreview
        : undefined,
    subTotal: Number(preview.sub_total) || 0,
    discountTotal: preview.discount_total,
    taxTotal: preview.tax_total,
    tdsAmount: preview.tds_amount,
    roiPercent:
      preview.interest_rate_percent ??
      extractRoiPercent(preview.anchorParticipantMapping?.interest_parameters),
    tenorDays: preview.tenor_days ?? preview.tenor,
  });
  if (computed.advanceInterest > 0) {
    return computed.advanceInterest;
  }

  const eligible = Number(preview.eligible_loan_amount);
  const net = Number(
    preview.net_disbursement_amount ??
      preview.netDisbursementAmount ??
      preview.net_disbursal_amount,
  );
  if (Number.isFinite(eligible) && Number.isFinite(net) && eligible >= net) {
    return round2(eligible - net);
  }
  return 0;
}

/**
 * Web disbursement "Net Invoice Amount": Sub − Disc + Tax − TDS
 * (advance interest is shown separately, not deducted here).
 */
export function resolveNetInvoiceAmountFromPreview(
  preview: InvoiceAmountPreview | null | undefined,
  opts?: {isVendorFinance?: boolean},
): number {
  if (!preview) return 0;
  const sub = Number(preview.sub_total);
  const disc = Number(preview.discount_total) || 0;
  const tax = Number(preview.tax_total) || 0;
  const tds = Number(preview.tds_amount) || 0;
  if (Number.isFinite(sub) && sub > 0) {
    return round2(sub - disc + tax - tds);
  }

  const finalTotal = Number(preview.final_total ?? preview.invoice_amount);
  const ai = resolveAdvanceInterestFromPreview(preview, opts);
  if (Number.isFinite(finalTotal) && finalTotal > 0) {
    return round2(finalTotal + (ai > 0 ? ai : 0));
  }
  return 0;
}

export function resolveInvoiceRoiPercent(source: {
  transaction_interest_rate?: number | string | null;
  interest_rate_percent?: number | string | null;
  anchorParticipantMapping?: {interest_parameters?: unknown} | null;
} | null | undefined): number {
  if (!source) return 0;
  const direct = Number(
    source.transaction_interest_rate ?? source.interest_rate_percent,
  );
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }
  return extractRoiPercent(source.anchorParticipantMapping?.interest_parameters);
}

export type DisbursementPreviewAmounts = {
  usanceDays: number;
  advanceInterest: number;
  disbursedAmount: number;
  netInvoiceAmount: number;
};

/**
 * @deprecated Fallback only — prefer POST /invoice/disbursement/preview.
 * Local single/bulk disbursement: usance from due − disb; Upfront on VF|SID.
 */
export function computeDisbursementPreviewAmounts(
  preview: InvoiceAmountPreview | null | undefined,
  options?: {
    disbursementDate?: string | null;
    isVendorFinance?: boolean;
    /** True when VF or SID + Upfront (or pass isVfUpfront for legacy callers). */
    isVfUpfront?: boolean;
    allowsUpfrontInterest?: boolean;
    productType?: string | null;
  },
): DisbursementPreviewAmounts {
  const empty: DisbursementPreviewAmounts = {
    usanceDays: 0,
    advanceInterest: 0,
    disbursedAmount: 0,
    netInvoiceAmount: 0,
  };
  if (!preview) {
    return empty;
  }

  const chargeType = preview.interest_charge_type;
  const allowsProduct =
    options?.allowsUpfrontInterest === true ||
    options?.isVendorFinance === true ||
    productAllowsUpfrontInterest(options?.productType);
  const isVfUpfront =
    options?.isVfUpfront ??
    (allowsProduct && isUpfrontInterestChargeType(chargeType));

  const dueRaw = preview.invoice_due_date ?? preview.due_date ?? null;
  const usanceFromDue =
    computeUsanceDays({
      dueDate: dueRaw,
      disbursementDate: options?.disbursementDate,
    }) ?? 0;

  if (isVfUpfront) {
    const vf = resolveVfDisbursementModalAmounts(preview, {
      disbursementDate: options?.disbursementDate,
      usanceDays: usanceFromDue,
    });
    const netInvoice = Number(preview.final_total) || 0;
    const roi = resolveInvoiceRoiPercent(preview);
    const computed = computeDisbursedAmountLikeWeb({
      netInvoice,
      eligibilityPercent:
        preview.eligibility_percent ?? preview.program?.eligibility ?? 100,
      roiPercent: roi,
      usanceDays: vf.usanceDays,
      tdsAmount: preview.tds_amount ?? 0,
      applyUpfrontInterest: true,
    });
    return {
      usanceDays: vf.usanceDays,
      advanceInterest: computed.advanceInterest,
      disbursedAmount: computed.disbursedAmount,
      netInvoiceAmount: vf.netInvoiceAmount,
    };
  }

  const netInvoice = resolveNetInvoiceAmountFromPreview(preview, {
    isVendorFinance: options?.isVendorFinance,
  });
  return {
    usanceDays: usanceFromDue,
    advanceInterest: 0,
    disbursedAmount: netInvoice,
    netInvoiceAmount: netInvoice,
  };
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
