import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const DPD_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'borrowerName', label: 'Vendor Name', exportHeader: 'Vendor Name'},
  {key: 'loanAccountNumber', hideForVf: true},
];
