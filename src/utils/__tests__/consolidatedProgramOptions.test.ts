import type {Bank} from '@constants/programSelection';
import {
  buildConsolidatedProgramGroups,
  collectProgramIds,
} from '@utils/consolidatedProgramOptions';
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
    id: 'bank-1',
    name: 'UGRO Capital Limited',
    partyId: 'party-1',
    products: [
      {id: 'df-id', name: 'Dealer Finance', programs: [program('p-df', 'DF Program')]},
      {
        id: 'pid-id',
        name: 'Purchase Invoice Discounting',
        programs: [program('p-pid', 'PID Program')],
      },
    ],
  },
  {
    id: 'bank-2',
    name: 'Kotak',
    partyId: 'party-2',
    products: [
      {id: 'vf-id', name: 'Vendor Finance', programs: [program('p-vf', 'VF Program')]},
    ],
  },
];

describe('buildConsolidatedProgramGroups', () => {
  it('lists every product programme grouped by bank when no product is filtered', () => {
    const groups = buildConsolidatedProgramGroups(banks, [], []);
    expect(groups.map(g => g.bankName)).toEqual(['UGRO Capital Limited', 'Kotak']);
    expect(groups[0].programs.map(p => p.id)).toEqual(['p-df', 'p-pid']);
    expect(groups[0].programs[1].productName).toBe('Purchase Invoice Discounting');
  });

  it('keeps only programs of the selected products and drops empty banks', () => {
    const groups = buildConsolidatedProgramGroups(
      banks,
      ['pid-id'],
      [PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING],
    );
    expect(groups).toHaveLength(1);
    expect([...collectProgramIds(groups)]).toEqual(['p-pid']);
  });

  it('returns nothing when scope is not loaded', () => {
    expect(buildConsolidatedProgramGroups(null, [], [])).toEqual([]);
  });
});
