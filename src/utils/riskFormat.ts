import {formatKpiCurrency} from './formatKpiCurrency';

/** Compact INR for risk KPI tiles (Cr / Lakh / full — same as invoice KPI cards). */
export const formatCr = (amount: number): string =>
  formatKpiCurrency(Number(amount) || 0);

/** ₹12,34,567 — Indian grouping, no decimals. */
export const formatInr = (amount: number): string =>
  `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;

/** Percentage of `part` in `whole`, 1 decimal; 0 when whole is 0. */
export const pct = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

/** "2026-10-12" or an ISO timestamp → "12-10-2026"; unparseable input is returned as-is. */
export const formatRiskDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value || '-';
};

/** DPD 0 renders as an em dash, matching web. */
export const dpdText = (dpd: number): string =>
  dpd > 0 ? String(dpd) : '—';
