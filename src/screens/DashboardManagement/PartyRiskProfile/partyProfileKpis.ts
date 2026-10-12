import {dpdText, formatCr, pct} from '@utils/riskFormat';
import type {PartyRiskProfile} from '@store/riskDashboard/riskDashboard.types';
import type {RiskKpi} from '../components/RiskKpiCard';

/** RBI SMA convention — same thresholds as backend `smaStatusFromDpd`. */
export const smaStatusFromDpd = (dpd: number): string =>
  dpd >= 90
    ? 'NPA'
    : dpd >= 61
      ? 'SMA-2'
      : dpd >= 31
        ? 'SMA-1'
        : dpd >= 1
          ? 'SMA-0'
          : 'Standard';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "Pune · Borrows from 1 bank across 1 program" */
export const buildPartySubtitle = (p: PartyRiskProfile): string => {
  const bankCount = new Set(p.programs.map(pr => pr.bankId).filter(Boolean)).size;
  const parts = [
    p.city,
    `Borrows from ${plural(bankCount, 'bank')} across ${plural(p.totalPrograms, 'program')}`,
  ];
  return parts.filter(Boolean).join(' · ');
};

/** The five web KPI tiles for a party's cross-bank profile. */
export const buildPartyKpis = (p: PartyRiskProfile): RiskKpi[] => [
  {
    key: 'outstanding',
    title: 'Total Outstanding',
    value: formatCr(p.totalOutstanding),
    subtitle: `Limit ${formatCr(p.totalLimit)}`,
  },
  {
    key: 'utilisation',
    title: 'Utilisation',
    value: `${Math.round(pct(p.totalOutstanding, p.totalLimit))}%`,
    subtitle: 'Across all programs',
  },
  {
    key: 'worstDpd',
    title: 'Worst DPD',
    value: dpdText(p.worstDpd),
    subtitle: smaStatusFromDpd(p.worstDpd),
    valueColor: p.worstDpd > 0 ? '#B5442F' : undefined,
  },
  {
    key: 'overduePrograms',
    title: 'Overdue Programs',
    value: `${p.overduePrograms} of ${p.totalPrograms}`,
    subtitle: 'Programs past due date',
  },
  {
    key: 'banksNotified',
    title: 'Banks Notified',
    value: String(p.banksNotified),
    subtitle: 'All linked banks, per ruleset',
  },
];
