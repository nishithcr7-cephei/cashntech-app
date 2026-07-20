import {Colors, Fonts} from '@constants/index';
import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {DisbursementReportItem} from '@store/report/report.types';

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

export function disbursementFieldAccessor(
  item: DisbursementReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'invoiceNumber':
      return {value: formatText(item.invoiceNumber)};
    case 'anchorName':
      return {value: formatText(item.anchorName)};
    case 'anchorPan':
      return {value: formatText(item.anchorPan)};
    case 'borrowerName':
      return {value: formatText(item.borrowerName)};
    case 'borrowerPan':
      return {value: formatText(item.borrowerPan)};
    case 'masterProgramName':
      return {value: formatText(item.masterProgramName)};
    case 'programName':
      return {value: formatText(item.programName)};
    case 'programTypeName':
      return {value: formatText(item.programTypeName)};
    case 'loanAccountNumber':
      return {value: formatText(item.loanAccountNumber)};
    case 'losId':
      return {value: formatText(item.losId)};
    case 'tranchNumber':
      return {value: formatText(item.tranchNumber)};
    case 'finnone_bill_no':
      return {value: formatText(item.finnone_bill_no)};
    case 'invoiceDate':
      return {value: formatText(item.invoiceDate)};
    case 'disbursementDate':
      return {value: formatText(item.disbursementDate)};
    case 'maturityDate':
      return {value: formatText(item.maturityDate)};
    case 'invoiceValue':
      return {value: formatAmount(item.invoiceValue)};
    case 'loanValue':
      return {value: formatAmount(item.loanValue)};
    case 'disbursementAmount':
      return {value: formatAmount(item.disbursementAmount)};
    case 'roi':
      return {value: formatText(item.roi)};
    case 'margin':
      return {value: formatAmount(item.margin)};
    case 'bankName':
      return {value: formatText(item.bankName)};
    case 'bankAccountNumber':
      return {value: formatText(item.bankAccountNumber)};
    case 'ifscCode':
      return {value: formatText(item.ifscCode)};
    case 'status':
      return {
        value: formatText(item.status),
        valueStyle:
          item.status === 'Disbursed'
            ? {color: Colors.green, fontFamily: Fonts.GilroySemiBold}
            : undefined,
      };
    case 'utrNo':
      return {value: formatText(item.utrNo)};
    case 'message':
      return {value: formatText(item.message)};
    case 'generatedDate':
      return {value: formatText(item.generatedDate)};
    default:
      return {value: '-'};
  }
}
