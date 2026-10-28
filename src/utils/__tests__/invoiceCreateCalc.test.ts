import {
  computeCreateInvoiceSummaryFromFields,
  computeCreateInvoiceTdsBase,
  computeCreateInvoiceTotals,
  computeHeaderGstTotal,
  computeInvoiceAmountForLimitCheck,
  getOcrPartyLabels,
  isStandaloneProductType,
  isTaxEligibleForTds,
  itemsHaveSelectedTax,
  shouldWarnVfZeroAdvanceInterest,
} from '@utils/invoiceCreateCalc';
import {
  computeInvoiceNetTotal,
  computeVendorFinanceAdvanceInterest,
  productAllowsUpfrontInterest,
} from '@utils/invoiceTotals';

const sampleItemWithTax = {
  itemName: 'Item A',
  quantity: '10',
  unit: 'PCS',
  pricePerQuantity: '10000',
  total: '100000',
  discountAmount: '5000',
  taxType: 'GST',
  taxPercentage: '18',
  taxAmount: '18000',
  taxes: [{taxType: 'GST', taxPercentage: '18', taxAmount: '18000'}],
};

const sampleItemNoTax = {
  itemName: 'Item B',
  quantity: '1',
  unit: 'PCS',
  pricePerQuantity: '50000',
  total: '50000',
  taxType: '',
  taxPercentage: '',
  taxAmount: '',
  taxes: [{taxType: '', taxPercentage: '', taxAmount: ''}],
};

describe('invoiceCreateCalc — 4-flow regression (Sprint 0)', () => {
  describe('DF manual / DF OCR — TDS base includes GST', () => {
    it('TDS base = Basic − Discount + GST', () => {
      const base = computeCreateInvoiceTdsBase(100000, 5000, 18000, false);
      expect(base).toBe(113000);
    });

    it('totals: item tax triggers TDS on GST-inclusive base', () => {
      const totals = computeCreateInvoiceTotals({
        items: [sampleItemWithTax],
        fieldsTax: {cgst: '', sgst: '', taxTotal: ''},
        productType: 'dealer_finance',
        isVendorFinanceUpfront: false,
        tdsRatePercent: 2,
        tdsThreshold: null,
        ytdInvoiceTotal: 0,
      });
      expect(totals.subTotal).toBe(100000);
      expect(totals.discountTotal).toBe(5000);
      expect(totals.taxTotal).toBe(18000);
      expect(totals.tds).toBe(2260);
    });

    it('no Advance Interest row (chargeApplies false)', () => {
      const ai = computeVendorFinanceAdvanceInterest({
        isVendorFinance: false,
        interestChargeType: 'upfront',
        subTotal: 100000,
        discountTotal: 5000,
        taxTotal: 18000,
        tdsAmount: 2260,
        roiPercent: 12,
        tenorDays: 90,
      });
      expect(ai.chargeApplies).toBe(false);
      expect(ai.advanceInterest).toBe(0);
    });

    it('Net = Invoice Amount − TDS (no AI)', () => {
      const net = computeInvoiceNetTotal(100000, 5000, 18000, 2260, 0);
      expect(net).toBe(110740);
    });
  });

  describe('VF manual / VF OCR — Upfront TDS + Advance Interest', () => {
    it('TDS base excludes GST for VF Upfront', () => {
      const base = computeCreateInvoiceTdsBase(100000, 5000, 18000, true);
      expect(base).toBe(95000);
    });

    it('totals: TDS after threshold exceeded (VF Upfront)', () => {
      const totals = computeCreateInvoiceTotals({
        items: [sampleItemWithTax],
        fieldsTax: {cgst: '', sgst: '', taxTotal: ''},
        productType: 'vendor_finance',
        isVendorFinanceUpfront: true,
        tdsRatePercent: 2,
        tdsThreshold: 50000,
        ytdInvoiceTotal: 10000,
      });
      expect(totals.tds).toBe(1900);
    });

    it('Advance Interest on (Invoice Amount − TDS)', () => {
      const ai = computeVendorFinanceAdvanceInterest({
        isVendorFinance: true,
        interestChargeType: 'upfront',
        subTotal: 100000,
        discountTotal: 5000,
        taxTotal: 18000,
        tdsAmount: 1900,
        roiPercent: 12,
        tenorDays: 90,
      });
      expect(ai.chargeApplies).toBe(true);
      // (113000 − 1900) × 12% × (90/365)
      expect(ai.advanceInterest).toBe(3287.34);
    });

    it('Net = Invoice Amount − TDS − AI', () => {
      const net = computeInvoiceNetTotal(100000, 5000, 18000, 1900, 3287.34);
      expect(net).toBe(107812.66);
    });
  });

  describe('VF non-Upfront — no Advance Interest', () => {
    it('chargeApplies false when interest type is not upfront', () => {
      const ai = computeVendorFinanceAdvanceInterest({
        isVendorFinance: true,
        interestChargeType: 'rear_end',
        subTotal: 100000,
        discountTotal: 0,
        taxTotal: 18000,
        tdsAmount: 1000,
        roiPercent: 12,
        tenorDays: 90,
      });
      expect(ai.chargeApplies).toBe(false);
    });
  });

  describe('SID Upfront — Advance Interest on Financed Amount (F)', () => {
    it('productAllowsUpfrontInterest includes SID and VF only', () => {
      expect(productAllowsUpfrontInterest('sales_invoice_discounting')).toBe(
        true,
      );
      expect(productAllowsUpfrontInterest('vendor_finance')).toBe(true);
      expect(productAllowsUpfrontInterest('dealer_finance')).toBe(false);
      expect(
        productAllowsUpfrontInterest('purchase_invoice_discounting'),
      ).toBe(false);
    });

    it('SID + Upfront applies; AI principal = F when financedAmount set', () => {
      const dra = 113000 - 1900; // Invoice − TDS
      const financed = 105645; // e.g. 5% margin off DRA
      const ai = computeVendorFinanceAdvanceInterest({
        productType: 'sales_invoice_discounting',
        interestChargeType: 'Upfront',
        financedAmount: financed,
        subTotal: 100000,
        discountTotal: 5000,
        taxTotal: 18000,
        tdsAmount: 1900,
        roiPercent: 12,
        tenorDays: 90,
      });
      expect(ai.chargeApplies).toBe(true);
      // F × 12% × (90/365)
      expect(ai.advanceInterest).toBe(
        Number(((financed * 0.12 * 90) / 365).toFixed(2)),
      );
      expect(ai.advanceInterest).toBeLessThan(
        Number(((dra * 0.12 * 90) / 365).toFixed(2)),
      );
    });

    it('SID without Upfront — chargeApplies false', () => {
      const ai = computeVendorFinanceAdvanceInterest({
        allowsUpfrontInterest: true,
        productType: 'sales_invoice_discounting',
        interestChargeType: 'rear_end',
        financedAmount: 100000,
        subTotal: 100000,
        discountTotal: 0,
        taxTotal: 0,
        tdsAmount: 0,
        roiPercent: 12,
        tenorDays: 90,
      });
      expect(ai.chargeApplies).toBe(false);
      expect(ai.advanceInterest).toBe(0);
    });
  });

  describe('TDS eligibility — Sprint 2 VF header GST', () => {
    it('VF Upfront: header GST alone enables TDS when item tax absent', () => {
      const headerGst = computeHeaderGstTotal({
        cgst: '9000',
        sgst: '9000',
        taxTotal: '',
      });
      expect(headerGst).toBe(18000);
      expect(
        isTaxEligibleForTds({
          hasSelectedTax: false,
          headerGstTotal: headerGst,
          productType: 'vendor_finance',
          isVendorFinanceUpfront: true,
        }),
      ).toBe(true);
    });

    it('VF Upfront: header GST triggers TDS in totals (threshold met)', () => {
      const totals = computeCreateInvoiceTotals({
        items: [sampleItemNoTax],
        fieldsTax: {cgst: '4500', sgst: '4500', taxTotal: ''},
        productType: 'vendor_finance',
        isVendorFinanceUpfront: true,
        tdsRatePercent: 2,
        tdsThreshold: 50000,
        ytdInvoiceTotal: 100000,
      });
      expect(totals.taxTotal).toBe(9000);
      expect(totals.tds).toBe(1000);
    });

    it('DF: header GST alone does not enable TDS without item tax', () => {
      expect(
        isTaxEligibleForTds({
          hasSelectedTax: false,
          headerGstTotal: 18000,
          productType: 'dealer_finance',
          isVendorFinanceUpfront: false,
        }),
      ).toBe(false);
    });

    it('item tax enables TDS for DF and VF', () => {
      expect(itemsHaveSelectedTax([sampleItemWithTax])).toBe(true);
      expect(itemsHaveSelectedTax([sampleItemNoTax])).toBe(false);
    });

    it('OCR header fallback GST in totals when item tax absent', () => {
      const totals = computeCreateInvoiceTotals({
        items: [sampleItemNoTax],
        fieldsTax: {cgst: '4500', sgst: '4500', taxTotal: ''},
        productType: 'dealer_finance',
        isVendorFinanceUpfront: false,
        tdsRatePercent: 2,
        tdsThreshold: null,
        ytdInvoiceTotal: 0,
      });
      expect(totals.taxTotal).toBe(9000);
      expect(totals.tds).toBe(0);
    });
  });

  describe('limit check + preview parity helpers', () => {
    it('limit amount includes header GST when item tax absent', () => {
      const amount = computeInvoiceAmountForLimitCheck([sampleItemNoTax], {
        cgst: '4500',
        sgst: '4500',
        taxTotal: '',
      });
      expect(amount).toBe(59000);
    });

    it('preview summary matches create form totals', () => {
      const summary = computeCreateInvoiceSummaryFromFields({
        items: [sampleItemWithTax],
        fieldsTax: {cgst: '', sgst: '', taxTotal: ''},
        tdsAmount: '1900',
        upfrontInterest: '3287.34',
      });
      expect(summary.subTotal).toBe(100000);
      expect(summary.discountTotal).toBe(5000);
      expect(summary.taxTotal).toBe(18000);
      expect(summary.tdsAmount).toBe(1900);
      expect(summary.advanceInterest).toBe(3287.34);
      expect(summary.netTotal).toBe(107812.66);
    });
  });

  describe('Sprint 3 polish helpers', () => {
    it('VF OCR party labels', () => {
      expect(getOcrPartyLabels('vendor_finance')).toEqual({
        party: 'Vendor',
        code: 'Vendor Code',
        od: 'Vendor OD Account',
      });
    });

    it('PID OCR party labels use Vendor', () => {
      expect(getOcrPartyLabels('purchase_invoice_discounting')).toEqual({
        party: 'Vendor',
        code: 'Vendor Code',
        od: 'Vendor OD Account',
      });
    });

    it('SID OCR party labels use Debtor + Escrow Account No.', () => {
      expect(getOcrPartyLabels('sales_invoice_discounting')).toEqual({
        party: 'Debtor',
        code: 'Debtor Code',
        od: 'Escrow Account No.',
      });
    });

    it('PID and SID are standalone (vendorMappingId); DF / VF are not', () => {
      expect(isStandaloneProductType('purchase_invoice_discounting')).toBe(true);
      expect(isStandaloneProductType('sales_invoice_discounting')).toBe(true);
      expect(isStandaloneProductType('vendor_finance')).toBe(false);
      expect(isStandaloneProductType('dealer_finance')).toBe(false);
    });

    it('DF OCR party labels unchanged', () => {
      expect(getOcrPartyLabels('dealer_finance')).toEqual({
        party: 'Dealer',
        code: 'Dealer Code',
        od: 'OD Account',
      });
    });

    it('warns when VF Upfront AI is zero but inputs expect interest', () => {
      expect(
        shouldWarnVfZeroAdvanceInterest({
          isVendorFinanceUpfront: true,
          chargeApplies: true,
          advanceInterest: 0,
          roiPercent: 12,
          tenorDays: 90,
          subTotal: 100000,
          discountTotal: 5000,
          taxTotal: 18000,
          tdsAmount: 1900,
        }),
      ).toBe(true);
    });

    it('does not warn when AI is calculated', () => {
      expect(
        shouldWarnVfZeroAdvanceInterest({
          isVendorFinanceUpfront: true,
          chargeApplies: true,
          advanceInterest: 3287.34,
          roiPercent: 12,
          tenorDays: 90,
          subTotal: 100000,
          discountTotal: 5000,
          taxTotal: 18000,
          tdsAmount: 1900,
        }),
      ).toBe(false);
    });

    it('does not warn for DF', () => {
      expect(
        shouldWarnVfZeroAdvanceInterest({
          isVendorFinanceUpfront: false,
          chargeApplies: false,
          advanceInterest: 0,
          roiPercent: 12,
          tenorDays: 90,
          subTotal: 100000,
          discountTotal: 0,
          taxTotal: 18000,
          tdsAmount: 1000,
        }),
      ).toBe(false);
    });
  });
});
