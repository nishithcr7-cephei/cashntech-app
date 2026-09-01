import moment from 'moment';

export const GRN_DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;

function parseMomentDate(raw?: string | null): moment.Moment | null {
  if (!raw?.trim()) return null;
  const parsed = moment(raw.trim(), GRN_DATE_FORMATS, true);
  return parsed.isValid() ? parsed.startOf('day') : null;
}

export function parseGrnDisplay(raw?: string | null): string {
  if (!raw?.trim()) return '';
  const m = moment(raw.trim(), GRN_DATE_FORMATS, true);
  return m.isValid() ? m.format('DD-MM-YYYY') : raw.trim();
}

function getGrnMinimumDate(invoiceDateRaw?: string | null): Date {
  const invoiceDate = parseMomentDate(invoiceDateRaw);
  if (invoiceDate) {
    return invoiceDate.toDate();
  }
  return moment().startOf('day').toDate();
}

function getGrnMaximumDate(
  invoiceDateRaw?: string | null,
  tenorDaysRaw?: string | number | null,
  invoiceDueDateRaw?: string | null,
): Date {
  const today = moment().startOf('day');
  let max = today.clone();

  const dueDate = parseMomentDate(invoiceDueDateRaw);
  if (dueDate?.isBefore(max, 'day')) {
    max = dueDate;
  } else if (!dueDate) {
    const invoiceDate = parseMomentDate(invoiceDateRaw);
    const tenorDays = Number(tenorDaysRaw);
    if (invoiceDate && Number.isFinite(tenorDays) && tenorDays > 0) {
      const computedDue = invoiceDate.clone().add(tenorDays, 'days');
      if (computedDue.isBefore(max, 'day')) {
        max = computedDue;
      }
    }
  }

  return max.toDate();
}

export function getGrnPickerBounds(
  invoiceDateRaw?: string | null,
  tenorDaysRaw?: string | number | null,
  invoiceDueDateRaw?: string | null,
): {minimumDate: Date; maximumDate: Date} {
  const minimumDate = getGrnMinimumDate(invoiceDateRaw);
  const maximumDate = getGrnMaximumDate(
    invoiceDateRaw,
    tenorDaysRaw,
    invoiceDueDateRaw,
  );
  if (minimumDate.getTime() > maximumDate.getTime()) {
    return {minimumDate: maximumDate, maximumDate};
  }
  return {minimumDate, maximumDate};
}

export function getGrnDateValidationError(
  grnDisplay: string,
  invoiceDateRaw?: string | null,
  tenorDaysRaw?: string | number | null,
  invoiceDueDateRaw?: string | null,
): string | null {
  const parsed = moment(grnDisplay.trim(), GRN_DATE_FORMATS, true);
  if (!parsed.isValid()) {
    return 'Enter a valid GRN date (DD-MM-YYYY)';
  }
  const grn = parsed.startOf('day');

  const invoiceDate = parseMomentDate(invoiceDateRaw);
  if (invoiceDate && grn.isBefore(invoiceDate, 'day')) {
    return `GRN date cannot be before invoice date (${invoiceDate.format('DD-MM-YYYY')})`;
  }

  const max = moment(
    getGrnMaximumDate(invoiceDateRaw, tenorDaysRaw, invoiceDueDateRaw),
  ).startOf('day');
  if (grn.isAfter(max, 'day')) {
    const today = moment().startOf('day');
    if (max.isSame(today, 'day')) {
      return 'GRN date cannot be after current date';
    }
    return `GRN date cannot be after invoice due date (${max.format('DD-MM-YYYY')})`;
  }
  return null;
}
