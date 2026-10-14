import {resolveReportColumns} from '@products/shared/schemas/reports/reportColumnResolver';
import {PRODUCT_CODES} from '@store/product/product.types';

const labelOf = (
  columns: {key: string; label: string; exportHeader: string}[],
  key: string,
) => columns.find(column => column.key === key);

describe('resolveReportColumns — SID branch', () => {
  it('uses Debtor labels where PID uses Vendor', () => {
    const pid = resolveReportColumns(
      'loanStatus',
      PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
    );
    const sid = resolveReportColumns(
      'loanStatus',
      PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
    );

    expect(labelOf(pid.screenColumns, 'borrowerName')?.label).toBe('Vendor Name');
    expect(labelOf(sid.screenColumns, 'borrowerName')?.label).toBe('Debtor Name');
    expect(labelOf(sid.exportColumns, 'borrowerCifNo')?.exportHeader).toBe(
      'Debtor CIF No.',
    );
  });

  it('keeps the same column set as PID (guarded columns hidden)', () => {
    const pid = resolveReportColumns(
      'loanStatus',
      PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
    );
    const sid = resolveReportColumns(
      'loanStatus',
      PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
    );

    expect(sid.screenColumns.map(c => c.key)).toEqual(
      pid.screenColumns.map(c => c.key),
    );
    expect(sid.screenColumns.some(c => c.key === 'loanAccNo')).toBe(false);
  });

  it('leaves DF / VF / PID labels unchanged', () => {
    const label = (code: string) =>
      labelOf(
        resolveReportColumns('dailyAccrual', code).screenColumns,
        'customer',
      )?.label;

    expect(label(PRODUCT_CODES.SALES_INVOICE_DISCOUNTING)).toBe('Debtor');
    expect(label(PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING)).toBe('Vendor');
    expect(label(PRODUCT_CODES.VENDOR_FINANCE)).toBe('Vendor');
    expect(label(PRODUCT_CODES.DEALER_FINANCE)).toBe('Customer');
  });
});
