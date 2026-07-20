import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const DAILY_ACCRUAL_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'customer', label: 'Vendor', exportHeader: 'Vendor'},
  {key: 'loanAccountNumber', hideForVf: true},
];
