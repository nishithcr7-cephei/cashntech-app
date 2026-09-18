import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';
import {
  DEFAULT_PRODUCT_CODE,
  PRODUCT_CODES,
  ProductState,
} from './product.types';
import {
  getEffectiveProductCode,
  isDealerFinance,
  isPid,
  isStandaloneProduct,
  isVendorFinance,
} from './product.resolver';

const selectProductState = (state: RootState): ProductState => state.product;

export const selectActiveProduct = createSelector(
  selectProductState,
  product => product.activeProduct,
);

export const selectAvailableProducts = createSelector(
  selectProductState,
  product => product.availableProducts,
);

export const selectActiveProductId = createSelector(
  selectActiveProduct,
  active => active?.id ?? null,
);

export const selectActiveProductName = createSelector(
  selectActiveProduct,
  active => active?.name ?? null,
);

export const selectActiveProductCode = createSelector(
  selectActiveProduct,
  active => active?.code ?? null,
);

/**
 * Non-null product code for optional product-aware params.
 * Defaults to DF when no active product — preserves current production behavior.
 * Plain selector (not createSelector): getEffectiveProductCode often returns its
 * input unchanged when a product is already selected, which Reselect warns about.
 */
export const selectEffectiveProductCode = (state: RootState) =>
  getEffectiveProductCode(selectActiveProductCode(state));

export const selectIsDealerFinanceActive = createSelector(
  selectActiveProductCode,
  code => (code == null ? true : isDealerFinance(code)),
);

export const selectIsVendorFinanceActive = createSelector(
  selectActiveProductCode,
  code => isVendorFinance(code),
);

export const selectIsPidActive = createSelector(
  selectActiveProductCode,
  code => isPid(code),
);

export const selectIsStandaloneProductActive = createSelector(
  selectActiveProductCode,
  code => isStandaloneProduct(code),
);

export const selectHasMultipleProducts = createSelector(
  selectAvailableProducts,
  products => products.length > 1,
);

export const selectProductHydrated = createSelector(
  selectProductState,
  product => product.hydrated,
);

export const selectProductError = createSelector(
  selectProductState,
  product => product.error,
);

export const selectIsDfDefaultContext = createSelector(
  selectActiveProductCode,
  code => code == null || code === PRODUCT_CODES.DEALER_FINANCE,
);

export {DEFAULT_PRODUCT_CODE};
