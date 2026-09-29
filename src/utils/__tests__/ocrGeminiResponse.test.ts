import {
  detectImageMimeType,
  mapGeminiItemsResponse,
  toOcrNumber,
} from '@utils/ocrGeminiResponse';

describe('ocrGeminiResponse', () => {
  it('maps items-only response and computes line total as qty × price', () => {
    const result = mapGeminiItemsResponse({
      invoice_number: 'INV/2026/001',
      items: [{name: 'Widget', quantity: 100, unit: 'nos', price: 100}],
    });

    expect(result.invoice_header.invoice_number).toBe('INV/2026/001');
    expect(result.line_items).toHaveLength(1);
    const [item] = result.line_items;
    expect(item.description).toBe('Widget');
    expect(item.quantity).toBe(100);
    expect(item.rate_per_unit).toBe(100);
    expect(item.taxable_amount).toBe(10000);
    expect(item.unit).toBe('NOS');
    expect(result.financial_summary.sub_total_taxable_value).toBe(10000);
  });

  it('never carries discount or tax from OCR', () => {
    const result = mapGeminiItemsResponse({
      items: [
        {
          name: 'Steel',
          quantity: 10,
          price: 500,
          discount_amount: 50,
          tax_percentage: 18,
          tax_amount: 900,
        },
      ],
    });
    const [item] = result.line_items;
    expect(item.discount_amount).toBe(0);
    expect(item.tax_type).toBe('');
    expect(item.tax_percentage).toBe(0);
    expect(item.tax_amount).toBe(0);
    expect(result.financial_summary.total_cgst_amount).toBe(0);
    expect(result.financial_summary.grand_total_amount).toBe(0);
  });

  it('keeps unit empty when not printed and invoice number empty when null', () => {
    const result = mapGeminiItemsResponse({
      invoice_number: null,
      items: [{name: 'Cement', quantity: 5, unit: null, price: 400}],
    });
    expect(result.invoice_header.invoice_number).toBe('');
    expect(result.line_items[0].unit).toBe('');
  });

  it('parses numbers with commas and currency text', () => {
    expect(toOcrNumber('1,25,000.50')).toBe(125000.5);
    expect(toOcrNumber('₹ 2,500')).toBe(2500);
    expect(toOcrNumber('Rs. 99')).toBe(99);
    expect(toOcrNumber(null)).toBe(0);
    expect(toOcrNumber('abc')).toBe(0);
  });

  it('drops empty rows and tolerates a missing items array', () => {
    expect(mapGeminiItemsResponse({}).line_items).toHaveLength(0);
    expect(mapGeminiItemsResponse(null).line_items).toHaveLength(0);
    const result = mapGeminiItemsResponse({
      items: [{name: '', quantity: null, price: null}, {name: 'Bolt', quantity: 2, price: 3}],
    });
    expect(result.line_items).toHaveLength(1);
    expect(result.line_items[0].description).toBe('Bolt');
  });

  it('detects image mime type from base64 header', () => {
    expect(detectImageMimeType('iVBORw0KGgoAAA')).toBe('image/png');
    expect(detectImageMimeType('/9j/4AAQSkZJRg')).toBe('image/jpeg');
    expect(detectImageMimeType('UklGRiQAAABXRUJQ')).toBe('image/webp');
  });
});
