import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {DailyAccrualReportItem} from '@store/report/report.types';

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

export function dailyAccrualFieldAccessor(
  item: DailyAccrualReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'loanAccountNumber':
      return {value: formatText(item.loanAccountNumber)};
    case 'invoiceNumber':
      return {value: formatText(item.invoiceNumber)};
    case 'customer':
      return {value: formatText(item.customer)};
    case 'dailyInterest':
      return {value: formatAmount(item.dailyInterest)};
    case 'date':
      return {value: formatText(item.date)};
    case 'cumulative':
      return {value: formatAmount(item.cumulative)};
    default:
      return {value: '-'};
  }
}
