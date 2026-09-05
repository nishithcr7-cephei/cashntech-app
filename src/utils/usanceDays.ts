import moment from 'moment';

export const INVOICE_CALENDAR_DATE_FORMATS = [
  'DD-MM-YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
] as const;

/** Parse invoice/disbursement dates from API or UI (start of local day). */
export function parseInvoiceCalendarDate(
  value?: string | null,
): moment.Moment | null {
  if (!value?.trim()) {
    return null;
  }
  const trimmed = value.trim();
  const strict = moment(trimmed, INVOICE_CALENDAR_DATE_FORMATS, true);
  if (strict.isValid()) {
    return strict.startOf('day');
  }
  const loose = moment(trimmed);
  return loose.isValid() ? loose.startOf('day') : null;
}

export type ComputeUsanceDaysParams = {
  dueDate?: string | null;
  disbursementDate?: string | null;
};

/**
 * Interest-bearing days from disbursement to invoice due date.
 * Client-agreed formula: Invoice Due Date − Disbursement Date (calendar days).
 */
export function computeUsanceDays(
  params: ComputeUsanceDaysParams,
): number | null {
  const due = parseInvoiceCalendarDate(params.dueDate ?? null);
  const disb = parseInvoiceCalendarDate(params.disbursementDate ?? null);
  if (!due || !disb) {
    return null;
  }
  return Math.max(0, due.diff(disb, 'days'));
}

export type ResolveUsanceDaysForDisplayParams = {
  /** Stored value from API/DB after disbursement. */
  usanceDaysFromApi?: number | string | null;
  dueDate?: string | null;
  disbursementDate?: string | null;
  /**
   * Optional last-resort fallback when due date is unavailable (e.g. some DF flows).
   * Not used for VF Upfront interest — prefer due − disb only.
   */
  tenor?: number | string | null;
};

/**
 * Display helper: API value → due − disb → optional tenor → "-".
 * Does not use tenor − (disb − GRN); that formula is deprecated per client agreement.
 */
export function resolveUsanceDaysForDisplay(
  params: ResolveUsanceDaysForDisplayParams,
): string {
  const fromApi = Number(params.usanceDaysFromApi);
  if (
    Number.isFinite(fromApi) &&
    params.usanceDaysFromApi != null &&
    params.usanceDaysFromApi !== ''
  ) {
    return String(Math.round(fromApi));
  }

  const computed = computeUsanceDays({
    dueDate: params.dueDate,
    disbursementDate: params.disbursementDate,
  });
  if (computed != null) {
    return String(computed);
  }

  const tenor = Number(params.tenor);
  if (Number.isFinite(tenor) && tenor >= 0 && params.tenor != null && params.tenor !== '') {
    return String(Math.round(tenor));
  }

  return '-';
}

/** Report/export rows: numeric usance for Excel (API → due − disb → tenor). */
export function resolveUsanceDaysForReportRow(params: {
  usanceDaysFromApi?: number | string | null;
  dueDate?: string | null;
  disbursementDate?: string | null;
  tenor?: number | string | null;
}): number | null {
  const fromApi = Number(params.usanceDaysFromApi);
  if (
    Number.isFinite(fromApi) &&
    params.usanceDaysFromApi != null &&
    params.usanceDaysFromApi !== ''
  ) {
    return Math.round(fromApi);
  }

  const computed = computeUsanceDays({
    dueDate: params.dueDate,
    disbursementDate: params.disbursementDate,
  });
  if (computed != null) {
    return computed;
  }

  const tenor = Number(params.tenor);
  if (Number.isFinite(tenor) && tenor >= 0 && params.tenor != null && params.tenor !== '') {
    return Math.round(tenor);
  }

  return null;
}
