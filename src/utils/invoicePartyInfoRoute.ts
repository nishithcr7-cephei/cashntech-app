import ApiEndPoints from '@constants/ApiEndPoints';
import {
  PRODUCT_CODES,
  type ProductCode,
} from '@store/product/product.types';
import type {PartySide} from '@utils/roleNormalizer';
import {isVendorFinance} from '@store/product/product.resolver';

/**
 * Resolves create-invoice party bootstrap path by backend style + DF role.
 *
 * - VF (and CWF-style) backends: `/invoice/party-info/:programId`
 * - Main DF backend: `/invoice/dealer-info` (anchor/internal) or
 *   `/invoice/anchor-info` (counterparty / dealer)
 *
 * When product context is absent, defaults to main-DF dealer-info so
 * production DF flows stay unchanged.
 */
export type InvoicePartyInfoRouteOptions = {
  /** Active product code from PR1; null/undefined = DF default */
  productCode?: ProductCode | string | null;
  /** PR3 capability party side; used only for main-DF route pick */
  partySide?: PartySide | null;
};

export function usesPartyInfoRoute(
  productCode?: ProductCode | string | null,
): boolean {
  if (productCode == null || productCode === '') {
    return false;
  }
  return isVendorFinance(productCode as ProductCode);
}

export function resolveInvoicePartyInfoPath(
  programId: string,
  options?: InvoicePartyInfoRouteOptions,
): string {
  const code = options?.productCode ?? null;

  if (usesPartyInfoRoute(code)) {
    return ApiEndPoints.apiPartyInfo(programId);
  }

  // Main DF: counterparty (Dealer) uses anchor-info; everyone else dealer-info
  if (options?.partySide === 'counterparty') {
    return ApiEndPoints.apiAnchorInfo(programId);
  }

  return ApiEndPoints.apiDealerInfo(programId);
}

/** True when create payload should include credit_to_account_id (VF/CWF). */
export function requiresCreditToAccountId(
  productCode?: ProductCode | string | null,
): boolean {
  return usesPartyInfoRoute(productCode);
}

export {PRODUCT_CODES};
