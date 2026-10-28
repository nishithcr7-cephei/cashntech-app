import {
  resolveDisbursementUsanceDaysDisplay,
  resolveVfDisbursementModalAmounts,
  computeDisbursementPreviewAmounts,
  computeVendorFinanceAdvanceInterest,
  productAllowsUpfrontInterest,
} from '../invoiceTotals';

describe('invoiceTotals — usance-based VF disbursement', () => {
  const preview = {
    sub_total: 2033434,
    discount_total: 0,
    tax_total: 101671.7,
    tds_amount: 2033.43,
    eligibility_percent: 100,
    transaction_interest_rate: 11.5,
    invoice_due_date: '2026-09-11',
    tenor: 60,
  };

  it('resolveDisbursementUsanceDaysDisplay uses due − disb (58)', () => {
    expect(
      resolveDisbursementUsanceDaysDisplay(
        null,
        '11-09-2026',
        '15-07-2026',
        60,
      ),
    ).toBe('58');
  });

  it('resolveVfDisbursementModalAmounts uses usance not full tenor', () => {
    const withUsance = resolveVfDisbursementModalAmounts(preview, {
      disbursementDate: '15-07-2026',
    });
    const withTenorOnly = resolveVfDisbursementModalAmounts(preview, {
      disbursementDate: '14-07-2026',
    });

    expect(withUsance.usanceDays).toBe(58);
    expect(withTenorOnly.usanceDays).toBe(59);
    expect(withUsance.advanceInterest).toBeLessThan(withTenorOnly.advanceInterest);
  });

  it('computeDisbursementPreviewAmounts returns usance 58 for VF Upfront bulk row', () => {
    const amounts = computeDisbursementPreviewAmounts(
      {
        ...preview,
        interest_charge_type: 'Upfront',
        final_total: 2133072,
        tds_amount: 2033.43,
        eligibility_percent: 100,
      },
      {
        disbursementDate: '15-07-2026',
        isVendorFinance: true,
        isVfUpfront: true,
      },
    );
    expect(amounts.usanceDays).toBe(58);
    expect(amounts.advanceInterest).toBeGreaterThan(0);
    expect(amounts.disbursedAmount).toBeGreaterThan(0);
    expect(amounts.disbursedAmount).toBeLessThan(2133072);
  });

  it('invoice detail fallback: DB null + due/disbursement dates → 58', () => {
    expect(
      resolveDisbursementUsanceDaysDisplay(
        null,
        '2026-09-11',
        '2026-07-15',
        60,
      ),
    ).toBe('58');
  });

  it('invoice detail: stored usance_days takes priority over computed', () => {
    expect(
      resolveDisbursementUsanceDaysDisplay(58, '2026-09-11', '2026-07-01', 60),
    ).toBe('58');
  });

  it('computeDisbursementPreviewAmounts supports SID productType + Upfront', () => {
    const amounts = computeDisbursementPreviewAmounts(
      {
        ...preview,
        interest_charge_type: 'Upfront',
        final_total: 2133072,
      },
      {
        disbursementDate: '15-07-2026',
        productType: 'sales_invoice_discounting',
      },
    );
    expect(productAllowsUpfrontInterest('sales_invoice_discounting')).toBe(
      true,
    );
    expect(amounts.usanceDays).toBe(58);
    expect(amounts.advanceInterest).toBeGreaterThan(0);
  });
});

describe('invoiceTotals — Advance Interest on Financed Amount (F)', () => {
  it('AI uses financedAmount when provided (VF Upfront)', () => {
    const onDra = computeVendorFinanceAdvanceInterest({
      isVendorFinance: true,
      interestChargeType: 'upfront',
      subTotal: 100000,
      discountTotal: 0,
      taxTotal: 0,
      tdsAmount: 0,
      roiPercent: 10,
      tenorDays: 365,
    });
    const onF = computeVendorFinanceAdvanceInterest({
      isVendorFinance: true,
      interestChargeType: 'upfront',
      financedAmount: 80000,
      subTotal: 100000,
      discountTotal: 0,
      taxTotal: 0,
      tdsAmount: 0,
      roiPercent: 10,
      tenorDays: 365,
    });
    expect(onDra.advanceInterest).toBe(10000);
    expect(onF.advanceInterest).toBe(8000);
  });
});
