import type {ProductCode} from '@store/product/product.types';

/** Stable ids for the 10 mobile report screens (PR8). */
export type ReportId =
  | 'allLoans'
  | 'disbursement'
  | 'dpd'
  | 'dailyAccrual'
  | 'monthlyAccrual'
  | 'repayment'
  | 'invoiceOutstanding'
  | 'loanStatus'
  | 'allProductOutstanding'
  | 'utilization';

export type ReportColumnBase = {
  key: string;
  /** On-screen label (DF default). */
  label: string;
  /** Excel/CSV header; defaults to `label` when omitted. */
  exportHeader?: string;
};

export type ReportColumnOverride = {
  key: string;
  label?: string;
  exportHeader?: string;
  /** When true, column is omitted for VF until backend data is confirmed. */
  hideForVf?: boolean;
};

export type ReportSchema = {
  screenColumnKeys: string[];
  exportColumnKeys: string[];
  columns: Record<string, ReportColumnBase>;
};

export type ResolvedReportColumn = {
  key: string;
  label: string;
  exportHeader: string;
  visible: true;
};

export type ResolvedReportColumns = {
  screenColumns: ResolvedReportColumn[];
  exportColumns: ResolvedReportColumn[];
};

export type ReportFieldDef = {
  label: string;
  value: string;
  valueStyle?: object;
};

export type ReportColumnProductInput = ProductCode | string | null | undefined;
