import ApiEndPoints from '@constants/ApiEndPoints';
import {
  PRODUCT_CODES,
  type ProductCode,
} from '@store/product/product.types';
import type {PartySide} from '@utils/roleNormalizer';
import {isVendorFinance} from '@store/product/product.resolver';

/**
 * Resolves create-invoice party bootstrap path for the unified cashntech-backend.
 *
 * **Unified backend (DF + VF):** always `GET /invoice/party-info/:programId`.
 * Legacy `dealer-info` / `anchor-info` routes are removed on the server.
 *
 * `productCode` / `partySide` are retained on the options type for callers
 * (sagas, create flow) but no longer affect routing.
 */
export type InvoicePartyInfoRouteOptions = {
  /** Active product code from PR1; kept for API compatibility */
  productCode?: ProductCode | string | null;
  /** PR3 capability party side; unused for routing on unified backend */
  partySide?: PartySide | null;
};

/** Unified backend always serves party-info for DF and VF. */
export function usesPartyInfoRoute(
  _productCode?: ProductCode | string | null,
): boolean {
  return true;
}

export function resolveInvoicePartyInfoPath(
  programId: string,
  _options?: InvoicePartyInfoRouteOptions,
): string {
  return ApiEndPoints.apiPartyInfo(programId);
}

/** True when create payload should include credit_to_account_id (VF/CWF). PR6 wires UI. */
export function requiresCreditToAccountId(
  productCode?: ProductCode | string | null,
): boolean {
  if (productCode == null || productCode === '') {
    return false;
  }
  return isVendorFinance(productCode as ProductCode);
}

export {PRODUCT_CODES};
