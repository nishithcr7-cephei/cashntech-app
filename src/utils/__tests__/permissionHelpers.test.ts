import {
  canCreateInvoiceForMethod,
  toProgramAppRole,
} from '../permissionHelpers';

describe('permissionHelpers — program create gate', () => {
  describe('toProgramAppRole', () => {
    it('maps All Access program roles', () => {
      expect(toProgramAppRole('Anchor All Access')).toBe('anchor_all_access');
      expect(toProgramAppRole('Dealer All Access')).toBe('dealer_all_access');
      expect(toProgramAppRole('Vendor All Access')).toBe('dealer_all_access');
    });

    it('maps maker / checker roles, vendor as counterparty', () => {
      expect(toProgramAppRole('Anchor Maker')).toBe('anchor_maker');
      expect(toProgramAppRole('Vendor Maker')).toBe('dealer_maker');
      expect(toProgramAppRole('Dealer Checker')).toBe('dealer_checker');
    });

    it('returns null for empty or unknown roles', () => {
      expect(toProgramAppRole(null)).toBeNull();
      expect(toProgramAppRole('')).toBeNull();
      expect(toProgramAppRole('Something Else')).toBeNull();
    });
  });

  describe('canCreateInvoiceForMethod', () => {
    it('Push allows anchor maker and anchor all access only', () => {
      expect(canCreateInvoiceForMethod('Push', 'anchor_maker')).toBe(true);
      expect(canCreateInvoiceForMethod('Push', 'anchor_all_access')).toBe(true);
      expect(canCreateInvoiceForMethod('Push', 'anchor_checker')).toBe(false);
      expect(canCreateInvoiceForMethod('Push', 'dealer_maker')).toBe(false);
      expect(canCreateInvoiceForMethod('Push', 'dealer_all_access')).toBe(false);
    });

    it('Pull allows counterparty maker and counterparty all access only', () => {
      expect(canCreateInvoiceForMethod('Pull', 'dealer_maker')).toBe(true);
      expect(canCreateInvoiceForMethod('Pull', 'dealer_all_access')).toBe(true);
      expect(canCreateInvoiceForMethod('Pull', 'dealer_checker')).toBe(false);
      expect(canCreateInvoiceForMethod('Pull', 'anchor_maker')).toBe(false);
      expect(canCreateInvoiceForMethod('Pull', 'anchor_all_access')).toBe(false);
    });

    it('rejects missing method or role', () => {
      expect(canCreateInvoiceForMethod(undefined, 'anchor_maker')).toBe(false);
      expect(canCreateInvoiceForMethod('Push', null)).toBe(false);
    });
  });
});
