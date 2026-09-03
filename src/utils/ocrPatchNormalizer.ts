import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';

/** Product context for Create Invoice — DF vs VF isolation. */
export type InvoiceProductType = 'dealer_finance' | 'vendor_finance';

/**
 * OCR patch normalizer — product-guarded.
 * DF: pass-through (preserves legacy empty-string / prev-field behaviour).
 * VF: missing numeric OCR amounts → 0.00.
 */
export function normalizeOcrPatch(
  patch: Partial<InvoiceFields>,
  productType: InvoiceProductType,
): Partial<InvoiceFields> {
  if (productType !== 'vendor_finance') {
    return patch;
  }
  return normalizeVfOcrPatch(patch);
}

function ocrAmountFieldOrZero(value: string | undefined): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return '0.00';
  }
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? roundAmount(n) : '0.00';
}

function roundAmount(n: number): string {
  return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
}

function normalizeVfOcrLineItem(item: InvoiceLineItem): InvoiceLineItem {
  return {
    ...item,
    discountAmount: ocrAmountFieldOrZero(item.discountAmount || '0'),
    taxAmount: ocrAmountFieldOrZero(item.taxAmount || '0'),
    taxes: (item.taxes || []).map(t => ({
      ...t,
      taxAmount: ocrAmountFieldOrZero(t.taxAmount || '0'),
    })),
  };
}

/** VF-only OCR patch rules — missing bill amounts default to ₹0.00. */
export function normalizeVfOcrPatch(
  patch: Partial<InvoiceFields>,
): Partial<InvoiceFields> {
  return {
    ...patch,
    cgst: ocrAmountFieldOrZero(patch.cgst),
    sgst: ocrAmountFieldOrZero(patch.sgst),
    taxTotal: ocrAmountFieldOrZero(patch.taxTotal),
    grandTotal: ocrAmountFieldOrZero(patch.grandTotal),
    items: (patch.items || []).map(normalizeVfOcrLineItem),
  };
}
