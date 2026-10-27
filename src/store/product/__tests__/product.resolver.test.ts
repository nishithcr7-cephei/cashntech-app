import {
  getPartyLabels,
  isPid,
  isProductNavLocked,
  isSid,
  isStandaloneProduct,
  resolveAvailableProducts,
  resolveProductCode,
  uniqueProductsByCode,
  usesVendorPartyLabels,
  usesVendorPartyLayout,
} from '@store/product/product.resolver';
import {PRODUCT_CODES} from '@store/product/product.types';

describe('resolveProductCode — SID', () => {
  it('resolves SID from the backend product name', () => {
    expect(resolveProductCode({name: 'Sales Invoice Discounting'})).toBe(
      PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
    );
  });

  it('resolves SID from code tokens', () => {
    expect(resolveProductCode({product_code: 'SID'})).toBe(
      PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
    );
    expect(resolveProductCode({code: 'sales_invoice_discounting'})).toBe(
      PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
    );
  });

  it('does not confuse SID with PID', () => {
    expect(resolveProductCode({name: 'Purchase Invoice Discounting'})).toBe(
      PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
    );
    expect(resolveProductCode({name: 'Sales Invoice Discounting'})).not.toBe(
      PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
    );
  });

  it('keeps VF with a padded backend code', () => {
    expect(resolveProductCode({product_code: ' VF'})).toBe(
      PRODUCT_CODES.VENDOR_FINANCE,
    );
  });

  it('skips unsupported CFD', () => {
    expect(
      resolveProductCode({name: 'Channel Finance Discounting ', product_code: 'CFD'}),
    ).toBeNull();
  });
});

describe('product helpers — SID', () => {
  it('does not lock SID (or other products) in nav after unlock', () => {
    expect(isProductNavLocked(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toBe(
      false,
    );
    expect(isProductNavLocked(PRODUCT_CODES.DEALER_FINANCE)).toBe(false);
    expect(isProductNavLocked(PRODUCT_CODES.VENDOR_FINANCE)).toBe(false);
    expect(isProductNavLocked(PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING)).toBe(
      false,
    );
  });

  it('treats SID as standalone but not PID', () => {
    expect(isSid(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toBe(true);
    expect(isPid(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toBe(false);
    expect(isStandaloneProduct(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toBe(
      true,
    );
    expect(isStandaloneProduct(PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING)).toBe(
      true,
    );
    expect(isStandaloneProduct(PRODUCT_CODES.VENDOR_FINANCE)).toBe(false);
  });

  it('does not give SID vendor party labels', () => {
    expect(usesVendorPartyLabels(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toBe(
      false,
    );
  });
});

describe('party labels — Phase 2', () => {
  it('returns Debtor wording for SID', () => {
    expect(getPartyLabels(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toEqual({
      singular: 'Debtor',
      plural: 'Debtors',
      nameLabel: 'Debtor Name',
      codeLabel: 'Debtor Code',
    });
  });

  it('keeps Vendor for VF / PID and Dealer for DF or no product', () => {
    expect(getPartyLabels(PRODUCT_CODES.VENDOR_FINANCE).singular).toBe('Vendor');
    expect(
      getPartyLabels(PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING).codeLabel,
    ).toBe('Vendor Code');
    expect(getPartyLabels(PRODUCT_CODES.DEALER_FINANCE).nameLabel).toBe(
      'Dealer Name',
    );
    expect(getPartyLabels(null).plural).toBe('Dealers');
  });

  it('uses the vendor row layout for VF, PID and SID but not DF', () => {
    expect(usesVendorPartyLayout(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toBe(
      true,
    );
    expect(
      usesVendorPartyLayout(PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING),
    ).toBe(true);
    expect(usesVendorPartyLayout(PRODUCT_CODES.VENDOR_FINANCE)).toBe(true);
    expect(usesVendorPartyLayout(PRODUCT_CODES.DEALER_FINANCE)).toBe(false);
  });
});

describe('uniqueProductsByCode — order', () => {
  it('orders DF → VF → PID → SID and drops CFD', () => {
    const products = resolveAvailableProducts([
      {id: 'cfd-id', name: 'Channel Finance Discounting '},
      {id: 'sid-id', name: 'Sales Invoice Discounting'},
      {id: 'pid-id', name: 'Purchase Invoice Discounting'},
      {id: 'vf-id', name: 'Vendor Finance'},
      {id: 'df-id', name: 'Dealer Finance'},
    ]);
    expect(uniqueProductsByCode(products).map(p => p.code)).toEqual([
      PRODUCT_CODES.DEALER_FINANCE,
      PRODUCT_CODES.VENDOR_FINANCE,
      PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
      PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
    ]);
  });
});
