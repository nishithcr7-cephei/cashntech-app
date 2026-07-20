import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

/** No required label overrides; guarded columns hidden until backend confirmed. */
export const ALL_PRODUCT_OUTSTANDING_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'productCode', hideForVf: true},
  {key: 'odAccountNo', hideForVf: true},
  {key: 'loanAccountNo', hideForVf: true},
];
