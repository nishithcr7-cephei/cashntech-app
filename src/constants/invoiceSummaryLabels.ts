/** Invoice summary row labels — match web Create / Preview (margin + financed). */
export const INVOICE_SUMMARY_LABELS = {
  invoiceAmount: 'Basic Amount',
  discount: 'Discount',
  taxAmount: 'GST / Tax Amount',
  grossInvoiceValue: 'Invoice Amount',
  tdsDeduction: 'TDS Deduction',
  disbursementRequestedAmount: 'Disbursement Requested Amount',
  /** Pass percent, e.g. formatMarginDeductionLabel(5) → "Margin Deduction (5%)". */
  marginDeduction: 'Margin Deduction',
  financedAmount: 'Financed Amount',
  advanceInterestDeduction: 'Advance Interest Deduction',
  netDisbursementAmount: 'Net Disbursement Amount',
} as const;

export function formatMarginDeductionLabel(marginPercent: number): string {
  const n = Number.isFinite(marginPercent) ? marginPercent : 0;
  const pretty = Number.isInteger(n) ? String(n) : String(n);
  return `${INVOICE_SUMMARY_LABELS.marginDeduction} (${pretty}%)`;
}
