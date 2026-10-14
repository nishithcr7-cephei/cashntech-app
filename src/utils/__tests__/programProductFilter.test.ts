import type {Bank} from '@constants/programSelection';
import {
  collectProgramIdsForActiveProduct,
  filterScopeBanksByActiveProduct,
} from '@utils/programProductFilter';
import {PRODUCT_CODES} from '@store/product/product.types';

const program = (id: string, name: string) => ({
  id,
  name,
  userType: 'vendor' as const,
  method: '',
  role: '',
  status: '',
});

const banks: Bank[] = [
  {
    id: 'bank-sidbi',
    name: 'Small Industries Development Bank of India SIDBI',
    partyId: 'party-1',
    products: [
      {id: 'df-id', name: 'Dealer Finance', programs: [program('p-df', 'DF Program')]},
      {
        id: 'pid-id',
        name: 'Purchase Invoice Discounting',
        programs: [program('p-pid', 'PID Program')],
      },
      {
        id: 'sid-id',
        name: 'Sales Invoice Discounting',
        programs: [program('p-sid', 'Polmor Steel Pvt-SID Program')],
      },
    ],
  },
  {
    id: 'bank-kotak',
    name: 'Kotak',
    partyId: 'party-2',
    products: [
      {id: 'vf-id', name: 'Vendor Finance', programs: [program('p-vf', 'VF Program')]},
    ],
  },
];

describe('programProductFilter — SID', () => {
  it('keeps only SID programs in the SID workspace', () => {
    expect(
      collectProgramIdsForActiveProduct(
        banks,
        PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
      ),
    ).toEqual(['p-sid']);
    expect(
      filterScopeBanksByActiveProduct(
        banks,
        PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
      ).map(b => b.id),
    ).toEqual(['bank-sidbi']);
  });

  it('does not leak SID programs into PID, VF or DF', () => {
    expect(
      collectProgramIdsForActiveProduct(
        banks,
        PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
      ),
    ).toEqual(['p-pid']);
    expect(
      collectProgramIdsForActiveProduct(banks, PRODUCT_CODES.VENDOR_FINANCE),
    ).toEqual(['p-vf']);
    expect(
      collectProgramIdsForActiveProduct(banks, PRODUCT_CODES.DEALER_FINANCE),
    ).toEqual(['p-df']);
  });
});
