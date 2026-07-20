import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const LOAN_STATUS_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'borrowerName', label: 'Vendor Name', exportHeader: 'Vendor Name'},
  {key: 'borrowerPan', label: 'Vendor PAN', exportHeader: 'Vendor PAN'},
  {
    key: 'borrowerConstitution',
    label: 'Vendor Constitution',
    exportHeader: 'Vendor Constitution',
  },
  {
    key: 'borrowerCifNo',
    label: 'Vendor CIF No.',
    exportHeader: 'Vendor CIF No.',
  },
  {key: 'loanAccNo', hideForVf: true},
  {key: 'schemetype', hideForVf: true},
];
