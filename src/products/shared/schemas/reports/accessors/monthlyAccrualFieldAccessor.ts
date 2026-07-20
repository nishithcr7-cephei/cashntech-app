import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {MonthlyAccrualReportItem} from '@store/report/report.types';

const formatAmount = (val: number | undefined | null): string => {
  if (val == null || Number.isNaN(Number(val))) {
    return '-';
  }
  return `₹ ${Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatText = (val: string | number | undefined | null): string => {
  if (val == null || val === '') {
    return '-';
  }
  return String(val);
};

export function monthlyAccrualFieldAccessor(
  item: MonthlyAccrualReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'loanAccountNumber':
      return {value: formatText(item.loanAccountNumber)};
    case 'invoiceNumber':
      return {value: formatText(item.invoiceNumber)};
    case 'anchorName':
      return {value: formatText(item.anchorName)};
    case 'bankName':
      return {value: formatText(item.bankName)};
    case 'customer':
      return {value: formatText(item.customer)};
    case 'accruedInterestAmount':
      return {value: formatAmount(item.accruedInterestAmount)};
    case 'postedInterestAmount':
      return {value: formatAmount(item.postedInterestAmount)};
    case 'rate':
      return {value: formatText(item.rate)};
    case 'month':
      return {value: formatText(item.month)};
    case 'postedDate':
      return {value: formatText(item.postedDate)};
    default:
      return {value: '-'};
  }
}
