import moment from 'moment';

/** Calendar date from backend ISO (UTC) — avoids IST local shift on T18:30:00.000Z timestamps. */
export function formatApiInvoiceDate(iso?: string | null): string {
  if (!iso) return '';
  const m = moment.utc(iso);
  return m.isValid() ? m.format('DD-MM-YYYY') : '';
}
