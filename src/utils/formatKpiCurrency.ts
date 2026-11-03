/** 1 crore (Indian numbering). */
export const KPI_CRORE = 10_000_000;

/** 1 lakh (Indian numbering). */
export const KPI_LAKH = 100_000;

export type FormatKpiCurrencyOptions = {
  /** Shown when value is null, undefined, or empty string. Default `'-'`. */
  empty?: string;
  /** Max decimal places for Cr / Lakh tiers. Default `2`. */
  maxDecimals?: number;
};

const parseKpiAmount = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = Number(trimmed.replace(/,/g, ''));
    return Number.isFinite(num) ? num : null;
  }
  return Number.isFinite(value) ? value : null;
};

const trimFixedDecimals = (scaled: number, maxDecimals: number): string => {
  const fixed = scaled.toFixed(maxDecimals);
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/\.?0+$/, '');
};

const formatScaled = (
  amount: number,
  divisor: number,
  unit: 'Cr' | 'Lakh',
  maxDecimals: number,
): string => {
  const sign = amount < 0 ? '-' : '';
  const scaled = Math.abs(amount) / divisor;
  const body = trimFixedDecimals(scaled, maxDecimals);
  return `${sign}₹ ${body} ${unit}`;
};

const formatFullInr = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const absFormatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}₹ ${absFormatted}`;
};

/**
 * Compact INR for KPI tiles: Cr (≥1 crore), Lakh (≥1 lakh), else full en-IN with 2 decimals.
 * Matches invoice KPI prefix style (`₹ ` with space).
 */
export const formatKpiCurrency = (
  value: number | string | null | undefined,
  options?: FormatKpiCurrencyOptions,
): string => {
  const empty = options?.empty ?? '-';
  const maxDecimals = options?.maxDecimals ?? 2;

  const num = parseKpiAmount(value);
  if (num === null) return empty;

  const abs = Math.abs(num);
  if (abs >= KPI_CRORE) {
    return formatScaled(num, KPI_CRORE, 'Cr', maxDecimals);
  }
  if (abs >= KPI_LAKH) {
    return formatScaled(num, KPI_LAKH, 'Lakh', maxDecimals);
  }
  return formatFullInr(num);
};
