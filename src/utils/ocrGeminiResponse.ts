import type {GSTInvoiceJSON} from '@services/gstInvoiceExtractor';
import {round2} from '@utils/invoiceTotals';

/**
 * Items-only OCR contract: Gemini reads invoice number + item name / qty / unit / price.
 * Discount and tax are always entered by the user (program-specific), so they are
 * never taken from the image.
 */
export type GeminiItemsResponse = {
  invoice_number?: unknown;
  items?: unknown;
};

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value).trim();
  return text.toLowerCase() === 'null' ? '' : text;
}

export function toOcrNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const cleaned = toText(value)
    .replace(/^(rs\.?|inr)/i, '')
    .replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Adapts the items-only response to the existing `GSTInvoiceJSON` shape used by Create Invoice. */
export function mapGeminiItemsResponse(raw: GeminiItemsResponse | null | undefined): GSTInvoiceJSON {
  const rows = Array.isArray(raw?.items) ? raw.items : [];

  const lineItems: GSTInvoiceJSON['line_items'] = rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map(row => {
      const quantity = toOcrNumber(row.quantity);
      const price = toOcrNumber(row.price);
      return {
        description: toText(row.name),
        hsn_code: '',
        quantity,
        rate_per_unit: price,
        taxable_amount: round2(quantity * price),
        unit: toText(row.unit).toUpperCase(),
        discount_type: '',
        discount_value: 0,
        discount_amount: 0,
        tax_type: '',
        tax_percentage: 0,
        tax_amount: 0,
      };
    })
    .filter(item => item.description || item.quantity > 0 || item.rate_per_unit > 0);

  return {
    invoice_header: {
      invoice_number: toText(raw?.invoice_number),
      invoice_date: '',
      seller_name: '',
      seller_gstin: '',
      buyer_name: '',
      buyer_gstin: '',
      order_no: '',
    },
    line_items: lineItems,
    financial_summary: {
      sub_total_taxable_value: round2(
        lineItems.reduce((sum, item) => sum + item.taxable_amount, 0),
      ),
      total_cgst_amount: 0,
      total_sgst_amount: 0,
      grand_total_amount: 0,
      total_in_words: '',
    },
  };
}

/** Detects the image type from base64 magic bytes; falls back to JPEG. */
export function detectImageMimeType(base64: string): string {
  if (base64.startsWith('iVBORw0KGgo')) {
    return 'image/png';
  }
  if (base64.startsWith('UklGR')) {
    return 'image/webp';
  }
  return 'image/jpeg';
}
