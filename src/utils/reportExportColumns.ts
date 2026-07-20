import type {GenericExcelExportColumn} from '@services/api/export.api';
import {resolveReportExportColumns} from '@products/shared/schemas/reports/reportColumnResolver';
import {PRODUCT_CODES} from '@store/product/product.types';

export type ReportExportColumn = GenericExcelExportColumn;

/** DF-default export columns — identical to pre-PR8 static definitions. */
export const DISBURSEMENT_EXPORT_COLUMNS = resolveReportExportColumns(
  'disbursement',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const LOAN_STATUS_EXPORT_COLUMNS = resolveReportExportColumns(
  'loanStatus',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const UTILIZATION_EXPORT_COLUMNS = resolveReportExportColumns(
  'utilization',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const INVOICE_OUTSTANDING_EXPORT_COLUMNS = resolveReportExportColumns(
  'invoiceOutstanding',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const ALL_PRODUCT_OUTSTANDING_EXPORT_COLUMNS = resolveReportExportColumns(
  'allProductOutstanding',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const ALL_LOAN_EXPORT_COLUMNS = resolveReportExportColumns(
  'allLoans',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const DPD_EXPORT_COLUMNS = resolveReportExportColumns(
  'dpd',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const DAILY_ACCRUAL_EXPORT_COLUMNS = resolveReportExportColumns(
  'dailyAccrual',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const MONTHLY_ACCRUAL_EXPORT_COLUMNS = resolveReportExportColumns(
  'monthlyAccrual',
  PRODUCT_CODES.DEALER_FINANCE,
);

export const REPAYMENT_EXPORT_COLUMNS = resolveReportExportColumns(
  'repayment',
  PRODUCT_CODES.DEALER_FINANCE,
);
