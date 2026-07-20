import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const MONTHLY_ACCRUAL_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'customer', label: 'Vendor', exportHeader: 'Vendor'},
  {key: 'loanAccountNumber', hideForVf: true},
];
