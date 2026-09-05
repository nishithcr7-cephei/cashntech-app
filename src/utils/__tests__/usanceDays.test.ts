import {
  computeUsanceDays,
  parseInvoiceCalendarDate,
  resolveUsanceDaysForDisplay,
  resolveUsanceDaysForReportRow,
} from '../usanceDays';

describe('usanceDays — client formula (Due − Disbursement)', () => {
  describe('computeUsanceDays', () => {
    it('returns 58 for ASE079-style dates (11-Sep-2026 minus 15-Jul-2026)', () => {
      expect(
        computeUsanceDays({
          dueDate: '11-09-2026',
          disbursementDate: '15-07-2026',
        }),
      ).toBe(58);
    });

    it('accepts DD/MM/YYYY and YYYY-MM-DD formats', () => {
      expect(
        computeUsanceDays({
          dueDate: '11/09/2026',
          disbursementDate: '2026-07-15',
        }),
      ).toBe(58);
    });

    it('returns 0 when due and disbursement are the same day', () => {
      expect(
        computeUsanceDays({
          dueDate: '15-07-2026',
          disbursementDate: '15-07-2026',
        }),
      ).toBe(0);
    });

    it('returns null when due date is missing', () => {
      expect(
        computeUsanceDays({
          dueDate: null,
          disbursementDate: '15-07-2026',
        }),
      ).toBeNull();
    });

    it('returns null when disbursement date is missing', () => {
      expect(
        computeUsanceDays({
          dueDate: '11-09-2026',
          disbursementDate: '',
        }),
      ).toBeNull();
    });

    it('does not use tenor − (disb − GRN) — client example is 58 not 59', () => {
      const clientUsance = computeUsanceDays({
        dueDate: '11-09-2026',
        disbursementDate: '15-07-2026',
      });
      const tenor = 60;
      const disb = parseInvoiceCalendarDate('15-07-2026');
      const grn = parseInvoiceCalendarDate('14-07-2026');
      const legacyUsance =
        disb && grn ? tenor - disb.diff(grn, 'days') : null;

      expect(clientUsance).toBe(58);
      expect(legacyUsance).toBe(59);
      expect(clientUsance).not.toBe(legacyUsance);
    });
  });

  describe('resolveUsanceDaysForDisplay', () => {
    it('prefers API usance_days when present', () => {
      expect(
        resolveUsanceDaysForDisplay({
          usanceDaysFromApi: 58,
          dueDate: '11-09-2026',
          disbursementDate: '01-07-2026',
        }),
      ).toBe('58');
    });

    it('computes due − disb when API value is absent', () => {
      expect(
        resolveUsanceDaysForDisplay({
          dueDate: '11-09-2026',
          disbursementDate: '15-07-2026',
        }),
      ).toBe('58');
    });

    it('falls back to tenor only when dates cannot be parsed', () => {
      expect(
        resolveUsanceDaysForDisplay({
          dueDate: '',
          disbursementDate: '',
          tenor: 60,
        }),
      ).toBe('60');
    });

    it('returns "-" when nothing is available', () => {
      expect(resolveUsanceDaysForDisplay({})).toBe('-');
    });
  });

  describe('resolveUsanceDaysForReportRow', () => {
    it('returns numeric 58 from due and disbursement dates', () => {
      expect(
        resolveUsanceDaysForReportRow({
          dueDate: '2026-09-11',
          disbursementDate: '2026-07-15',
        }),
      ).toBe(58);
    });

    it('prefers API usance_days over computed value', () => {
      expect(
        resolveUsanceDaysForReportRow({
          usanceDaysFromApi: 58,
          dueDate: '2026-09-11',
          disbursementDate: '2026-07-01',
        }),
      ).toBe(58);
    });
  });
});
