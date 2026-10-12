import type {
  FilterSheetGroup,
  FilterSheetValue,
} from '@components/FilterSheet/filterSheet.utils';
import {
  ALERT_STATUS_FILTER_OPTIONS,
  AlertDispatchFilters,
  AlertDispatchRow,
  AlertStatusFilter,
  FilterOption,
} from '@store/riskDashboard/riskDashboard.types';
import {formatRiskDate} from '@utils/riskFormat';

export type AlertFilterKey = keyof AlertDispatchFilters;

export type AlertFilterChip = {key: AlertFilterKey; label: string};

const STATUS_OPTIONS = ALERT_STATUS_FILTER_OPTIONS.filter(option => option.value);

const toSheetOptions = (options: FilterOption[]) =>
  options.map(option => ({value: option.id, label: option.label}));

export const buildAlertFilterGroups = (params: {
  banks: FilterOption[];
  programs: FilterOption[];
  loading: boolean;
  isBankUser: boolean;
}): FilterSheetGroup[] => [
  {
    type: 'single',
    key: 'bankId',
    title: 'Bank',
    allLabel: 'All banks',
    options: toSheetOptions(params.banks),
    searchable: true,
    searchPlaceholder: 'Search bank',
    loading: params.loading,
    disabled: params.isBankUser,
    disabledText: 'Your bank',
  },
  {
    type: 'single',
    key: 'programId',
    title: 'Program',
    allLabel: 'All programs',
    options: toSheetOptions(params.programs),
    searchable: true,
    searchPlaceholder: 'Search program',
    loading: params.loading,
  },
  {
    type: 'single',
    key: 'status',
    title: 'Status',
    allLabel: 'All statuses',
    options: STATUS_OPTIONS.map(option => ({
      value: option.value,
      label: option.label,
    })),
  },
  {type: 'date', key: 'date', title: 'Alert Date'},
];

const one = (value: string) => (value ? [value] : []);

export const alertFiltersToSheetValue = (
  filters: AlertDispatchFilters,
): FilterSheetValue => ({
  bankId: one(filters.bankId),
  programId: one(filters.programId),
  status: one(filters.status),
  date: one(filters.date),
});

/** Bank users are scoped to their own bank by the backend, so bankId is never sent. */
export const sheetValueToAlertFilters = (
  draft: FilterSheetValue,
  isBankUser: boolean,
): AlertDispatchFilters => ({
  bankId: isBankUser ? '' : draft.bankId?.[0] ?? '',
  programId: draft.programId?.[0] ?? '',
  status: (draft.status?.[0] ?? '') as AlertStatusFilter,
  date: draft.date?.[0] ?? '',
});

const labelOf = (options: FilterOption[], id: string) =>
  options.find(option => option.id === id)?.label ?? 'Selected';

export const buildAlertFilterChips = (
  filters: AlertDispatchFilters,
  banks: FilterOption[],
  programs: FilterOption[],
): AlertFilterChip[] => {
  const chips: AlertFilterChip[] = [];
  if (filters.bankId) {
    chips.push({key: 'bankId', label: `Bank: ${labelOf(banks, filters.bankId)}`});
  }
  if (filters.programId) {
    chips.push({
      key: 'programId',
      label: `Program: ${labelOf(programs, filters.programId)}`,
    });
  }
  if (filters.status) {
    const status = STATUS_OPTIONS.find(option => option.value === filters.status);
    chips.push({key: 'status', label: `Status: ${status?.label ?? filters.status}`});
  }
  if (filters.date) {
    chips.push({key: 'date', label: `Date: ${formatRiskDate(filters.date)}`});
  }
  return chips;
};

export const removeAlertFilter = (
  filters: AlertDispatchFilters,
  key: AlertFilterKey,
): AlertDispatchFilters => ({...filters, [key]: ''});

/** "UNDER_REVIEW" → "Under Review" */
export const enumLabel = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Client-side search over the loaded rows (party, program, trigger). */
export const filterAlertRows = (
  rows: AlertDispatchRow[],
  query: string,
): AlertDispatchRow[] => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return rows;
  }
  return rows.filter(row =>
    [row.monitoredParty, row.program, row.triggerCode].some(text =>
      String(text || '').toLowerCase().includes(q),
    ),
  );
};
