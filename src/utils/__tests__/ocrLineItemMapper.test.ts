import {convertOcrLineItems} from '@utils/ocrLineItemMapper';

describe('ocrLineItemMapper', () => {
  it('maps line discount amount from OCR', () => {
    const [item] = convertOcrLineItems([
      {
        description: 'Widget',
        hsn_code: '1234',
        quantity: 10,
        rate_per_unit: 1000,
        taxable_amount: 9500,
        unit: 'PCS',
        discount_type: 'value',
        discount_value: 500,
        discount_amount: 500,
        tax_type: '',
        tax_percentage: 0,
        tax_amount: 0,
      },
    ]);
    expect(item.discountAmount).toBe('500.00');
    expect(item.discountType).toBe('value');
    expect(item.total).toBe('9500.00');
  });

  it('infers tax percentage when only tax amount is present', () => {
    const [item] = convertOcrLineItems([
      {
        description: 'Steel',
        hsn_code: '7208',
        quantity: 10,
        rate_per_unit: 10000,
        taxable_amount: 100000,
        unit: 'PCS',
        discount_type: '',
        discount_value: 0,
        discount_amount: 0,
        tax_type: 'GST',
        tax_percentage: 0,
        tax_amount: 18000,
      },
    ]);
    expect(item.taxType).toBe('GST');
    expect(item.taxAmount).toBe('18000.00');
    expect(item.taxPercentage).toBe('18');
  });

  it('computes tax amount when only percentage is present', () => {
    const [item] = convertOcrLineItems([
      {
        description: 'Cement',
        hsn_code: '2523',
        quantity: 5,
        rate_per_unit: 400,
        taxable_amount: 2000,
        unit: 'BAG',
        tax_type: 'GST',
        tax_percentage: 18,
        tax_amount: 0,
      },
    ]);
    expect(item.taxAmount).toBe('360.00');
    expect(item.taxPercentage).toBe('18');
  });

  it('defaults missing discount to 0.00', () => {
    const [item] = convertOcrLineItems([
      {
        description: 'Item',
        hsn_code: '',
        quantity: 1,
        rate_per_unit: 100,
        taxable_amount: 100,
        tax_type: '',
        tax_percentage: 0,
        tax_amount: 0,
      },
    ]);
    expect(item.discountAmount).toBe('0.00');
    expect(item.taxAmount).toBe('0.00');
  });
});
