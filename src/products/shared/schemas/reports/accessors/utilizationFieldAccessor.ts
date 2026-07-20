import {Colors, Fonts} from '@constants/index';
import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {UtilizationReportItem} from '@store/report/report.types';

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

const formatLoanTenure = (tenure: number): string => {
  if (!tenure || Number.isNaN(tenure)) {
    return '-';
  }
  return `${tenure} Months`;
};

export function utilizationFieldAccessor(
  item: UtilizationReportItem,
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
    case 'lan':
      return {value: formatText(item.lan)};
    case 'programName':
      return {value: formatText(item.programName)};
    case 'programTypeName':
      return {value: formatText(item.programTypeName)};
    case 'masterProgramName':
      return {value: formatText(item.masterProgramName)};
    case 'losid':
      return {value: formatText(item.losid)};
    case 'schemetype':
      return {value: formatText(item.schemetype)};
    case 'loanaccountroi':
      return {value: formatText(item.loanaccountroi)};
    case 'loanTenure':
      return {value: formatLoanTenure(item.loanTenure)};
    case 'limitCreationDate':
      return {value: formatText(item.limitCreationDate)};
    case 'limitExpiryDate':
      return {value: formatText(item.limitExpiryDate)};
    case 'sanctionedLimit':
      return {value: formatAmount(item.sanctionedLimit)};
    case 'totalUtilizedLimit':
      return {value: formatAmount(item.totalUtilizedLimit)};
    case 'netAvailableLimit':
      return {value: formatAmount(item.netAvailableLimit)};
    case 'totalPrincipalOS':
      return {value: formatAmount(item.totalPrincipalOS)};
    case 'principalDue':
      return {value: formatAmount(item.principalDue)};
    case 'interestOS':
      return {value: formatAmount(item.interestOS)};
    case 'latePaymentDue':
      return {value: formatAmount(item.latePaymentDue)};
    case 'totalChargesDue':
      return {value: formatAmount(item.totalChargesDue)};
    case 'totalAmountDue':
      return {value: formatAmount(item.totalAmountDue)};
    case 'dpd':
      return {
        value: formatText(item.dpd),
        valueStyle:
          item.dpd > 90
            ? {color: Colors.primaryColor, fontFamily: Fonts.GilroySemiBold}
            : undefined,
      };
    case 'generationDate':
      return {value: formatText(item.generationDate)};
    case 'eodDate':
      return {value: formatText(item.eodDate)};
    default:
      return {value: '-'};
  }
}
