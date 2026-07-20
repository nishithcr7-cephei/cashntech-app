import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const ALL_LOANS_VF_OVERRIDES: ReportColumnOverride[] = [
  {
    key: 'vendorDealerName',
    label: 'Vendor Name',
    exportHeader: 'Vendor Name',
  },
  {key: 'productCode', hideForVf: true},
  {key: 'odAccountNo', hideForVf: true},
  {key: 'loanAccountNo', hideForVf: true},
];
