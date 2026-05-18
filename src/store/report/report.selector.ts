import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';
import {ReportState} from './report.types';

const selectReportState = (state: RootState): ReportState => state.report;

export const selectAllLoansReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.allLoansReportData,
);

export const selectIsReportLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.loading,
);

export const selectReportError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.error,
);

export const selectDisbursementReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.disbursementReportData,
);

export const selectIsDisbursementLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.disbursementLoading,
);

export const selectDisbursementError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.disbursementError,
);

export const selectDpdReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.dpdReportData,
);

export const selectIsDpdLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.dpdLoading,
);

export const selectDpdError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.dpdError,
);

export const selectDailyAccrualReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.dailyAccrualReportData,
);

export const selectIsDailyAccrualLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.dailyAccrualLoading,
);

export const selectDailyAccrualError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.dailyAccrualError,
);

export const selectMonthlyAccrualReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.monthlyAccrualReportData,
);

export const selectIsMonthlyAccrualLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.monthlyAccrualLoading,
);

export const selectMonthlyAccrualError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.monthlyAccrualError,
);

export const selectRepaymentReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.repaymentReportData,
);

export const selectIsRepaymentLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.repaymentLoading,
);

export const selectRepaymentError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.repaymentError,
);

export const selectInvoiceOutstandingReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.invoiceOutstandingReportData,
);

export const selectIsInvoiceOutstandingLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.invoiceOutstandingLoading,
);

export const selectInvoiceOutstandingError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.invoiceOutstandingError,
);

export const selectLoanStatusReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.loanStatusReportData,
);

export const selectIsLoanStatusLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.loanStatusLoading,
);

export const selectLoanStatusError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.loanStatusError,
);

export const selectAllProductOutstandingReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.allProductOutstandingReportData,
);

export const selectIsAllProductOutstandingLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.allProductOutstandingLoading,
);

export const selectAllProductOutstandingError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.allProductOutstandingError,
);

export const selectUtilizationReportData = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.utilizationReportData,
);

export const selectIsUtilizationLoading = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.utilizationLoading,
);

export const selectUtilizationError = createSelector(
  [selectReportState],
  (reportState: ReportState) => reportState.utilizationError,
);
