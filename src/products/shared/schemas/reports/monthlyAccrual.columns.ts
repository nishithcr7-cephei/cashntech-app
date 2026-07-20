import type {ReportSchema} from '@products/shared/schemas/reports/types';

const c = (label: string, exportHeader?: string) => ({
  label,
  exportHeader: exportHeader ?? label,
});

export const MONTHLY_ACCRUAL_REPORT_SCHEMA: ReportSchema = {
  screenColumnKeys: [
    'loanAccountNumber',
    'invoiceNumber',
    'anchorName',
    'bankName',
    'customer',
    'accruedInterestAmount',
    'postedInterestAmount',
    'rate',
    'month',
    'postedDate',
  ],
  exportColumnKeys: [
    'loanAccountNumber',
    'invoiceNumber',
    'anchorName',
    'bankName',
    'customer',
    'accruedInterestAmount',
    'postedInterestAmount',
    'rate',
    'month',
    'postedDate',
  ],
  columns: {
    loanAccountNumber: {key: 'loanAccountNumber', ...c('Loan Account Number')},
    invoiceNumber: {key: 'invoiceNumber', ...c('Invoice Number')},
    anchorName: {key: 'anchorName', ...c('Anchor Name')},
    bankName: {key: 'bankName', ...c('Bank Name')},
    customer: {key: 'customer', ...c('Customer')},
    accruedInterestAmount: {
      key: 'accruedInterestAmount',
      ...c('Accrued Interest Amount'),
    },
    postedInterestAmount: {
      key: 'postedInterestAmount',
      ...c('Posted Interest Amount'),
    },
    rate: {key: 'rate', ...c('Rate')},
    month: {key: 'month', ...c('Month')},
    postedDate: {key: 'postedDate', ...c('Posted Date')},
  },
};
