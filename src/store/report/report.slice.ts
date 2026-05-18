import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  AllLoanReportItem,
  AllLoansReportRequestPayload,
  DisbursementReportItem,
  DisbursementReportRequestPayload,
  DailyAccrualReportItem,
  DailyAccrualReportRequestPayload,
  MonthlyAccrualReportItem,
  MonthlyAccrualReportRequestPayload,
  InvoiceOutstandingReportItem,
  InvoiceOutstandingReportRequestPayload,
  LoanStatusReportItem,
  LoanStatusReportRequestPayload,
  AllProductOutstandingReportItem,
  AllProductOutstandingReportRequestPayload,
  UtilizationReportItem,
  UtilizationReportRequestPayload,
  RepaymentReportItem,
  RepaymentReportRequestPayload,
  DpdReportItem,
  DpdReportRequestPayload,
  initialReportState,
  ReportState,
} from './report.types';

const reportSlice = createSlice({
  name: 'report',
  initialState: initialReportState,
  reducers: {
    fetchAllLoansReportRequest: (
      state: ReportState,
      _action: PayloadAction<AllLoansReportRequestPayload>,
    ) => {
      state.loading = true;
      state.error = null;
    },
    fetchAllLoansReportSuccess: (
      state: ReportState,
      action: PayloadAction<AllLoanReportItem[]>,
    ) => {
      state.allLoansReportData = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchAllLoansReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.loading = false;
      state.error = action.payload;
      state.allLoansReportData = [];
    },
    fetchDisbursementReportRequest: (
      state: ReportState,
      _action: PayloadAction<DisbursementReportRequestPayload>,
    ) => {
      state.disbursementLoading = true;
      state.disbursementError = null;
    },
    fetchDisbursementReportSuccess: (
      state: ReportState,
      action: PayloadAction<DisbursementReportItem[]>,
    ) => {
      state.disbursementReportData = action.payload;
      state.disbursementLoading = false;
      state.disbursementError = null;
    },
    fetchDisbursementReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.disbursementLoading = false;
      state.disbursementError = action.payload;
      state.disbursementReportData = [];
    },
    fetchDpdReportRequest: (
      state: ReportState,
      _action: PayloadAction<DpdReportRequestPayload>,
    ) => {
      state.dpdLoading = true;
      state.dpdError = null;
    },
    fetchDpdReportSuccess: (
      state: ReportState,
      action: PayloadAction<DpdReportItem[]>,
    ) => {
      state.dpdReportData = action.payload;
      state.dpdLoading = false;
      state.dpdError = null;
    },
    fetchDpdReportFailure: (state: ReportState, action: PayloadAction<string>) => {
      state.dpdLoading = false;
      state.dpdError = action.payload;
      state.dpdReportData = [];
    },
    fetchDailyAccrualReportRequest: (
      state: ReportState,
      _action: PayloadAction<DailyAccrualReportRequestPayload>,
    ) => {
      state.dailyAccrualLoading = true;
      state.dailyAccrualError = null;
    },
    fetchDailyAccrualReportSuccess: (
      state: ReportState,
      action: PayloadAction<DailyAccrualReportItem[]>,
    ) => {
      state.dailyAccrualReportData = action.payload;
      state.dailyAccrualLoading = false;
      state.dailyAccrualError = null;
    },
    fetchDailyAccrualReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.dailyAccrualLoading = false;
      state.dailyAccrualError = action.payload;
      state.dailyAccrualReportData = [];
    },
    fetchMonthlyAccrualReportRequest: (
      state: ReportState,
      _action: PayloadAction<MonthlyAccrualReportRequestPayload>,
    ) => {
      state.monthlyAccrualLoading = true;
      state.monthlyAccrualError = null;
    },
    fetchMonthlyAccrualReportSuccess: (
      state: ReportState,
      action: PayloadAction<MonthlyAccrualReportItem[]>,
    ) => {
      state.monthlyAccrualReportData = action.payload;
      state.monthlyAccrualLoading = false;
      state.monthlyAccrualError = null;
    },
    fetchMonthlyAccrualReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.monthlyAccrualLoading = false;
      state.monthlyAccrualError = action.payload;
      state.monthlyAccrualReportData = [];
    },
    fetchRepaymentReportRequest: (
      state: ReportState,
      _action: PayloadAction<RepaymentReportRequestPayload>,
    ) => {
      state.repaymentLoading = true;
      state.repaymentError = null;
    },
    fetchRepaymentReportSuccess: (
      state: ReportState,
      action: PayloadAction<RepaymentReportItem[]>,
    ) => {
      state.repaymentReportData = action.payload;
      state.repaymentLoading = false;
      state.repaymentError = null;
    },
    fetchRepaymentReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.repaymentLoading = false;
      state.repaymentError = action.payload;
      state.repaymentReportData = [];
    },
    fetchInvoiceOutstandingReportRequest: (
      state: ReportState,
      _action: PayloadAction<InvoiceOutstandingReportRequestPayload>,
    ) => {
      state.invoiceOutstandingLoading = true;
      state.invoiceOutstandingError = null;
    },
    fetchInvoiceOutstandingReportSuccess: (
      state: ReportState,
      action: PayloadAction<InvoiceOutstandingReportItem[]>,
    ) => {
      state.invoiceOutstandingReportData = action.payload;
      state.invoiceOutstandingLoading = false;
      state.invoiceOutstandingError = null;
    },
    fetchInvoiceOutstandingReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.invoiceOutstandingLoading = false;
      state.invoiceOutstandingError = action.payload;
      state.invoiceOutstandingReportData = [];
    },
    fetchLoanStatusReportRequest: (
      state: ReportState,
      _action: PayloadAction<LoanStatusReportRequestPayload>,
    ) => {
      state.loanStatusLoading = true;
      state.loanStatusError = null;
    },
    fetchLoanStatusReportSuccess: (
      state: ReportState,
      action: PayloadAction<LoanStatusReportItem[]>,
    ) => {
      state.loanStatusReportData = action.payload;
      state.loanStatusLoading = false;
      state.loanStatusError = null;
    },
    fetchLoanStatusReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.loanStatusLoading = false;
      state.loanStatusError = action.payload;
      state.loanStatusReportData = [];
    },
    fetchAllProductOutstandingReportRequest: (
      state: ReportState,
      _action: PayloadAction<AllProductOutstandingReportRequestPayload>,
    ) => {
      state.allProductOutstandingLoading = true;
      state.allProductOutstandingError = null;
    },
    fetchAllProductOutstandingReportSuccess: (
      state: ReportState,
      action: PayloadAction<AllProductOutstandingReportItem[]>,
    ) => {
      state.allProductOutstandingReportData = action.payload;
      state.allProductOutstandingLoading = false;
      state.allProductOutstandingError = null;
    },
    fetchAllProductOutstandingReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.allProductOutstandingLoading = false;
      state.allProductOutstandingError = action.payload;
      state.allProductOutstandingReportData = [];
    },
    fetchUtilizationReportRequest: (
      state: ReportState,
      _action: PayloadAction<UtilizationReportRequestPayload>,
    ) => {
      state.utilizationLoading = true;
      state.utilizationError = null;
    },
    fetchUtilizationReportSuccess: (
      state: ReportState,
      action: PayloadAction<UtilizationReportItem[]>,
    ) => {
      state.utilizationReportData = action.payload;
      state.utilizationLoading = false;
      state.utilizationError = null;
    },
    fetchUtilizationReportFailure: (
      state: ReportState,
      action: PayloadAction<string>,
    ) => {
      state.utilizationLoading = false;
      state.utilizationError = action.payload;
      state.utilizationReportData = [];
    },
  },
});

export const {
  fetchAllLoansReportRequest,
  fetchAllLoansReportSuccess,
  fetchAllLoansReportFailure,
  fetchDisbursementReportRequest,
  fetchDisbursementReportSuccess,
  fetchDisbursementReportFailure,
  fetchDpdReportRequest,
  fetchDpdReportSuccess,
  fetchDpdReportFailure,
  fetchDailyAccrualReportRequest,
  fetchDailyAccrualReportSuccess,
  fetchDailyAccrualReportFailure,
  fetchMonthlyAccrualReportRequest,
  fetchMonthlyAccrualReportSuccess,
  fetchMonthlyAccrualReportFailure,
  fetchRepaymentReportRequest,
  fetchRepaymentReportSuccess,
  fetchRepaymentReportFailure,
  fetchInvoiceOutstandingReportRequest,
  fetchInvoiceOutstandingReportSuccess,
  fetchInvoiceOutstandingReportFailure,
  fetchLoanStatusReportRequest,
  fetchLoanStatusReportSuccess,
  fetchLoanStatusReportFailure,
  fetchAllProductOutstandingReportRequest,
  fetchAllProductOutstandingReportSuccess,
  fetchAllProductOutstandingReportFailure,
  fetchUtilizationReportRequest,
  fetchUtilizationReportSuccess,
  fetchUtilizationReportFailure,
} = reportSlice.actions;

export default reportSlice.reducer;
