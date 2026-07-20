import {select} from 'redux-saga/effects';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {
  selectActiveProductId,
  selectIsVendorFinanceActive,
} from '@store/product/product.selectors';

/**
 * Optional productId for list/KPI bodies.
 * VF: active product or selected program product.
 * DF: omitted when no product context (preserves legacy requests).
 */
export function* selectOptionalProductId(): Generator<any, string | null, any> {
  const programSelection = yield select(selectProgramSelection);
  if (
    programSelection?.programScope === 'selected' &&
    typeof programSelection?.productId === 'string' &&
    programSelection.productId.trim()
  ) {
    return programSelection.productId.trim();
  }

  const isVf = yield select(selectIsVendorFinanceActive);
  if (!isVf) {
    return null;
  }
  const productId = yield select(selectActiveProductId);
  if (typeof productId === 'string' && productId.trim()) {
    return productId.trim();
  }
  return null;
}
