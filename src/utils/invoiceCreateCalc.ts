import {
  computeInvoiceLineAggregates,
  computeInvoiceTaxableBase,
  computeTdsAmount,
  round2,
} from '@utils/invoiceTotals';
import type {InvoiceProductType} from '@utils/ocrPatchNormalizer';

type LineItemLike = Parameters<typeof computeInvoiceLineAggregates>[0];

type FieldsTaxFallback = NonNullable<
  Parameters<typeof computeInvoiceLineAggregates>[1]
>;

export type CreateInvoiceTotalsInput = {
  items: LineItemLike;
  fieldsTax: FieldsTaxFallback;
  productType: InvoiceProductType;
  isVendorFinanceUpfront: boolean;
  tdsRatePercent?: number | null;
  tdsThreshold?: number | null;
  ytdInvoiceTotal?: number | null;
};

export type CreateInvoiceTotalsResult = {
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  tds: number;
};

/** TDS base — VF Upfront excludes GST; DF and VF non-Upfront include GST. */
export function computeCreateInvoiceTdsBase(
  subTotal: number,
  discountTotal: number,
  taxTotal: number,
  isVendorFinanceUpfront: boolean,
): number {
  if (isVendorFinanceUpfront) {
    return Math.max(0, round2(subTotal - discountTotal));
  }
  return computeInvoiceTaxableBase(subTotal, discountTotal, taxTotal);
}

/** Header GST from OCR fallback fields (cgst + sgst + taxTotal). */
export function computeHeaderGstTotal(fieldsTax: FieldsTaxFallback): number {
  return round2(
    (parseFloat(fieldsTax?.cgst || '0') || 0) +
      (parseFloat(fieldsTax?.sgst || '0') || 0) +
      (parseFloat(fieldsTax?.taxTotal || '0') || 0),
  );
}

export function itemsHaveSelectedTax(
  items: LineItemLike | undefined,
): boolean {
  return (items || []).some(item => {
    if (String(item?.taxType || '').trim()) {
      return true;
    }
    return (item?.taxes || []).some(tax => String(tax?.taxType || '').trim());
  });
}

/**
 * Whether TDS may be calculated on Create Invoice.
 * DF + VF non-Upfront: item-level tax only.
 * VF Upfront: item tax OR header OCR GST (cgst/sgst/taxTotal).
 */
export function isTaxEligibleForTds(input: {
  hasSelectedTax: boolean;
  headerGstTotal: number;
  productType: InvoiceProductType;
  isVendorFinanceUpfront: boolean;
}): boolean {
  if (input.productType === 'vendor_finance' && input.isVendorFinanceUpfront) {
    return input.hasSelectedTax || input.headerGstTotal > 0;
  }
  return input.hasSelectedTax;
}

/** Shared Create Invoice totals (pre Advance Interest) — DF + VF manual/OCR. */
export function computeCreateInvoiceTotals(
  input: CreateInvoiceTotalsInput,
): CreateInvoiceTotalsResult {
  const {subTotal, discountTotal, taxTotal} = computeInvoiceLineAggregates(
    input.items,
    input.fieldsTax,
  );
  const base = computeCreateInvoiceTdsBase(
    subTotal,
    discountTotal,
    taxTotal,
    input.isVendorFinanceUpfront,
  );
  const hasSelectedTax = itemsHaveSelectedTax(input.items);
  const headerGstTotal = computeHeaderGstTotal(input.fieldsTax);
  const taxEligible = isTaxEligibleForTds({
    hasSelectedTax,
    headerGstTotal,
    productType: input.productType,
    isVendorFinanceUpfront: input.isVendorFinanceUpfront,
  });
  const tds = taxEligible
    ? computeTdsAmount({
        ratePercent: input.tdsRatePercent,
        threshold: input.tdsThreshold,
        ytdInvoiceTotal: input.ytdInvoiceTotal,
        currentBase: base,
        requireThresholdExceeded: input.isVendorFinanceUpfront,
      })
    : 0;
  return {subTotal, discountTotal, taxTotal, tds};
}

export type CreateInvoiceSummaryAmounts = {
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  tdsAmount: number;
  advanceInterest: number;
  netTotal: number;
};

/** Invoice Amount for program limit checks (Basic − Discount + Tax). */
export function computeInvoiceAmountForLimitCheck(
  items: LineItemLike,
  fieldsTax: FieldsTaxFallback,
): number {
  const {subTotal, discountTotal, taxTotal} = computeInvoiceLineAggregates(
    items,
    fieldsTax,
  );
  return Math.max(0, round2(subTotal - discountTotal + taxTotal));
}

/**
 * Create / Preview summary waterfall — same aggregates as CreateInvoice form.
 * TDS + Advance Interest read from synced form fields.
 */
export function computeCreateInvoiceSummaryFromFields(input: {
  items: LineItemLike;
  fieldsTax: FieldsTaxFallback;
  tdsAmount?: string | null;
  upfrontInterest?: string | null;
}): CreateInvoiceSummaryAmounts {
  const {subTotal, discountTotal, taxTotal} = computeInvoiceLineAggregates(
    input.items,
    input.fieldsTax,
  );
  const tdsAmount = parseFloat(String(input.tdsAmount ?? '0')) || 0;
  const advanceInterest = parseFloat(String(input.upfrontInterest ?? '0')) || 0;
  const netTotal = Math.max(
    0,
    round2(subTotal - discountTotal + taxTotal - tdsAmount - advanceInterest),
  );
  return {
    subTotal,
    discountTotal,
    taxTotal,
    tdsAmount,
    advanceInterest,
    netTotal,
  };
}

export function getOcrPartyLabels(productType: InvoiceProductType): {
  party: string;
  code: string;
  od: string;
} {
  if (productType === 'sales_invoice_discounting') {
    return {
      party: 'Debtor',
      code: 'Debtor Code',
      od: 'Escrow Account No.',
    };
  }
  if (
    productType === 'vendor_finance' ||
    productType === 'purchase_invoice_discounting'
  ) {
    return {
      party: 'Vendor',
      code: 'Vendor Code',
      od: 'Vendor OD Account',
    };
  }
  return {
    party: 'Dealer',
    code: 'Dealer Code',
    od: 'OD Account',
  };
}

/** True when create payload must send vendorMappingId (PID/SID standalone). */
export function isStandaloneProductType(
  productType: InvoiceProductType | string | null | undefined,
): boolean {
  return (
    productType === 'purchase_invoice_discounting' ||
    productType === 'sales_invoice_discounting'
  );
}

/** VF Upfront submit guard — AI expected but calculated as zero. */
/**
 * Warn when Upfront AI (VF|SID) is ₹0 but ROI/tenor/base look like interest should apply.
 * `isVendorFinanceUpfront` means "upfront product + charge" (name kept for callers).
 */
export function shouldWarnVfZeroAdvanceInterest(input: {
  isVendorFinanceUpfront: boolean;
  chargeApplies: boolean;
  advanceInterest: number;
  roiPercent?: number | string | null;
  tenorDays?: number | string | null;
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  tdsAmount: number;
}): boolean {
  if (!input.isVendorFinanceUpfront || !input.chargeApplies) {
    return false;
  }
  if (Number(input.advanceInterest) > 0) {
    return false;
  }
  const aiBase = Math.max(
    0,
    round2(
      input.subTotal -
        input.discountTotal +
        input.taxTotal -
        (Number(input.tdsAmount) || 0),
    ),
  );
  const roi = Number(input.roiPercent) || 0;
  const tenor = Number(input.tenorDays) || 0;
  return aiBase > 0 && roi > 0 && tenor > 0;
}
