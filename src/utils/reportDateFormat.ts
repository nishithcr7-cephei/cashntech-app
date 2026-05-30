import moment from 'moment';

const PARSE_FORMATS = [
  moment.ISO_8601,
  'DD/MM/YYYY',
  'D/M/YYYY',
  'DD-MM-YYYY',
  'D-M-YYYY',
  'YYYY-MM-DD',
  'DD MMM YYYY',
  'DD/MMM/YYYY',
  'D/MMM/YYYY',
] as const;

/** Report list/export display: e.g. 29/May/2026 */
export function formatReportDisplayDate(
  val: string | number | Date | undefined | null,
): string {
  if (val == null || val === '' || val === '-') {
    return '-';
  }

  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? '-' : moment(val).format('DD/MMM/YYYY');
  }

  const s = String(val).trim();
  if (!s || s === '-') {
    return '-';
  }

  const parsed = moment(s, [...PARSE_FORMATS], true);
  if (parsed.isValid()) {
    return parsed.format('DD/MMM/YYYY');
  }

  const fallback = Date.parse(s);
  if (!Number.isNaN(fallback)) {
    return moment(fallback).format('DD/MMM/YYYY');
  }

  return s;
}
