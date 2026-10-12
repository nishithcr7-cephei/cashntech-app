export type FilterSheetOption = {value: string; label: string; caption?: string};

/** Checkbox list with "Select all"; the top-level checkbox toggles the whole group. */
export type FilterSheetMultiGroup = {
  type: 'multi';
  key: string;
  title: string;
  options: FilterSheetOption[];
};

/** Radio list; an empty selection means "all" (`allLabel`). */
export type FilterSheetSingleGroup = {
  type: 'single';
  key: string;
  title: string;
  options: FilterSheetOption[];
  allLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
  /** Shown read-only (e.g. a Bank user's own bank, forced by the backend). */
  disabled?: boolean;
  disabledText?: string;
};

/** Single date; value is stored as YYYY-MM-DD. */
export type FilterSheetDateGroup = {
  type: 'date';
  key: string;
  title: string;
};

export type FilterSheetGroup =
  | FilterSheetMultiGroup
  | FilterSheetSingleGroup
  | FilterSheetDateGroup;

/** Selected values per group key; single/date groups hold at most one value. */
export type FilterSheetValue = Record<string, string[]>;

export const toggleValue = (list: string[], value: string): string[] =>
  list.includes(value) ? list.filter(v => v !== value) : [...list, value];

export const isAllSelected = (
  options: FilterSheetOption[],
  selected: string[],
): boolean =>
  options.length > 0 && options.every(option => selected.includes(option.value));

/** Top-level group checkbox: anything selected → clear, nothing selected → select all. */
export const toggleWholeGroup = (
  options: FilterSheetOption[],
  selected: string[],
): string[] => (selected.length ? [] : options.map(option => option.value));

/** "Select all" row inside a group. */
export const toggleSelectAll = (
  options: FilterSheetOption[],
  selected: string[],
): string[] =>
  isAllSelected(options, selected) ? [] : options.map(option => option.value);

export const filterOptions = (
  options: FilterSheetOption[],
  query: string,
): FilterSheetOption[] => {
  const q = query.trim().toLowerCase();
  return q ? options.filter(option => option.label.toLowerCase().includes(q)) : options;
};

/** Label shown next to a single-select group on the main list. */
export const singleSelectionLabel = (
  group: FilterSheetSingleGroup,
  selected: string[],
): string => {
  if (group.disabled && group.disabledText) {
    return group.disabledText;
  }
  const value = selected[0];
  if (!value) {
    return group.allLabel;
  }
  return group.options.find(option => option.value === value)?.label ?? group.allLabel;
};

export const cloneFilterSheetValue = (value: FilterSheetValue): FilterSheetValue =>
  Object.fromEntries(Object.entries(value).map(([key, list]) => [key, [...list]]));

/** "2026-10-12" → Date at local midnight (avoids the UTC shift of `new Date(iso)`). */
export const parseIsoDate = (iso: string): Date | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};

export const toIsoDate = (date: Date): string => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
};

/** "2026-10-12" → "12-10-2026" */
export const isoToDisplayDate = (iso: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
};
