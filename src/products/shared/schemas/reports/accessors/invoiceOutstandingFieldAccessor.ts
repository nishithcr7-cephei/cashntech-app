import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {InvoiceOutstandingReportItem} from '@store/report/report.types';

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

export function invoiceOutstandingFieldAccessor(
  item: InvoiceOutstandingReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'anchorName':
      return {value: formatText(item.anchorName)};
    case 'anchorPan':
      return {value: formatText(item.anchorPan)};
    case 'borrowerName':
      return {value: formatText(item.borrowerName)};
    case 'borrowerPan':
      return {value: formatText(item.borrowerPan)};
    case 'loanAccountNumber':
      return {value: formatText(item.loanAccountNumber)};
    case 'losId':
      return {value: formatText(item.losId)};
    case 'schemeType':
      return {value: formatText(item.schemeType)};
    case 'invoiceNumber':
      return {value: formatText(item.invoiceNumber)};
    case 'tranchNumber':
      return {value: formatText(item.tranchNumber)};
    case 'invoiceDate':
      return {value: formatText(item.invoiceDate)};
    case 'disbursementDate':
      return {value: formatText(item.disbursementDate)};
    case 'maturityDate':
      return {value: formatText(item.maturityDate)};
    case 'roi':
      return {value: formatText(item.roi)};
    case 'invoiceValue':
      return {value: formatAmount(item.invoiceValue)};
    case 'loanValue':
      return {value: formatAmount(item.loanValue)};
    case 'disbursementAmount':
      return {value: formatAmount(item.disbursementAmount)};
    case 'principalOS':
      return {value: formatAmount(item.principalOS)};
    case 'interestOS':
      return {value: formatAmount(item.interestOS)};
    case 'penalOS':
      return {value: formatAmount(item.penalOS)};
    case 'invoiceStatus':
      return {value: formatText(item.invoiceStatus)};
    case 'closedDate':
      return {value: formatText(item.closedDate)};
    default:
      return {value: '-'};
  }
}
