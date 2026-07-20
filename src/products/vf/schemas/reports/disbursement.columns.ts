import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const DISBURSEMENT_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'borrowerName', label: 'Vendor Name', exportHeader: 'Vendor Name'},
  {key: 'borrowerPan', label: 'Vendor PAN', exportHeader: 'Vendor PAN'},
  {key: 'loanAccountNumber', hideForVf: true},
  {key: 'finnone_bill_no', hideForVf: true},
  {key: 'margin', hideForVf: true},
  {key: 'bankAccountNumber', hideForVf: true},
  {key: 'ifscCode', hideForVf: true},
];
