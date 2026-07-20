import {Colors, Fonts} from '@constants/index';
import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {AllProductOutstandingReportItem} from '@store/report/report.types';

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

export function allProductOutstandingFieldAccessor(
  item: AllProductOutstandingReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'lmsId':
      return {value: formatText(item.lmsId)};
    case 'loanAccountNo':
      return {value: formatText(item.loanAccountNo)};
    case 'productType':
      return {value: formatText(item.productType)};
    case 'productCode':
      return {value: formatText(item.productCode)};
    case 'programName':
      return {value: formatText(item.programName)};
    case 'facilityType':
      return {value: formatText(item.facilityType)};
    case 'anchorName':
      return {value: formatText(item.anchorName)};
    case 'counterpartyType':
      return {value: formatText(item.counterpartyType)};
    case 'counterpartyName':
      return {value: formatText(item.counterpartyName)};
    case 'buyerName':
      return {value: formatText(item.buyerName)};
    case 'sellerName':
      return {value: formatText(item.sellerName)};
    case 'invoiceNo':
      return {value: formatText(item.invoiceNo)};
    case 'invoiceDate':
      return {value: formatText(item.invoiceDate)};
    case 'disbursementDate':
      return {value: formatText(item.disbursementDate)};
    case 'dueDate':
      return {value: formatText(item.dueDate)};
    case 'bankName':
      return {value: formatText(item.bankName)};
    case 'sanctionAmount':
      return {value: formatAmount(item.sanctionAmount)};
    case 'invoiceAmount':
      return {value: formatAmount(item.invoiceAmount)};
    case 'disbursedAmount':
      return {value: formatAmount(item.disbursedAmount)};
    case 'principalOutstanding':
      return {value: formatAmount(item.principalOutstanding)};
    case 'interestOutstanding':
      return {value: formatAmount(item.interestOutstanding)};
    case 'chargesOutstanding':
      return {value: formatAmount(item.chargesOutstanding)};
    case 'totalOutstandingAmount':
      return {value: formatAmount(item.totalOutstandingAmount)};
    case 'overdueAmount':
      return {value: formatAmount(item.overdueAmount)};
    case 'dpd':
      return {value: formatText(item.dpd)};
    case 'npaStatus':
      return {value: formatText(item.npaStatus)};
    case 'loanStatus':
      return {
        value: formatText(item.loanStatus),
        valueStyle:
          item.loanStatus === 'Closed'
            ? {color: Colors.green, fontFamily: Fonts.GilroySemiBold}
            : undefined,
      };
    case 'settlementStatus':
      return {value: formatText(item.settlementStatus)};
    case 'settlementPriority':
      return {value: formatText(item.settlementPriority)};
    case 'lastRepaymentDate':
      return {value: formatText(item.lastRepaymentDate)};
    case 'lastRepaymentAmount':
      return {value: formatAmount(item.lastRepaymentAmount)};
    case 'odAccountNo':
      return {value: formatText(item.odAccountNo)};
    case 'branchName':
      return {value: formatText(item.branchName)};
    case 'createdBy':
      return {value: formatText(item.createdBy)};
    case 'createdDate':
      return {value: formatText(item.createdDate)};
    default:
      return {value: '-'};
  }
}
