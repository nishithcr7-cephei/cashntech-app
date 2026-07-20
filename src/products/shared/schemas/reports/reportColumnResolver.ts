import type {GenericExcelExportColumn} from '@services/api/export.api';
import {isVendorFinance} from '@store/product/product.resolver';
import type {ProductCode} from '@store/product/product.types';
import {ALL_LOANS_REPORT_SCHEMA} from '@products/shared/schemas/reports/allLoans.columns';
import {DISBURSEMENT_REPORT_SCHEMA} from '@products/shared/schemas/reports/disbursement.columns';
import {DPD_REPORT_SCHEMA} from '@products/shared/schemas/reports/dpd.columns';
import {DAILY_ACCRUAL_REPORT_SCHEMA} from '@products/shared/schemas/reports/dailyAccrual.columns';
import {MONTHLY_ACCRUAL_REPORT_SCHEMA} from '@products/shared/schemas/reports/monthlyAccrual.columns';
import {REPAYMENT_REPORT_SCHEMA} from '@products/shared/schemas/reports/repayment.columns';
import {INVOICE_OUTSTANDING_REPORT_SCHEMA} from '@products/shared/schemas/reports/invoiceOutstanding.columns';
import {LOAN_STATUS_REPORT_SCHEMA} from '@products/shared/schemas/reports/loanStatus.columns';
import {ALL_PRODUCT_OUTSTANDING_REPORT_SCHEMA} from '@products/shared/schemas/reports/allProductOutstanding.columns';
import {UTILIZATION_REPORT_SCHEMA} from '@products/shared/schemas/reports/utilization.columns';
import {ALL_LOANS_DF_OVERRIDES} from '@products/df/schemas/reports/allLoans.columns';
import {DISBURSEMENT_DF_OVERRIDES} from '@products/df/schemas/reports/disbursement.columns';
import {DPD_DF_OVERRIDES} from '@products/df/schemas/reports/dpd.columns';
import {DAILY_ACCRUAL_DF_OVERRIDES} from '@products/df/schemas/reports/dailyAccrual.columns';
import {MONTHLY_ACCRUAL_DF_OVERRIDES} from '@products/df/schemas/reports/monthlyAccrual.columns';
import {REPAYMENT_DF_OVERRIDES} from '@products/df/schemas/reports/repayment.columns';
import {INVOICE_OUTSTANDING_DF_OVERRIDES} from '@products/df/schemas/reports/invoiceOutstanding.columns';
import {LOAN_STATUS_DF_OVERRIDES} from '@products/df/schemas/reports/loanStatus.columns';
import {ALL_PRODUCT_OUTSTANDING_DF_OVERRIDES} from '@products/df/schemas/reports/allProductOutstanding.columns';
import {UTILIZATION_DF_OVERRIDES} from '@products/df/schemas/reports/utilization.columns';
import {ALL_LOANS_VF_OVERRIDES} from '@products/vf/schemas/reports/allLoans.columns';
import {DISBURSEMENT_VF_OVERRIDES} from '@products/vf/schemas/reports/disbursement.columns';
import {DPD_VF_OVERRIDES} from '@products/vf/schemas/reports/dpd.columns';
import {DAILY_ACCRUAL_VF_OVERRIDES} from '@products/vf/schemas/reports/dailyAccrual.columns';
import {MONTHLY_ACCRUAL_VF_OVERRIDES} from '@products/vf/schemas/reports/monthlyAccrual.columns';
import {REPAYMENT_VF_OVERRIDES} from '@products/vf/schemas/reports/repayment.columns';
import {INVOICE_OUTSTANDING_VF_OVERRIDES} from '@products/vf/schemas/reports/invoiceOutstanding.columns';
import {LOAN_STATUS_VF_OVERRIDES} from '@products/vf/schemas/reports/loanStatus.columns';
import {ALL_PRODUCT_OUTSTANDING_VF_OVERRIDES} from '@products/vf/schemas/reports/allProductOutstanding.columns';
import {UTILIZATION_VF_OVERRIDES} from '@products/vf/schemas/reports/utilization.columns';
import type {
  ReportColumnOverride,
  ReportColumnProductInput,
  ReportId,
  ReportSchema,
  ResolvedReportColumn,
  ResolvedReportColumns,
} from '@products/shared/schemas/reports/types';

const BASE_SCHEMAS: Record<ReportId, ReportSchema> = {
  allLoans: ALL_LOANS_REPORT_SCHEMA,
  disbursement: DISBURSEMENT_REPORT_SCHEMA,
  dpd: DPD_REPORT_SCHEMA,
  dailyAccrual: DAILY_ACCRUAL_REPORT_SCHEMA,
  monthlyAccrual: MONTHLY_ACCRUAL_REPORT_SCHEMA,
  repayment: REPAYMENT_REPORT_SCHEMA,
  invoiceOutstanding: INVOICE_OUTSTANDING_REPORT_SCHEMA,
  loanStatus: LOAN_STATUS_REPORT_SCHEMA,
  allProductOutstanding: ALL_PRODUCT_OUTSTANDING_REPORT_SCHEMA,
  utilization: UTILIZATION_REPORT_SCHEMA,
};

const DF_OVERRIDES: Record<ReportId, ReportColumnOverride[]> = {
  allLoans: ALL_LOANS_DF_OVERRIDES,
  disbursement: DISBURSEMENT_DF_OVERRIDES,
  dpd: DPD_DF_OVERRIDES,
  dailyAccrual: DAILY_ACCRUAL_DF_OVERRIDES,
  monthlyAccrual: MONTHLY_ACCRUAL_DF_OVERRIDES,
  repayment: REPAYMENT_DF_OVERRIDES,
  invoiceOutstanding: INVOICE_OUTSTANDING_DF_OVERRIDES,
  loanStatus: LOAN_STATUS_DF_OVERRIDES,
  allProductOutstanding: ALL_PRODUCT_OUTSTANDING_DF_OVERRIDES,
  utilization: UTILIZATION_DF_OVERRIDES,
};

const VF_OVERRIDES: Record<ReportId, ReportColumnOverride[]> = {
  allLoans: ALL_LOANS_VF_OVERRIDES,
  disbursement: DISBURSEMENT_VF_OVERRIDES,
  dpd: DPD_VF_OVERRIDES,
  dailyAccrual: DAILY_ACCRUAL_VF_OVERRIDES,
  monthlyAccrual: MONTHLY_ACCRUAL_VF_OVERRIDES,
  repayment: REPAYMENT_VF_OVERRIDES,
  invoiceOutstanding: INVOICE_OUTSTANDING_VF_OVERRIDES,
  loanStatus: LOAN_STATUS_VF_OVERRIDES,
  allProductOutstanding: ALL_PRODUCT_OUTSTANDING_VF_OVERRIDES,
  utilization: UTILIZATION_VF_OVERRIDES,
};

function resolveColumnList(
  schema: ReportSchema,
  columnKeys: string[],
  overrides: Map<string, ReportColumnOverride>,
  isVf: boolean,
): ResolvedReportColumn[] {
  const resolved: ResolvedReportColumn[] = [];

  for (const key of columnKeys) {
    const base = schema.columns[key];
    if (!base) {
      continue;
    }

    const override = overrides.get(key);
    if (isVf && override?.hideForVf) {
      continue;
    }

    const label = override?.label ?? base.label;
    const exportHeader =
      override?.exportHeader ?? base.exportHeader ?? label;

    resolved.push({
      key,
      label,
      exportHeader,
      visible: true,
    });
  }

  return resolved;
}

/**
 * Resolve on-screen and export column definitions for a report + active product.
 * DF: identical labels/order/visibility to pre-PR8 hardcoded columns.
 * VF: label overrides + guarded columns hidden per implementation plan.
 */
export function resolveReportColumns(
  reportId: ReportId,
  activeProduct: ReportColumnProductInput,
): ResolvedReportColumns {
  const schema = BASE_SCHEMAS[reportId];
  const isVf =
    activeProduct != null &&
    activeProduct !== '' &&
    isVendorFinance(activeProduct as ProductCode);
  const overridesList = isVf ? VF_OVERRIDES[reportId] : DF_OVERRIDES[reportId];
  const overrides = new Map(overridesList.map(entry => [entry.key, entry]));

  return {
    screenColumns: resolveColumnList(
      schema,
      schema.screenColumnKeys,
      overrides,
      isVf,
    ),
    exportColumns: resolveColumnList(
      schema,
      schema.exportColumnKeys,
      overrides,
      isVf,
    ),
  };
}

export function toExportColumns(
  columns: ResolvedReportColumn[],
): GenericExcelExportColumn[] {
  return columns.map(column => ({
    header: column.exportHeader,
    key: column.key,
  }));
}

export function resolveReportExportColumns(
  reportId: ReportId,
  activeProduct: ReportColumnProductInput,
): GenericExcelExportColumn[] {
  return toExportColumns(resolveReportColumns(reportId, activeProduct).exportColumns);
}
