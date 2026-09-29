import type {InvoiceLineItem} from '@type/Invoice';
import {
  convertOcrLineItems,
  getOcrLineItemIssues,
  hasOcrLineItemIssues,
} from '@utils/ocrLineItemMapper';

const ocrRow = (overrides: Record<string, unknown> = {}) => ({
  description: 'Widget',
  hsn_code: '',
  quantity: 100,
  rate_per_unit: 100,
  taxable_amount: 0,
  unit: 'PCS',
  ...overrides,
});

const formItem = (overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem => ({
  itemName: 'Widget',
  quantity: '10',
  unit: 'PCS',
  pricePerQuantity: '100',
  total: '1000.00',
  ...overrides,
});

describe('ocrLineItemMapper', () => {
  it('line total is qty × price, not the OCR taxable amount', () => {
    const [item] = convertOcrLineItems([ocrRow({taxable_amount: 9500})]);
    expect(item.total).toBe('10000.00');
    expect(item.quantity).toBe('100');
    expect(item.pricePerQuantity).toBe('100');
    expect(item.itemName).toBe('Widget');
  });

  it('leaves discount and tax blank even if OCR sent them', () => {
    const [item] = convertOcrLineItems([
      ocrRow({
        discount_type: 'value',
        discount_value: 500,
        discount_amount: 500,
        tax_type: 'GST',
        tax_percentage: 18,
        tax_amount: 1800,
      }),
    ]);
    expect(item.discountType).toBe('');
    expect(item.discountValue).toBe('');
    expect(item.discountAmount).toBe('0.00');
    expect(item.taxType).toBe('');
    expect(item.taxPercentage).toBe('');
    expect(item.taxAmount).toBe('0.00');
    expect(item.taxes).toEqual([{taxType: '', taxPercentage: '', taxAmount: '0.00'}]);
  });

  it('normalizes unit synonyms and leaves unknown / missing unit empty (no PCS default)', () => {
    const [nos, unknown, missing] = convertOcrLineItems([
      ocrRow({unit: 'Nos'}),
      ocrRow({unit: 'TON'}),
      ocrRow({unit: ''}),
    ]);
    expect(nos.unit).toBe('PCS');
    expect(unknown.unit).toBe('');
    expect(missing.unit).toBe('');
  });

  it('keeps qty / price empty when OCR could not read them', () => {
    const [item] = convertOcrLineItems([ocrRow({quantity: 0, rate_per_unit: 0})]);
    expect(item.quantity).toBe('');
    expect(item.pricePerQuantity).toBe('');
    expect(item.total).toBe('0.00');
  });
});

describe('getOcrLineItemIssues', () => {
  it('reports no issues for a complete row', () => {
    expect(getOcrLineItemIssues(formItem())).toEqual({
      needsUnit: false,
      invalidQty: false,
      missingPrice: false,
      amountTooLarge: false,
    });
    expect(hasOcrLineItemIssues(formItem())).toBe(false);
  });

  it('flags missing / unknown unit but accepts synonyms', () => {
    expect(getOcrLineItemIssues(formItem({unit: ''})).needsUnit).toBe(true);
    expect(getOcrLineItemIssues(formItem({unit: 'xyz'})).needsUnit).toBe(true);
    expect(getOcrLineItemIssues(formItem({unit: 'kgs'})).needsUnit).toBe(false);
  });

  it('flags quantity below 1 (backend @Min(1)) and allows 1.5', () => {
    expect(getOcrLineItemIssues(formItem({quantity: '0.5'})).invalidQty).toBe(true);
    expect(getOcrLineItemIssues(formItem({quantity: ''})).invalidQty).toBe(true);
    expect(getOcrLineItemIssues(formItem({quantity: '1.5'})).invalidQty).toBe(false);
  });

  it('flags missing price', () => {
    expect(getOcrLineItemIssues(formItem({pricePerQuantity: ''})).missingPrice).toBe(true);
    expect(getOcrLineItemIssues(formItem({pricePerQuantity: '0'})).missingPrice).toBe(true);
  });

  it('flags line amount above backend numeric(10,2) limit', () => {
    expect(
      getOcrLineItemIssues(formItem({quantity: '2', pricePerQuantity: '50000000'})).amountTooLarge,
    ).toBe(true);
    expect(
      getOcrLineItemIssues(formItem({quantity: '1', pricePerQuantity: '99999999.99'})).amountTooLarge,
    ).toBe(false);
    expect(
      getOcrLineItemIssues(formItem({quantity: '1,000', pricePerQuantity: '1,00,000'})).amountTooLarge,
    ).toBe(true);
  });
});
