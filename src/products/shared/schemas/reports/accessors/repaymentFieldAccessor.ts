import {Colors, Fonts} from '@constants/index';
import type {ReportFieldValue} from '@products/shared/schemas/reports/reportFieldBuilder';
import type {RepaymentReportItem} from '@store/report/report.types';

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

export function repaymentFieldAccessor(
  item: RepaymentReportItem,
  key: string,
): ReportFieldValue {
  switch (key) {
    case 'lms_id':
      return {value: formatText(item.lms_id)};
    case 'loan_ref_no':
      return {value: formatText(item.loan_ref_no)};
    case 'invoice_no':
      return {value: formatText(item.invoice_no)};
    case 'bank_name':
      return {value: formatText(item.bank_name)};
    case 'product_name':
      return {value: formatText(item.product_name)};
    case 'program_name':
      return {value: formatText(item.program_name)};
    case 'anchor_name':
      return {value: formatText(item.anchor_name)};
    case 'dealer_name':
      return {value: formatText(item.dealer_name)};
    case 'payment_date':
      return {value: formatText(item.payment_date)};
    case 'invoice_amount':
      return {value: formatAmount(item.invoice_amount)};
    case 'disbursed_amount':
      return {value: formatAmount(item.disbursed_amount)};
    case 'due_amount':
      return {value: formatAmount(item.due_amount)};
    case 'paid_amount':
      return {value: formatAmount(item.paid_amount)};
    case 'principal_settled':
      return {value: formatAmount(item.principal_settled)};
    case 'interest_settled':
      return {value: formatAmount(item.interest_settled)};
    case 'penal_interest_settled':
      return {value: formatAmount(item.penal_interest_settled)};
    case 'settlement_priority':
      return {value: formatText(item.settlement_priority)};
    case 'total_outstanding_amount':
      return {value: formatAmount(item.total_outstanding_amount)};
    case 'outstanding_interest':
      return {value: formatAmount(item.outstanding_interest)};
    case 'principal_amount':
      return {value: formatAmount(item.principal_amount)};
    case 'interest_amount':
      return {value: formatAmount(item.interest_amount)};
    case 'penal_amount':
      return {value: formatAmount(item.penal_amount)};
    case 'principal_os':
      return {value: formatAmount(item.principal_os)};
    case 'processed_by_user':
      return {value: formatText(item.processed_by_user)};
    case 'processed_on_date':
      return {value: formatText(item.processed_on_date)};
    case 'created_on':
      return {value: formatText(item.created_on)};
    case 'transaction_date':
      return {value: formatText(item.transaction_date)};
    case 'status':
      return {
        value: formatText(item.status),
        valueStyle:
          item.status === 'Closed'
            ? {color: Colors.green, fontFamily: Fonts.GilroySemiBold}
            : undefined,
      };
    case 'utr_no':
      return {value: formatText(item.utr_no)};
    case 'excess_amount':
      return {value: formatAmount(item.excess_amount)};
    default:
      return {value: '-'};
  }
}
