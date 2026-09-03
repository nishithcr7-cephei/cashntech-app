import type {InvoiceFields} from '@type/Invoice';
import {
  normalizeOcrPatch,
  normalizeVfOcrPatch,
} from '@utils/ocrPatchNormalizer';

describe('ocrPatchNormalizer', () => {
  const samplePatch: Partial<InvoiceFields> = {
    invoiceNumber: 'INV-001',
    cgst: '',
    sgst: '',
    taxTotal: '',
    grandTotal: '118000.00',
    items: [
      {
        itemName: 'Steel',
        quantity: '10',
        unit: 'PCS',
        pricePerQuantity: '10000',
        total: '100000',
        taxType: 'GST',
        taxPercentage: '18',
        taxAmount: '18000.00',
        taxes: [{taxType: 'GST', taxPercentage: '18', taxAmount: '18000.00'}],
      },
    ],
  };

  it('DF: returns patch unchanged (pass-through)', () => {
    const result = normalizeOcrPatch(samplePatch, 'dealer_finance');
    expect(result).toBe(samplePatch);
    expect(result.cgst).toBe('');
  });

  it('VF: missing tax/grand fields coerce to 0.00', () => {
    const result = normalizeVfOcrPatch({
      ...samplePatch,
      cgst: '',
      sgst: '',
      taxTotal: '',
      grandTotal: '',
    });
    expect(result.cgst).toBe('0.00');
    expect(result.sgst).toBe('0.00');
    expect(result.taxTotal).toBe('0.00');
    expect(result.grandTotal).toBe('0.00');
  });

  it('VF: preserves extracted tax amounts', () => {
    const result = normalizeOcrPatch(
      {
        cgst: '9000',
        sgst: '9000',
        taxTotal: '',
        grandTotal: '118000',
        items: [],
      },
      'vendor_finance',
    );
    expect(result.cgst).toBe('9000.00');
    expect(result.sgst).toBe('9000.00');
  });

  it('VF: item discount/tax without values default to 0.00', () => {
    const result = normalizeVfOcrPatch({
      items: [
        {
          itemName: 'X',
          quantity: '1',
          unit: 'PCS',
          pricePerQuantity: '100',
          total: '100',
          taxType: '',
          taxAmount: '',
          taxes: [{taxType: '', taxPercentage: '', taxAmount: ''}],
        },
      ],
    });
    expect(result.items?.[0]?.discountAmount).toBe('0.00');
    expect(result.items?.[0]?.taxAmount).toBe('0.00');
  });
});
