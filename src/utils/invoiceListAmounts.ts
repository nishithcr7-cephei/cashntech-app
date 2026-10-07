type AmountValue = number | string | null | undefined;

/** Subset of list-row fields used by the Disbursement Requested Amount waterfall. */
export type DisbursementRequestedSource = {
  sub_total?: AmountValue;
  discount_total?: AmountValue;
  tax_total?: AmountValue;
  tds_amount?: AmountValue;
  final_total_after_tds?: AmountValue;
};

export type ListAmountOptions = {
  /** Appended after the number; Invoice List uses '/-', web-style tables use ''. */
  suffix?: string;
};

export function formatListAmount(
  value: AmountValue,
  {suffix = '/-'}: ListAmountOptions = {},
): string {
  if (value == null || value === '') {
    return '-';
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '-';
  }
  return `${n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${suffix}`;
}

/**
 * DRA from API waterfall only:
 *   Invoice Amount (= sub − discount + tax) − TDS
 * Never use final_total (that is Net Disbursement).
 * List API usually omits these → returns '-'.
 */
export function resolveDisbursementRequestedAmount(
  item: DisbursementRequestedSource,
  options?: ListAmountOptions,
): string {
  const subRaw = item.sub_total;
  const subTotal =
    subRaw != null && subRaw !== '' ? Number(subRaw) : Number.NaN;
  const discountTotal = Number(item.discount_total) || 0;
  const taxTotal = Number(item.tax_total) || 0;
  const tdsAmount = Number(item.tds_amount) || 0;

  if (Number.isFinite(subTotal) && subTotal > 0) {
    const invoiceAmount = Math.max(0, subTotal - discountTotal + taxTotal);
    return formatListAmount(Math.max(0, invoiceAmount - tdsAmount), options);
  }

  // Bulk-upload rows often store amount in final_total_after_tds with sub_total=0.
  const draRaw = item.final_total_after_tds;
  if (draRaw != null && draRaw !== '') {
    const dra = Number(draRaw);
    if (Number.isFinite(dra)) {
      return formatListAmount(dra, options);
    }
  }

  return '-';
}
