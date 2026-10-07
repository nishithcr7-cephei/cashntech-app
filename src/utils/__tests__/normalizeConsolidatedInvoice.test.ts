import type {ConsolidatedInvoiceApiRow} from '@store/consolidatedInvoice/consolidatedInvoice.types';
import {
  matchesConsolidatedSearch,
  normalizeConsolidatedInvoiceResponse,
  normalizeConsolidatedInvoiceRow,
} from '@utils/normalizeConsolidatedInvoice';
import {resolveDisbursementRequestedAmount} from '@utils/invoiceListAmounts';

jest.mock('@utils/decrypt', () => ({
  decryptValue: (value: string) => value,
}));

const baseRow: ConsolidatedInvoiceApiRow = {
  id: 'inv-1',
  loan_ref_no: 'KMBL-DF3009',
  invoice_ref_no: 'BLJ/2033/30302',
  partnerBank: {id: 'bank-1', bank_name: 'Kotak Mahindra Bank'},
  invoice_date: '2026-09-01T00:00:00.000Z',
  invoice_due_date: '2026-12-29T00:00:00.000Z',
  grn_date: null,
  created_at: '2026-09-30T10:00:00.000Z',
  invoice_status: 'IN_PROGRESS',
  approval_status: 'PENDING_ANCHOR_CHECKER',
  admin_status: 'VERIFIED',
  final_total: 215280,
  final_total_after_tds: 215280,
  net_disbursement_amount: 210000,
  program: {id: 'prog-1', program_name: 'DF-Indus TMT'},
  current_step: {role: 'Anchor Checker', department: 'Credit'},
};

describe('normalizeConsolidatedInvoiceRow', () => {
  it('maps a Dealer Finance row with Anchor / Dealer labels', () => {
    const row = normalizeConsolidatedInvoiceRow({
      ...baseRow,
      product: {id: 'df-id', name: 'Dealer Finance'},
      party: {entity_name: 'M/S Indus TMT Industries'},
      anchorParticipantMapping: {party: {entity_name: 'Balaji Traders'}},
    });

    expect(row.productCode).toBe('dealer_finance');
    expect(row.primaryPartyLabel).toBe('Anchor');
    expect(row.primaryPartyName).toBe('M/S Indus TMT Industries');
    expect(row.counterPartyLabel).toBe('Dealer');
    expect(row.counterPartyName).toBe('Balaji Traders');
    expect(row.invoiceNo).toBe('BLJ/2033/30302');
    expect(row.bankName).toBe('Kotak Mahindra Bank');
    expect(row.programName).toBe('DF-Indus TMT');
    expect(row.dueDate).toBe('29-12-2026');
    expect(row.grnDate).toBe('-');
    expect(row.invoiceAmount).toBe('2,15,280.00');
    expect(row.disbursementRequestedAmount).toBe('2,15,280.00');
    expect(row.netDisbursementAmount).toBe('2,10,000.00');
    expect(row.invoiceStatus).toBe('In Progress');
    expect(row.adminStatus).toBe('Verified');
    expect(row.rawAdminStatus).toBe('VERIFIED');
    expect(row.currentStep).toBe('Anchor Checker (Credit)');
  });

  it('maps a Vendor Finance row with Anchor / Vendor labels', () => {
    const row = normalizeConsolidatedInvoiceRow({
      ...baseRow,
      product: {id: 'vf-id', name: 'Vendor Finance'},
      party: {entity_name: 'Anchor Co'},
      anchorParticipantMapping: {party: {entity_name: 'Vendor Co'}},
    });

    expect(row.productCode).toBe('vendor_finance');
    expect(row.primaryPartyLabel).toBe('Anchor');
    expect(row.counterPartyLabel).toBe('Vendor');
    expect(row.counterPartyName).toBe('Vendor Co');
  });

  it('maps a PID row using programVendorDetails for the vendor', () => {
    const row = normalizeConsolidatedInvoiceRow({
      ...baseRow,
      product: {id: 'pid-id', name: 'Purchase Invoice Discounting'},
      party: {entity_name: 'Balaji Traders'},
      anchorParticipantMapping: null,
      programVendorDetails: {id: 'pvd-1', vendor_name: 'Balaji Wafers Pvt. Ltd'},
    });

    expect(row.productCode).toBe('purchase_invoice_discounting');
    expect(row.productId).toBe('pid-id');
    expect(row.primaryPartyLabel).toBe('Anchor');
    expect(row.primaryPartyName).toBe('Balaji Traders');
    expect(row.counterPartyLabel).toBe('Vendor');
    expect(row.counterPartyName).toBe('Balaji Wafers Pvt. Ltd');
  });

  it('falls back to "-" and generic labels for missing data / unknown product', () => {
    const row = normalizeConsolidatedInvoiceRow({id: 'inv-2'});

    expect(row.productCode).toBe('');
    expect(row.primaryPartyLabel).toBe('Primary Party');
    expect(row.counterPartyLabel).toBe('Counter Party');
    expect(row.invoiceNo).toBe('-');
    expect(row.invoiceAmount).toBe('-');
    expect(row.disbursementRequestedAmount).toBe('-');
    expect(row.netDisbursementAmount).toBe('-');
    expect(row.uploadDate).toBe('-');
    expect(row.currentStep).toBe('-');
  });
});

describe('normalizeConsolidatedInvoiceResponse', () => {
  it('unwraps BaseResponseDto { data: { rows, total, page, limit } }', () => {
    const res = normalizeConsolidatedInvoiceResponse({
      statusCode: 200,
      message: 'Sent',
      data: {rows: [baseRow], total: 23, page: 2, limit: 20},
    });
    expect(res.rows).toHaveLength(1);
    expect(res.total).toBe(23);
    expect(res.page).toBe(2);
    expect(res.limit).toBe(20);
  });

  it('returns an empty list for a missing / malformed payload', () => {
    const res = normalizeConsolidatedInvoiceResponse(null);
    expect(res.rows).toEqual([]);
    expect(res.total).toBe(0);
  });
});

describe('matchesConsolidatedSearch', () => {
  const row = normalizeConsolidatedInvoiceRow({
    ...baseRow,
    product: {id: 'df-id', name: 'Dealer Finance'},
    party: {entity_name: 'M/S Indus TMT Industries'},
    anchorParticipantMapping: {party: {entity_name: 'Balaji Traders'}},
  });

  it('matches only the selected field (case-insensitive)', () => {
    expect(matchesConsolidatedSearch(row, '30302', 'invoiceNo')).toBe(true);
    expect(matchesConsolidatedSearch(row, 'kmbl-df', 'loanRefNo')).toBe(true);
    expect(matchesConsolidatedSearch(row, 'indus tmt', 'programName')).toBe(true);

    expect(matchesConsolidatedSearch(row, 'kmbl-df', 'invoiceNo')).toBe(false);
    expect(matchesConsolidatedSearch(row, '30302', 'programName')).toBe(false);
    expect(matchesConsolidatedSearch(row, 'balaji', 'invoiceNo')).toBe(false);
  });

  it('does not match unrelated text; empty query matches all', () => {
    expect(matchesConsolidatedSearch(row, 'xyz-999', 'invoiceNo')).toBe(false);
    expect(matchesConsolidatedSearch(row, '   ', 'invoiceNo')).toBe(true);
  });
});

describe('resolveDisbursementRequestedAmount (shared with Invoice List)', () => {
  it('uses sub − discount + tax − TDS when sub_total is present', () => {
    expect(
      resolveDisbursementRequestedAmount({
        sub_total: 100000,
        discount_total: 100,
        tax_total: 5000,
        tds_amount: 1000,
        final_total_after_tds: 1,
      }),
    ).toBe('1,03,900.00/-');
  });

  it('falls back to final_total_after_tds when sub_total is absent', () => {
    expect(
      resolveDisbursementRequestedAmount({final_total_after_tds: '25200'}),
    ).toBe('25,200.00/-');
  });

  it('drops the /- suffix when asked (consolidated view)', () => {
    expect(
      resolveDisbursementRequestedAmount(
        {final_total_after_tds: '25200'},
        {suffix: ''},
      ),
    ).toBe('25,200.00');
  });
});
