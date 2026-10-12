import {formatCr, pct} from '@utils/riskFormat';
import type {EcosystemOverview} from '@store/riskDashboard/riskDashboard.types';
import type {RiskKpi} from '../components/RiskKpiCard';

const banks = (n: number) => `${n} bank${n === 1 ? '' : 's'}`;

/** The five web KPI tiles for Ecosystem Risk Profile. */
export const buildEcosystemKpis = (o: EcosystemOverview): RiskKpi[] => [
  {
    key: 'outstanding',
    title: 'Total Outstanding',
    value: formatCr(o.totalExposure),
    subtitle: `Across ${banks(o.bankCount)}`,
  },
  {
    key: 'overdue',
    title: 'Overdue (1+ DPD)',
    value: formatCr(o.overdueAmount),
    subtitle: `${pct(o.overdueAmount, o.totalExposure)}% of book`,
    valueColor: o.overdueAmount > 0 ? '#B5442F' : undefined,
  },
  {
    key: 'npa',
    title: '90+ NPA',
    value: o.npaAmount > 0 ? formatCr(o.npaAmount) : '—',
    subtitle: `Across ${banks(o.npaBankCount)}`,
    valueColor: o.npaAmount > 0 ? '#8A2A1E' : undefined,
  },
  {
    key: 'flagged',
    title: 'Parties Flagged',
    value: String(o.flaggedParties),
    subtitle: 'Dealers and anchors with any overdue',
  },
  {
    key: 'multiBank',
    title: 'Overdue at 2+ Banks',
    value: String(o.multiBankFlagged),
    subtitle: 'Cross-bank contagion risk',
    valueColor: o.multiBankFlagged > 0 ? '#B5442F' : undefined,
  },
];

export const filterBanksByName = <T extends {bankName: string}>(
  rows: T[],
  query: string,
): T[] => {
  const q = query.trim().toLowerCase();
  return q ? rows.filter(r => r.bankName.toLowerCase().includes(q)) : rows;
};
