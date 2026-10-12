import type {BorrowerRiskRow} from '@store/riskDashboard/riskDashboard.types';
import {alertStatusLabel} from '@utils/normalizeRiskDashboard';
import {enumLabel} from '../AlertDashboard/alertFilters';

export type RiskCategoryChip = '' | 'Critical' | 'High' | 'Medium' | 'Low' | 'None';

const CATEGORY_ORDER: Exclude<RiskCategoryChip, ''>[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
  'None',
];

/** Chip options with live counts, e.g. "Critical (3)"; empty categories are hidden. */
export const buildRiskCategoryChips = (
  rows: BorrowerRiskRow[],
): {value: RiskCategoryChip; label: string}[] => {
  const counts = new Map<string, number>();
  rows.forEach(row => counts.set(row.riskCategory, (counts.get(row.riskCategory) ?? 0) + 1));
  return [
    {value: '', label: `All (${rows.length})`},
    ...CATEGORY_ORDER.filter(category => counts.get(category)).map(category => ({
      value: category,
      label: `${category} (${counts.get(category)})`,
    })),
  ];
};

export const filterBorrowers = (
  rows: BorrowerRiskRow[],
  query: string,
  category: RiskCategoryChip,
): BorrowerRiskRow[] => {
  const q = query.trim().toLowerCase();
  if (!q && !category) {
    return rows;
  }
  return rows.filter(
    row =>
      (!category || row.riskCategory === category) &&
      (!q || row.distributorName.toLowerCase().includes(q)),
  );
};

/** `alert_status` is the raw dispatch enum (SENT…) or "None". */
export const borrowerAlertLabel = (status: string): string =>
  !status || status === 'None' ? 'None' : alertStatusLabel(status);

/** `stop_supply_status` is an action enum (PENDING…) or "Not recommended". */
export const stopSupplyLabel = (status: string): string =>
  !status || status === 'Not recommended' ? 'Not recommended' : enumLabel(status);
