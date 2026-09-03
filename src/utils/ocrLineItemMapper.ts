import type {InvoiceLineItem} from '@type/Invoice';
import type {GSTInvoiceJSON} from '@services/gstInvoiceExtractor';
import {round2} from '@utils/invoiceTotals';

type GstLineItem = GSTInvoiceJSON['line_items'][number];

function normalizeOcrDiscountType(raw: string | undefined): string {
  const t = String(raw || '').trim().toLowerCase();
  if (t === 'percentage' || t === 'percent' || t === '%') {
    return 'percentage';
  }
  if (t === 'value' || t === 'absolute') {
    return 'value';
  }
  return '';
}

function mapOcrItemDiscount(
  item: GstLineItem,
  lineTotal: number,
): Pick<InvoiceLineItem, 'discountType' | 'discountValue' | 'discountAmount'> {
  const discountAmountRaw = Number(item.discount_amount) || 0;
  const discountType = normalizeOcrDiscountType(item.discount_type);
  const discountValueRaw = Number(item.discount_value) || 0;

  if (discountAmountRaw > 0) {
    return {
      discountType: discountType || 'value',
      discountValue:
        discountValueRaw > 0
          ? String(discountValueRaw)
          : discountAmountRaw.toFixed(2),
      discountAmount: discountAmountRaw.toFixed(2),
    };
  }

  if (discountType === 'percentage' && discountValueRaw > 0 && lineTotal > 0) {
    const amount = round2((lineTotal * discountValueRaw) / 100);
    return {
      discountType: 'percentage',
      discountValue: String(discountValueRaw),
      discountAmount: amount.toFixed(2),
    };
  }

  if (discountType === 'value' && discountValueRaw > 0) {
    const amount = round2(Math.min(discountValueRaw, lineTotal));
    return {
      discountType: 'value',
      discountValue: amount.toFixed(2),
      discountAmount: amount.toFixed(2),
    };
  }

  return {
    discountType: '',
    discountValue: '',
    discountAmount: '0.00',
  };
}

function resolveOcrItemTax(item: GstLineItem): {
  taxType: string;
  taxPercentage: string;
  taxAmount: string;
  hasTax: boolean;
} {
  const empty = {
    taxType: '',
    taxPercentage: '',
    taxAmount: '0.00',
    hasTax: false,
  };

  const taxTypeRaw = String(item.tax_type || '').trim();
  const taxType = taxTypeRaw || 'GST';
  let taxAmount = Number(item.tax_amount) || 0;
  let taxPct = Number(item.tax_percentage) || 0;
  const taxable = Number(item.taxable_amount) || 0;

  const hasTaxSignal =
    taxAmount > 0 ||
    taxPct > 0 ||
    ['GST', 'CGST', 'SGST', 'IGST'].includes(taxTypeRaw.toUpperCase());

  if (!hasTaxSignal) {
    return empty;
  }

  if (taxAmount > 0 && taxPct <= 0 && taxable > 0) {
    taxPct = round2((taxAmount / taxable) * 100);
  } else if (taxPct > 0 && taxAmount <= 0 && taxable > 0) {
    taxAmount = round2((taxable * taxPct) / 100);
  }

  if (taxAmount <= 0 && taxPct <= 0) {
    return empty;
  }

  return {
    taxType,
    taxPercentage: taxPct > 0 ? String(taxPct) : '',
    taxAmount: taxAmount.toFixed(2),
    hasTax: true,
  };
}

/** Map Gemini GST line items → Create Invoice form items (DF + VF OCR). */
export function convertOcrLineItems(
  gstItems: GSTInvoiceJSON['line_items'],
): InvoiceLineItem[] {
  return gstItems.map(item => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate_per_unit) || 0;
    const taxableFromOcr = Number(item.taxable_amount) || 0;
    const lineTotal =
      taxableFromOcr > 0 ? taxableFromOcr : round2(qty * rate);
    const discount = mapOcrItemDiscount(item, lineTotal);
    const tax = resolveOcrItemTax(item);

    return {
      itemName: item.description || '',
      quantity: qty > 0 ? qty.toString() : String(item.quantity ?? ''),
      unit: item.unit || 'PCS',
      pricePerQuantity: rate > 0 ? rate.toString() : String(item.rate_per_unit ?? ''),
      total: lineTotal.toFixed(2),
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      taxType: tax.hasTax ? tax.taxType : '',
      taxPercentage: tax.hasTax ? tax.taxPercentage : '',
      taxAmount: tax.hasTax ? tax.taxAmount : '0.00',
      taxes: tax.hasTax
        ? [
            {
              taxType: tax.taxType,
              taxPercentage: tax.taxPercentage,
              taxAmount: tax.taxAmount,
            },
          ]
        : [{taxType: '', taxPercentage: '', taxAmount: '0.00'}],
    };
  });
}
