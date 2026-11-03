import {
  buildBankDetailKpis,
  filterParties,
  shortProductName,
} from '@screens/DashboardManagement/BankRiskDetail/bankDetailKpis';
import {
  buildPartyKpis,
  buildPartySubtitle,
  smaStatusFromDpd,
} from '@screens/DashboardManagement/PartyRiskProfile/partyProfileKpis';
import {formatRiskDate} from '@utils/riskFormat';
import type {
  BankRiskDetail,
  BankRiskParty,
  PartyRiskProfile,
} from '@store/riskDashboard/riskDashboard.types';

const party = (overrides: Partial<BankRiskParty>): BankRiskParty => ({
  partyId: 'p',
  partyName: 'Party',
  city: 'Pune',
  role: 'Anchor',
  products: ['Purchase Invoice Discounting'],
  outstanding: 0,
  currentDpd: 0,
  crossBankNote: 'Only with this bank',
  crossBankFlagged: false,
  status: 'Standard',
  ...overrides,
});

const parties = [
  party({partyId: 'a', partyName: 'Hemant Enterprises Pvt'}),
  party({partyId: 'b', partyName: 'Shree Agency', currentDpd: 70, status: 'SMA-2'}),
  party({partyId: 'c', partyName: 'Cross Co', crossBankFlagged: true}),
];

describe('bank detail', () => {
  it('filters parties by chip and search', () => {
    expect(filterParties(parties, 'all', '')).toHaveLength(3);
    expect(filterParties(parties, 'flagged', '').map(p => p.partyId)).toEqual(['b']);
    expect(filterParties(parties, 'sma2npa', '').map(p => p.partyId)).toEqual(['b']);
    expect(filterParties(parties, 'crossBank', '').map(p => p.partyId)).toEqual(['c']);
    expect(filterParties(parties, 'all', 'hemant').map(p => p.partyId)).toEqual(['a']);
  });

  it('builds the five tiles', () => {
    const detail: BankRiskDetail = {
      bankId: 'b1',
      bankName: 'UGRO Capital Limited',
      products: ['Purchase Invoice Discounting'],
      totalExposure: 800_000,
      overdueAmount: 0,
      npaAmount: 0,
      flaggedParties: 0,
      stressFromElsewhere: 0,
      dpdBuckets: [],
      productSummaries: [],
      parties: parties.slice(0, 2),
    };
    const kpis = buildBankDetailKpis(detail);
    expect(kpis.map(k => k.value)).toEqual(['₹ 8 Lakh', '₹ 0.00', '—', '0', '0']);
    expect(kpis[0].subtitle).toBe('Across 1 product');
    expect(kpis[1].subtitle).toBe('0% of book');
    expect(kpis[3].subtitle).toBe('of 2 in view');
  });

  it('shortens product names', () => {
    expect(shortProductName('Purchase Invoice Discounting')).toBe('PID');
    expect(shortProductName('Dealer Finance')).toBe('DF');
    expect(shortProductName('Something Else')).toBe('Something Else');
  });
});

describe('party profile', () => {
  const profile: PartyRiskProfile = {
    partyName: 'Hemant Enterprises Pvt',
    city: 'Pune',
    role: 'Anchor',
    totalOutstanding: 200_000,
    totalLimit: 5_000_000,
    worstDpd: 0,
    overduePrograms: 0,
    totalPrograms: 1,
    banksNotified: 0,
    programs: [
      {
        bankId: 'b1',
        bankName: 'UGRO',
        product: 'Purchase Invoice Discounting',
        role: 'Anchor',
        programName: 'Hemant Enterprise PID Program',
        limit: 5_000_000,
        outstanding: 200_000,
        currentDpd: 0,
        status: 'Standard',
      },
    ],
    history: [],
    linked: [],
    alerts: [],
    dpdBuckets: [],
  };

  it('builds subtitle and tiles like web', () => {
    expect(buildPartySubtitle(profile)).toBe(
      'Pune · Borrows from 1 bank across 1 program',
    );
    const kpis = buildPartyKpis(profile);
    expect(kpis.map(k => k.value)).toEqual(['₹ 2 Lakh', '4%', '—', '0 of 1', '0']);
    expect(kpis[0].subtitle).toBe('Limit ₹ 50 Lakh');
    expect(kpis[2].subtitle).toBe('Standard');
  });

  it('maps DPD to SMA status at the backend boundaries', () => {
    expect([0, 1, 30, 31, 60, 61, 89, 90].map(smaStatusFromDpd)).toEqual([
      'Standard',
      'SMA-0',
      'SMA-0',
      'SMA-1',
      'SMA-1',
      'SMA-2',
      'SMA-2',
      'NPA',
    ]);
  });

  it('formats alert dates', () => {
    expect(formatRiskDate('2026-10-12')).toBe('12-10-2026');
    expect(formatRiskDate('2026-10-12T05:30:00.000Z')).toBe('12-10-2026');
    expect(formatRiskDate('')).toBe('-');
  });
});
