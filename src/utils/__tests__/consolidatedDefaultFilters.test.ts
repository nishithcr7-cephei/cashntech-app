import {resolveDefaultConsolidatedFilters} from '@utils/consolidatedDefaultFilters';
import {initialConsolidatedFilters} from '@store/consolidatedInvoice/consolidatedInvoice.types';
import {PRODUCT_CODES} from '@store/product/product.types';

const options = [
  {code: PRODUCT_CODES.DEALER_FINANCE, productIds: ['df-bank-1', 'df-bank-2']},
  {code: PRODUCT_CODES.VENDOR_FINANCE, productIds: ['vf-id']},
  {code: PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING, productIds: ['pid-id']},
];

describe('resolveDefaultConsolidatedFilters', () => {
  it('defaults to the active product with all programs and no statuses', () => {
    expect(
      resolveDefaultConsolidatedFilters(
        PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
        options,
      ),
    ).toEqual({...initialConsolidatedFilters, productIds: ['pid-id']});
  });

  it('includes every bank-wise id of the active product', () => {
    expect(
      resolveDefaultConsolidatedFilters(PRODUCT_CODES.DEALER_FINANCE, options)
        .productIds,
    ).toEqual(['df-bank-1', 'df-bank-2']);
  });

  it('falls back to all products when the active product is unknown or unavailable', () => {
    expect(resolveDefaultConsolidatedFilters(null, options)).toEqual(
      initialConsolidatedFilters,
    );
    expect(
      resolveDefaultConsolidatedFilters(PRODUCT_CODES.VENDOR_FINANCE, []),
    ).toEqual(initialConsolidatedFilters);
  });
});
