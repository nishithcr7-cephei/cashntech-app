import {Colors, Fonts} from '@constants/index';
import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {DpdReportItem} from '@store/report/report.types';

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

export function dpdFieldAccessor(
  item: DpdReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'lmsId':
      return {value: formatText(item.lmsId)};
    case 'invoiceNumber':
      return {value: formatText(item.invoiceNumber)};
    case 'invoiceDate':
      return {value: formatText(item.invoiceDate)};
    case 'loanAccountNumber':
      return {value: formatText(item.loanAccountNumber)};
    case 'programName':
      return {value: formatText(item.programName)};
    case 'productType':
      return {value: formatText(item.productType)};
    case 'bankName':
      return {value: formatText(item.bankName)};
    case 'anchorName':
      return {value: formatText(item.anchorName)};
    case 'borrowerName':
      return {value: formatText(item.borrowerName)};
    case 'disbursementDate':
      return {value: formatText(item.disbursementDate)};
    case 'dueDate':
      return {value: formatText(item.dueDate)};
    case 'tenure':
      return {value: formatText(item.tenure)};
    case 'principalOS':
      return {value: formatAmount(item.principalOS)};
    case 'principalDue':
      return {value: formatAmount(item.principalDue)};
    case 'interestOS':
      return {value: formatAmount(item.interestOS)};
    case 'interestDue':
      return {value: formatAmount(item.interestDue)};
    case 'penalDue':
      return {value: formatAmount(item.penalDue)};
    case 'totalOutstanding':
      return {value: formatAmount(item.totalOutstanding)};
    case 'dpd':
      return {
        value: formatText(item.dpd),
        valueStyle:
          item.dpd > 90
            ? {color: Colors.primaryColor, fontFamily: Fonts.GilroySemiBold}
            : undefined,
      };
    case 'principalDpd':
      return {value: formatText(item.principalDpd)};
    case 'interestDpd':
      return {value: formatText(item.interestDpd)};
    case 'bucket':
      return {value: formatText(item.bucket)};
    default:
      return {value: '-'};
  }
}
