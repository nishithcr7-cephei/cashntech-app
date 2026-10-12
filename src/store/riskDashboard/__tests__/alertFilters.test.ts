import {
  alertFiltersToSheetValue,
  buildAlertFilterChips,
  buildAlertFilterGroups,
  enumLabel,
  filterAlertRows,
  removeAlertFilter,
  sheetValueToAlertFilters,
} from '@screens/DashboardManagement/AlertDashboard/alertFilters';
import {
  AlertDispatchRow,
  initialAlertFilters,
} from '@store/riskDashboard/riskDashboard.types';

const banks = [{id: 'b1', label: 'UGRO Capital Limited'}];
const programs = [{id: 'p1', label: 'Hemant DF Program'}];

const row = (overrides: Partial<AlertDispatchRow>): AlertDispatchRow => ({
  id: 'r',
  crossingDate: '2026-10-12',
  triggerCode: 'DPD_30',
  emailTriggerType: '',
  program: 'Program',
  monitoredParty: 'Party',
  invoiceCount: 1,
  maxDpd: 0,
  totalOutstanding: 0,
  status: 'SENT',
  statusLabel: 'Sent',
  actionStatus: '',
  caseId: null,
  caseStatus: null,
  closureDate: null,
  createdAt: '',
  ...overrides,
});

describe('alertFilters', () => {
  it('round-trips filters through the sheet value', () => {
    const filters = {bankId: 'b1', programId: 'p1', status: 'SENT' as const, date: '2026-10-12'};
    const value = alertFiltersToSheetValue(filters);
    expect(value).toEqual({
      bankId: ['b1'],
      programId: ['p1'],
      status: ['SENT'],
      date: ['2026-10-12'],
    });
    expect(sheetValueToAlertFilters(value, false)).toEqual(filters);
    expect(alertFiltersToSheetValue(initialAlertFilters)).toEqual({
      bankId: [],
      programId: [],
      status: [],
      date: [],
    });
  });

  it('never sends bankId for a Bank user', () => {
    expect(sheetValueToAlertFilters({bankId: ['b1']}, true).bankId).toBe('');
  });

  it('disables the bank group for a Bank user and hides the "all" status option', () => {
    const groups = buildAlertFilterGroups({banks, programs, loading: false, isBankUser: true});
    const bank = groups[0];
    expect(bank.type === 'single' && bank.disabled).toBe(true);
    const status = groups[2];
    expect(status.type === 'single' && status.options.map(o => o.value)).toEqual([
      'SENT',
      'PARTIAL',
      'FAILED',
    ]);
    expect(groups[3].type).toBe('date');
  });

  it('builds chips with option labels and removes one filter', () => {
    const filters = {bankId: 'b1', programId: 'p1', status: 'PARTIAL' as const, date: '2026-10-12'};
    expect(buildAlertFilterChips(filters, banks, programs).map(c => c.label)).toEqual([
      'Bank: UGRO Capital Limited',
      'Program: Hemant DF Program',
      'Status: Partially Sent',
      'Date: 12-10-2026',
    ]);
    expect(removeAlertFilter(filters, 'programId')).toEqual({...filters, programId: ''});
    expect(buildAlertFilterChips(initialAlertFilters, banks, programs)).toEqual([]);
  });

  it('searches party, program and trigger', () => {
    const rows = [
      row({id: '1', monitoredParty: 'Hemant Enterprises'}),
      row({id: '2', program: 'UGRO VF'}),
      row({id: '3', triggerCode: 'NPA_90'}),
    ];
    expect(filterAlertRows(rows, 'hemant').map(r => r.id)).toEqual(['1']);
    expect(filterAlertRows(rows, 'ugro').map(r => r.id)).toEqual(['2']);
    expect(filterAlertRows(rows, 'npa').map(r => r.id)).toEqual(['3']);
    expect(filterAlertRows(rows, '  ')).toBe(rows);
  });

  it('formats enum labels', () => {
    expect(enumLabel('UNDER_REVIEW')).toBe('Under Review');
    expect(enumLabel('OPEN')).toBe('Open');
    expect(enumLabel('')).toBe('');
  });
});
