import type {InvoiceLineItem} from '@type/Invoice';
import type {GSTInvoiceJSON} from '@services/gstInvoiceExtractor';
import {round2} from '@utils/invoiceTotals';
import {normalizeUnit} from '@utils/unitNormalizer';

/** Backend `numeric(10,2)` limit for `price_per_quantity` and `total`. */
export const MAX_LINE_AMOUNT = 99999999.99;

/**
 * Map OCR line items → Create Invoice form items.
 * OCR supplies name / qty / unit / price only. Discount and tax are left blank for
 * the user to pick (program-specific), so OCR and manual entry use the same maths.
 */
export function convertOcrLineItems(
  gstItems: GSTInvoiceJSON['line_items'],
): InvoiceLineItem[] {
  return gstItems.map(item => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate_per_unit) || 0;

    return {
      itemName: item.description || '',
      quantity: qty > 0 ? String(qty) : '',
      unit: normalizeUnit(item.unit),
      pricePerQuantity: rate > 0 ? String(rate) : '',
      total: round2(qty * rate).toFixed(2),
      discountType: '',
      discountValue: '',
      discountAmount: '0.00',
      taxType: '',
      taxPercentage: '',
      taxAmount: '0.00',
      taxes: [{taxType: '', taxPercentage: '', taxAmount: '0.00'}],
    };
  });
}

export type OcrLineItemIssues = {
  needsUnit: boolean;
  /** Backend requires quantity ≥ 1. */
  invalidQty: boolean;
  missingPrice: boolean;
  amountTooLarge: boolean;
};

function toNumber(value: string | undefined): number {
  const parsed = parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Derived from current values so issues clear as soon as the user fixes the row. */
export function getOcrLineItemIssues(item: InvoiceLineItem): OcrLineItemIssues {
  const qty = toNumber(item.quantity);
  const price = toNumber(item.pricePerQuantity);
  return {
    needsUnit: normalizeUnit(item.unit) === '',
    invalidQty: qty < 1,
    missingPrice: price <= 0,
    amountTooLarge: price > MAX_LINE_AMOUNT || round2(qty * price) > MAX_LINE_AMOUNT,
  };
}

export function hasOcrLineItemIssues(item: InvoiceLineItem): boolean {
  return Object.values(getOcrLineItemIssues(item)).some(Boolean);
}
