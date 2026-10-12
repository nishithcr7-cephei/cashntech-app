import {
  initialConsolidatedFilters,
  type ConsolidatedInvoiceFilters,
} from '@store/consolidatedInvoice/consolidatedInvoice.types';
import type {ProductCode} from '@store/product/product.types';

type ProductOption = {code: ProductCode; productIds: string[]};

/**
 * Filters applied the first time the consolidated view opens in a workspace:
 * the active product (every bank-wise id for its code), all programs, no statuses.
 * Unknown / unavailable active product = all products.
 */
export function resolveDefaultConsolidatedFilters(
  activeProductCode: ProductCode | null | undefined,
  productOptions: ProductOption[],
): ConsolidatedInvoiceFilters {
  const match = activeProductCode
    ? productOptions.find(option => option.code === activeProductCode)
    : undefined;
  if (!match?.productIds.length) {
    return initialConsolidatedFilters;
  }
  return {...initialConsolidatedFilters, productIds: [...match.productIds]};
}
