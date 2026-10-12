import {
  cloneFilterSheetValue,
  filterOptions,
  FilterSheetSingleGroup,
  isAllSelected,
  isoToDisplayDate,
  parseIsoDate,
  singleSelectionLabel,
  toggleSelectAll,
  toggleValue,
  toggleWholeGroup,
  toIsoDate,
} from '../filterSheet.utils';

const options = [
  {value: 'a', label: 'Alpha Bank'},
  {value: 'b', label: 'Beta Finance'},
];

describe('filterSheet.utils', () => {
  it('toggles single values', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('group checkbox clears when anything is selected, else selects all', () => {
    expect(toggleWholeGroup(options, ['a'])).toEqual([]);
    expect(toggleWholeGroup(options, [])).toEqual(['a', 'b']);
  });

  it('"Select all" toggles between all and none', () => {
    expect(isAllSelected(options, ['a', 'b'])).toBe(true);
    expect(isAllSelected([], [])).toBe(false);
    expect(toggleSelectAll(options, ['a'])).toEqual(['a', 'b']);
    expect(toggleSelectAll(options, ['a', 'b'])).toEqual([]);
  });

  it('filters options case-insensitively', () => {
    expect(filterOptions(options, ' beta ')).toEqual([options[1]]);
    expect(filterOptions(options, '')).toBe(options);
  });

  it('labels single selections, honouring disabled text', () => {
    const group: FilterSheetSingleGroup = {
      type: 'single',
      key: 'bank',
      title: 'Bank',
      allLabel: 'All banks',
      options,
    };
    expect(singleSelectionLabel(group, [])).toBe('All banks');
    expect(singleSelectionLabel(group, ['b'])).toBe('Beta Finance');
    expect(singleSelectionLabel(group, ['zzz'])).toBe('All banks');
    expect(
      singleSelectionLabel({...group, disabled: true, disabledText: 'Your bank'}, ['b']),
    ).toBe('Your bank');
  });

  it('clones values deeply enough that drafts do not mutate the source', () => {
    const source = {bank: ['a']};
    const copy = cloneFilterSheetValue(source);
    copy.bank.push('b');
    expect(source.bank).toEqual(['a']);
  });

  it('converts ISO dates without a timezone shift', () => {
    const date = parseIsoDate('2026-10-12');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(12);
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(isoToDisplayDate('2026-10-12')).toBe('12-10-2026');
    expect(parseIsoDate('12-10-2026')).toBeUndefined();
    expect(isoToDisplayDate('')).toBe('');
  });
});
