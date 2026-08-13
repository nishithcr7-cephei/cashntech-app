import moment from 'moment';

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;

function parseInvoiceDate(raw?: string | null): moment.Moment | null {
  if (!raw?.trim()) return null;
  const strict = moment(raw.trim(), DATE_FORMATS, true);
  if (strict.isValid()) return strict.startOf('day');
  const loose = moment(raw.trim());
  return loose.isValid() ? loose.startOf('day') : null;
}

export type CalculateInvoiceDueDateParams = {
  dueDateCalculatedFrom?: string | null;
  invoiceDate?: string | null;
  grnDate?: string | null;
  disbursementDate?: string | null;
  tenorDays?: string | number | null;
  /** Existing due date when base date or tenor is unavailable. */
  fallbackDueDate?: string | null;
};

/**
 * Program-level due date preview (GRN Date / Invoice Date / Disbursement Date + tenor).
 * Matches backend approve/disbursement recalculation without holiday adjustment.
 */
export function calculateInvoiceDueDate(
  params: CalculateInvoiceDueDateParams,
): string {
  const fallback = params.fallbackDueDate?.trim() || '';
  const tenor = Number(params.tenorDays);
  if (!Number.isFinite(tenor) || tenor < 0) {
    return fallback;
  }

  const calcType = (params.dueDateCalculatedFrom || '').trim();
  let baseDate: moment.Moment | null = null;

  if (calcType === 'GRN Date') {
    baseDate = parseInvoiceDate(params.grnDate);
  } else if (calcType === 'Invoice Date') {
    baseDate = parseInvoiceDate(params.invoiceDate);
  } else if (calcType === 'Disbursement Date') {
    baseDate = parseInvoiceDate(params.disbursementDate);
  } else if (params.grnDate?.trim()) {
    baseDate = parseInvoiceDate(params.grnDate);
  } else {
    baseDate = parseInvoiceDate(params.invoiceDate);
  }

  if (!baseDate) {
    return fallback;
  }

  return baseDate.clone().add(tenor, 'days').format('DD-MM-YYYY');
}

export function readDueDateCalculatedFrom(
  basicParameters?: Record<string, unknown> | null,
): string {
  if (!basicParameters) return '';
  const raw =
    basicParameters.due_date_calculated_from ??
    basicParameters.dueDateCalculatedFrom;
  return typeof raw === 'string' ? raw.trim() : '';
}
