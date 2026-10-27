jest.mock('@utils/decrypt', () => ({
  decryptValue: (v: string) => v,
}));

jest.mock('@utils/invoiceAttachments', () => ({
  fileNameFromAttachmentUrl: () => 'Invoice',
  mapInvoiceAttachmentsWithUrls: () => [],
}));

import {
  buildNoaConsentText,
  buildNoaNoticeBody,
  buildNoaNoticeSegments,
  extractAssignmentConsent,
  mapNoaPreviewFromDetails,
} from '../noticeOfAssignmentMap';

describe('noticeOfAssignmentMap', () => {
  it('builds locked consent text with bank name', () => {
    expect(buildNoaConsentText('SIDBI')).toBe(
      'I confirm the above receivable is assigned to SIDBI and the debtor is being instructed to pay into the escrow account.',
    );
  });

  it('maps SID details fields for the modal', () => {
    const preview = mapNoaPreviewFromDetails({
      invoice_ref_no: 'INV/2026/0220',
      invoice_date: '2026-10-19',
      invoice_due_date: '2026-11-18',
      po_ref_no: '',
      tenor: 30,
      final_total: 13200,
      party: {entity_name: 'Polmor Steel Private Limited'},
      partnerBank: {bank_name: 'SIDBI'},
      program: {
        program_name: 'Polmor Steel Pvt-SID Program',
        basic_parameters: {loan_account_no: 'SIDBI10000101'},
      },
      programVendorDetails: {
        vendor_name: 'Shreeyash Industrial Materials',
        vendor_code: 'SDD23432',
      },
      attachment: [],
    });

    expect(preview.invoiceRef).toBe('INV/2026/0220');
    expect(preview.assignorName).toBe('Polmor Steel Private Limited');
    expect(preview.assigneeBankName).toBe('SIDBI');
    expect(preview.debtorName).toBe('Shreeyash Industrial Materials');
    expect(preview.debtorCode).toBe('SDD23432');
    expect(preview.escrowAccount).toBe('SIDBI10000101');
    expect(preview.tenorLabel).toBe('30 days');
    expect(preview.consentText).toContain('SIDBI');
    expect(preview.noticeBody).toContain('INV/2026/0220');
    expect(preview.noticeBody).toContain('hereby give you notice');
    expect(preview.noticeBody).toContain(
      'without any set-off, deduction or counterclaim',
    );
    expect(preview.noticeSegments.some(s => s.bold && s.text === 'SIDBI')).toBe(
      true,
    );
    expect(preview.servedConsent).toBeNull();
  });

  it('extracts served consent for view mode', () => {
    const consent = extractAssignmentConsent({
      has_assignment_consent: true,
      assignment_consent: {
        consent_text: 'I confirm the above receivable is assigned to SIDBI…',
        notice_date: '2026-10-21',
        consented_at: '2026-10-21T10:00:00.000Z',
        signatory_email: 'maker@example.com',
        remark: 'oky',
      },
    });
    expect(consent?.noticeDateDisplay).toBe('21-10-2026');
    expect(consent?.signatoryEmail).toBe('maker@example.com');
    expect(consent?.remark).toBe('oky');
  });

  it('builds web-parity notice body with bold segments', () => {
    const input = {
      debtorName: 'Debtor Co',
      invoiceRef: 'INV-1',
      invoiceDateDisplay: '19-10-2026',
      assignorName: 'Assignor Co',
      assignedAmountDisplay: '1,000.00',
      assigneeBankName: 'Bank',
      dueDateDisplay: '18-11-2026',
      escrowAccount: 'ESCROW1',
    };
    const body = buildNoaNoticeBody(input);
    expect(body).toContain('Debtor Co');
    expect(body).toContain('We, Assignor Co (the "Assignor")');
    expect(body).toContain('ESCROW1');
    expect(body).toContain(
      'Payment made to the Assignor or to any other account will not discharge your liability',
    );

    const segments = buildNoaNoticeSegments(input);
    const boldTexts = segments.filter(s => s.bold).map(s => s.text);
    expect(boldTexts).toEqual([
      'Debtor Co',
      'INV-1',
      '19-10-2026',
      'Assignor Co',
      'Bank',
      '1,000.00',
      '18-11-2026',
      'ESCROW1',
    ]);
    expect(segments.map(s => s.text).join('')).toBe(body);
  });
});
