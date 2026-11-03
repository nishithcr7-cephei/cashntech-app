import {formatKpiCurrency} from '../formatKpiCurrency';

describe('formatKpiCurrency', () => {
  it('returns empty placeholder for missing values', () => {
    expect(formatKpiCurrency(null)).toBe('-');
    expect(formatKpiCurrency(undefined)).toBe('-');
    expect(formatKpiCurrency('')).toBe('-');
    expect(formatKpiCurrency('   ')).toBe('-');
    expect(formatKpiCurrency(null, {empty: 'N/A'})).toBe('N/A');
  });

  it('formats crore tier', () => {
    expect(formatKpiCurrency(10_000_000)).toBe('₹ 1 Cr');
    expect(formatKpiCurrency(12_500_000)).toBe('₹ 1.25 Cr');
    expect(formatKpiCurrency('1,00,00,000')).toBe('₹ 1 Cr');
  });

  it('formats lakh tier below one crore', () => {
    expect(formatKpiCurrency(100_000)).toBe('₹ 1 Lakh');
    expect(formatKpiCurrency(1_500_000)).toBe('₹ 15 Lakh');
    expect(formatKpiCurrency(150_000)).toBe('₹ 1.5 Lakh');
  });

  it('formats full INR below one lakh', () => {
    expect(formatKpiCurrency(0)).toBe('₹ 0.00');
    expect(formatKpiCurrency(45_000)).toBe('₹ 45,000.00');
    expect(formatKpiCurrency(99_999.5)).toBe('₹ 99,999.50');
  });

  it('preserves negative amounts', () => {
    expect(formatKpiCurrency(-10_000_000)).toBe('-₹ 1 Cr');
    expect(formatKpiCurrency(-250_000)).toBe('-₹ 2.5 Lakh');
    expect(formatKpiCurrency(-500)).toBe('-₹ 500.00');
  });
});
