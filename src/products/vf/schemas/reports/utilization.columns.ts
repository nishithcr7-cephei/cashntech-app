import type {ReportColumnOverride} from '@products/shared/schemas/reports/types';

export const UTILIZATION_VF_OVERRIDES: ReportColumnOverride[] = [
  {key: 'borrowerName', label: 'Vendor Name', exportHeader: 'Vendor Name'},
  {key: 'borrowerPan', label: 'Vendor PAN', exportHeader: 'Vendor PAN'},
  {key: 'lan', hideForVf: true},
  {key: 'schemetype', hideForVf: true},
  {key: 'latePaymentDue', hideForVf: true},
  {key: 'totalChargesDue', hideForVf: true},
];
