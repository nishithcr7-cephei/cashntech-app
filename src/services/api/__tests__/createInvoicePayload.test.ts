import {
  buildCreateInvoicePayload,
  type CreateInvoicePayloadInput,
} from '@services/api/invoice.api';
import type {InvoiceFields} from '@type/Invoice';

jest.mock('@services/api/api', () => ({
  __esModule: true,
  default: {get: jest.fn(), post: jest.fn(), put: jest.fn()},
}));
jest.mock('@utils/invoiceAttachments', () => ({
  mapInvoiceAttachmentsWithUrls: jest.fn(),
}));
jest.mock('@utils/decrypt', () => ({
  decryptValue: (value: string) => value,
}));

const fields = {
  invoiceNumber: 'SID/001',
  invoiceDate: '14-10-2026',
  invoiceDueDate: '13-11-2026',
  tenor: '30',
  creditTo: '123456789',
  currency: 'INR',
  items: [],
} as unknown as InvoiceFields;

const baseInput: CreateInvoicePayloadInput = {
  fields,
  createdBy: 'user-1',
  partnerBank: 'bank-1',
  program: 'prog-1',
  product: 'product-1',
  anchorParticipantMapping: '',
  party: 'party-1',
  counterPartyName: 'Debtor One',
  counterPartyCode: 'D001',
  counterPartyOdAccount: 'ESC-001',
  creditToAccountId: 'pvba-1',
};

describe('buildCreateInvoicePayload — party keys', () => {
  it('PID / SID: sends vendorMappingId only, no APM keys', () => {
    const payload = buildCreateInvoicePayload({
      ...baseInput,
      vendorMappingId: 'pvd-1',
    });

    expect(payload.vendorMappingId).toBe('pvd-1');
    expect(payload).not.toHaveProperty('anchorParticipantMapping');
    expect(payload).not.toHaveProperty('anchorParticipantMappingId');
    expect(payload.counter_party_od_account).toBe('ESC-001');
    expect(payload.credit_to_account_id).toBe('pvba-1');
    expect(payload.tenor).toBe(30);
  });

  it('DF / VF: sends both APM keys and no vendorMappingId', () => {
    const payload = buildCreateInvoicePayload({
      ...baseInput,
      anchorParticipantMapping: 'apm-1',
      vendorMappingId: undefined,
    });

    expect(payload.anchorParticipantMapping).toBe('apm-1');
    expect(payload.anchorParticipantMappingId).toBe('apm-1');
    expect(payload).not.toHaveProperty('vendorMappingId');
  });

  it('treats a blank vendorMappingId as DF / VF', () => {
    const payload = buildCreateInvoicePayload({
      ...baseInput,
      anchorParticipantMapping: 'apm-1',
      vendorMappingId: '   ',
    });

    expect(payload).not.toHaveProperty('vendorMappingId');
    expect(payload.anchorParticipantMappingId).toBe('apm-1');
  });
});
