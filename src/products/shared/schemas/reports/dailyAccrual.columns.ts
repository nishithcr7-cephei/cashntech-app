import type {ReportSchema} from '@products/shared/schemas/reports/types';

const c = (label: string, exportHeader?: string) => ({
  label,
  exportHeader: exportHeader ?? label,
});

export const DAILY_ACCRUAL_REPORT_SCHEMA: ReportSchema = {
  screenColumnKeys: [
    'loanAccountNumber',
    'invoiceNumber',
    'customer',
    'dailyInterest',
    'date',
    'cumulative',
  ],
  exportColumnKeys: [
    'srNo',
    'loanAccountNumber',
    'invoiceNumber',
    'customer',
    'dailyInterest',
    'date',
    'cumulative',
  ],
  columns: {
    srNo: {key: 'srNo', ...c('Sr No')},
    loanAccountNumber: {key: 'loanAccountNumber', ...c('Loan Account Number')},
    invoiceNumber: {key: 'invoiceNumber', ...c('Invoice Number')},
    customer: {key: 'customer', ...c('Customer')},
    dailyInterest: {key: 'dailyInterest', ...c('Daily Interest')},
    date: {key: 'date', ...c('Date')},
    cumulative: {key: 'cumulative', ...c('Cumulative')},
  },
};
