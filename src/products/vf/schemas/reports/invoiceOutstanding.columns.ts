import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const INVOICE_OUTSTANDING_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'borrowerName', label: 'Vendor Name', exportHeader: 'Vendor Name'},
  {key: 'borrowerPan', label: 'Vendor PAN', exportHeader: 'Vendor PAN'},
  {key: 'loanAccountNumber', hideForVf: true},
  {key: 'schemeType', hideForVf: true},
];
