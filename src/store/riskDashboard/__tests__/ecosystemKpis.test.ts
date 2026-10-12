import {
  buildEcosystemKpis,
  filterBanksByName,
} from '@screens/DashboardManagement/EcosystemRiskProfile/ecosystemKpis';

const overview = {
  bankCount: 8,
  totalExposure: 56_500_000,
  overdueAmount: 30_000_000,
  npaAmount: 700_000,
  npaBankCount: 1,
  flaggedParties: 6,
  multiBankFlagged: 1,
  dpdBuckets: [],
};

describe('buildEcosystemKpis', () => {
  it('builds the five web tiles', () => {
    const kpis = buildEcosystemKpis(overview);
    expect(kpis.map(k => k.title)).toEqual([
      'Total Outstanding',
      'Overdue (1+ DPD)',
      '90+ NPA',
      'Parties Flagged',
      'Overdue at 2+ Banks',
    ]);
    expect(kpis[0]).toMatchObject({value: '₹5.65 Cr', subtitle: 'Across 8 banks'});
    expect(kpis[1].subtitle).toBe('53.1% of book');
    expect(kpis[2]).toMatchObject({value: '₹0.07 Cr', subtitle: 'Across 1 bank'});
  });

  it('shows an em dash for zero NPA', () => {
    const kpis = buildEcosystemKpis({...overview, npaAmount: 0});
    expect(kpis[2].value).toBe('—');
  });
});

describe('filterBanksByName', () => {
  const rows = [{bankName: 'UGRO Capital Limited'}, {bankName: 'State Bank of India'}];

  it('matches case-insensitively and ignores blank queries', () => {
    expect(filterBanksByName(rows, ' ugro ')).toEqual([rows[0]]);
    expect(filterBanksByName(rows, '')).toBe(rows);
  });
});
