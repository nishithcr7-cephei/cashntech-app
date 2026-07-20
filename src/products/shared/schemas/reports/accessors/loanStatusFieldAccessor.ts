import {Colors, Fonts} from '@constants/index';
import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {LoanStatusReportItem} from '@store/report/report.types';

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

export function loanStatusFieldAccessor(
  item: LoanStatusReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'programName':
      return {value: formatText(item.programName)};
    case 'programTypeName':
      return {value: formatText(item.programTypeName)};
    case 'anchorName':
      return {value: formatText(item.anchorName)};
    case 'anchorPan':
      return {value: formatText(item.anchorPan)};
    case 'loanAccNo':
      return {value: formatText(item.loanAccNo)};
    case 'borrowerName':
      return {value: formatText(item.borrowerName)};
    case 'borrowerPan':
      return {value: formatText(item.borrowerPan)};
    case 'borrowerConstitution':
      return {value: formatText(item.borrowerConstitution)};
    case 'gstin':
      return {value: formatText(item.gstin)};
    case 'anchorCity':
      return {value: formatText(item.anchorCity)};
    case 'anchorState':
      return {value: formatText(item.anchorState)};
    case 'anchorPincode':
      return {value: formatText(item.anchorPincode)};
    case 'schemetype':
      return {value: formatText(item.schemetype)};
    case 'loanSanctionDate':
      return {value: formatText(item.loanSanctionDate)};
    case 'loanEndDate':
      return {value: formatText(item.loanEndDate)};
    case 'loanlivedate':
      return {value: formatText(item.loanlivedate)};
    case 'sanctionedLimit':
      return {value: formatAmount(item.sanctionedLimit)};
    case 'availableLimit':
      return {value: formatAmount(item.availableLimit)};
    case 'roi':
      return {value: formatText(item.roi)};
    case 'excessAmount':
      return {value: formatAmount(item.excessAmount)};
    case 'rmName':
      return {value: formatText(item.rmName)};
    case 'borrowerCifNo':
      return {value: formatText(item.borrowerCifNo)};
    case 'status':
      return {
        value: formatText(item.status),
        valueStyle:
          item.status === 'Active'
            ? {color: Colors.green, fontFamily: Fonts.GilroySemiBold}
            : undefined,
      };
    case 'loanTenure':
      return {value: formatLoanTenure(item.loanTenure)};
    case 'generatedDate':
      return {value: formatText(item.generatedDate)};
    case 'eodDate':
      return {value: formatText(item.eodDate)};
    default:
      return {value: '-'};
  }
}
