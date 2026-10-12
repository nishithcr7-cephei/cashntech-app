jest.mock('@utils/crypto', () => ({decryptConditionally: (value: string) => value}));
jest.mock('@services/api/api', () => ({}));

import {
  borrowerAlertLabel,
  buildRiskCategoryChips,
  filterBorrowers,
  stopSupplyLabel,
} from '@screens/DashboardManagement/BorrowerRiskDashboard/borrowerFilters';
import type {BorrowerRiskRow} from '@store/riskDashboard/riskDashboard.types';

const row = (overrides: Partial<BorrowerRiskRow>): BorrowerRiskRow => ({
  distributorId: 'd',
  distributorName: 'Distributor',
  activeCompanies: 1,
  activeBanks: 1,
  totalExposure: 0,
  currentDpd: 0,
  riskCategory: 'None',
  alertStatus: 'None',
  stopSupplyStatus: 'Not recommended',
  resolutionStatus: 'No case',
  ...overrides,
});

const rows = [
  row({distributorId: '1', distributorName: 'Hemant Enterprises', riskCategory: 'Critical'}),
  row({distributorId: '2', distributorName: 'Shree Traders', riskCategory: 'Low'}),
  row({distributorId: '3', distributorName: 'Hemant Agencies', riskCategory: 'Low'}),
];

describe('borrowerFilters', () => {
  it('builds category chips in severity order with counts, hiding empty ones', () => {
    expect(buildRiskCategoryChips(rows)).toEqual([
      {value: '', label: 'All (3)'},
      {value: 'Critical', label: 'Critical (1)'},
      {value: 'Low', label: 'Low (2)'},
    ]);
    expect(buildRiskCategoryChips([])).toEqual([{value: '', label: 'All (0)'}]);
  });

  it('filters by name and category together', () => {
    expect(filterBorrowers(rows, '', '')).toBe(rows);
    expect(filterBorrowers(rows, 'hemant', '').map(r => r.distributorId)).toEqual(['1', '3']);
    expect(filterBorrowers(rows, '', 'Low').map(r => r.distributorId)).toEqual(['2', '3']);
    expect(filterBorrowers(rows, ' HEMANT ', 'Low').map(r => r.distributorId)).toEqual(['3']);
  });

  it('maps raw backend statuses to labels', () => {
    expect(borrowerAlertLabel('SENT')).toBe('Sent');
    expect(borrowerAlertLabel('PARTIAL')).toBe('Partially Sent');
    expect(borrowerAlertLabel('None')).toBe('None');
    expect(stopSupplyLabel('UNDER_REVIEW')).toBe('Under Review');
    expect(stopSupplyLabel('ACCEPTED')).toBe('Accepted');
    expect(stopSupplyLabel('Not recommended')).toBe('Not recommended');
  });
});
