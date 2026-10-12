import {formatCr, pct} from '@utils/riskFormat';
import type {
  BankRiskDetail,
  BankRiskParty,
} from '@store/riskDashboard/riskDashboard.types';
import type {RiskKpi} from '../components/RiskKpiCard';

export type PartyFilterChip = 'all' | 'flagged' | 'sma2npa' | 'crossBank';

export const PARTY_FILTER_CHIPS: {value: PartyFilterChip; label: string}[] = [
  {value: 'all', label: 'All'},
  {value: 'flagged', label: 'Flagged'},
  {value: 'sma2npa', label: 'SMA-2 / NPA'},
  {value: 'crossBank', label: 'Cross-bank'},
];

/** The five web KPI tiles for "<Bank> · Party Risk Profile". */
export const buildBankDetailKpis = (d: BankRiskDetail): RiskKpi[] => {
  const productCount = d.products.length;
  return [
    {
      key: 'outstanding',
      title: 'Total Outstanding',
      value: formatCr(d.totalExposure),
      subtitle: `Across ${productCount} product${productCount === 1 ? '' : 's'}`,
    },
    {
      key: 'overdue',
      title: 'Overdue (1+ DPD)',
      value: formatCr(d.overdueAmount),
      subtitle: `${pct(d.overdueAmount, d.totalExposure)}% of book`,
      valueColor: '#B5442F',
    },
    {
      key: 'npa',
      title: '90+ NPA',
      value: d.npaAmount > 0 ? formatCr(d.npaAmount) : '—',
      subtitle: 'Written to the ruleset ladder',
      valueColor: d.npaAmount > 0 ? '#8A2A1E' : undefined,
    },
    {
      key: 'flagged',
      title: 'Parties Flagged',
      value: String(d.flaggedParties),
      subtitle: `of ${d.parties.length} in view`,
    },
    {
      key: 'stress',
      title: 'Stress From Elsewhere',
      value: String(d.stressFromElsewhere),
      subtitle: 'Current here, overdue at another bank',
      valueColor: '#8A6400',
    },
  ];
};

const matchesChip = (p: BankRiskParty, chip: PartyFilterChip): boolean => {
  switch (chip) {
    case 'flagged':
      return p.currentDpd > 0;
    case 'sma2npa':
      return p.status === 'SMA-2' || p.status === 'NPA';
    case 'crossBank':
      return p.crossBankFlagged;
    default:
      return true;
  }
};

export const filterParties = (
  parties: BankRiskParty[],
  chip: PartyFilterChip,
  query: string,
): BankRiskParty[] => {
  const q = query.trim().toLowerCase();
  return parties.filter(
    p => matchesChip(p, chip) && (!q || p.partyName.toLowerCase().includes(q)),
  );
};

/** "Purchase Invoice Discounting" → "PID" (web shows short product codes in the party table). */
export const shortProductName = (product: string): string => {
  switch (product) {
    case 'Dealer Finance':
      return 'DF';
    case 'Vendor Finance':
      return 'VF';
    case 'Purchase Invoice Discounting':
      return 'PID';
    default:
      return product;
  }
};
