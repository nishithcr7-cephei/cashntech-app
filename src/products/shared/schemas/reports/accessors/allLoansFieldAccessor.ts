import {Colors, Fonts} from '@constants/index';
import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {AllLoanReportItem} from '@store/report/report.types';

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

export function allLoansFieldAccessor(
  item: AllLoanReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'lmsId':
      return {value: formatText(item.lmsId)};
    case 'loanAccountNo':
      return {value: formatText(item.loanAccountNo)};
    case 'odAccountNo':
      return {value: formatText(item.odAccountNo)};
    case 'productType':
      return {value: formatText(item.productType)};
    case 'productCode':
      return {value: formatText(item.productCode)};
    case 'anchorName':
      return {value: formatText(item.anchorName)};
    case 'vendorDealerName':
      return {value: formatText(item.vendorDealerName)};
    case 'bankName':
      return {value: formatText(item.bankName)};
    case 'sanctionAmount':
      return {value: formatAmount(item.sanctionAmount)};
    case 'disbursedAmount':
      return {value: formatAmount(item.disbursedAmount)};
    case 'outstandingAmount':
      return {value: formatAmount(item.outstandingAmount)};
    case 'loanStatus':
      return {
        value: formatText(item.loanStatus),
        valueStyle:
          item.loanStatus === 'Closed'
            ? {color: Colors.green, fontFamily: Fonts.GilroySemiBold}
            : undefined,
      };
    case 'disbursementDate':
      return {value: formatText(item.disbursementDate)};
    case 'dueDate':
      return {value: formatText(item.dueDate)};
    case 'tenor':
      return {value: formatText(item.tenor)};
    case 'roi':
      return {value: formatText(item.roi)};
    case 'repaidAmount':
      return {value: formatAmount(item.repaidAmount)};
    case 'principalOutstanding':
      return {value: formatAmount(item.principalOutstanding)};
    case 'interestOutstanding':
      return {value: formatAmount(item.interestOutstanding)};
    case 'chargesOutstanding':
      return {value: formatAmount(item.chargesOutstanding)};
    case 'dpd':
      return {value: formatText(item.dpd)};
    case 'npaStatus':
      return {value: formatText(item.npaStatus)};
    case 'lastRepaymentDate':
      return {value: formatText(item.lastRepaymentDate)};
    case 'lastRepaymentAmount':
      return {value: formatAmount(item.lastRepaymentAmount)};
    case 'overdueAmount':
      return {value: formatAmount(item.overdueAmount)};
    case 'settlementStatus':
      return {value: formatText(item.settlementStatus)};
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
