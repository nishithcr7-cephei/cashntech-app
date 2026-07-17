import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  initialProductState,
  ResolvedProduct,
} from './product.types';

const productSlice = createSlice({
  name: 'product',
  initialState: initialProductState,
  reducers: {
    setActiveProduct: (state, action: PayloadAction<ResolvedProduct | null>) => {
      state.activeProduct = action.payload;
      state.error = null;
    },
    setAvailableProducts: (
      state,
      action: PayloadAction<ResolvedProduct[]>,
    ) => {
      state.availableProducts = action.payload;
      state.error = null;
    },
    /** PR2 will dispatch this during session bootstrap — not wired in PR1. */
    hydrateProductRequest: state => {
      state.error = null;
    },
    hydrateProductSuccess: (
      state,
      action: PayloadAction<{
        activeProduct: ResolvedProduct | null;
        availableProducts: ResolvedProduct[];
      }>,
    ) => {
      state.activeProduct = action.payload.activeProduct;
      state.availableProducts = action.payload.availableProducts;
      state.hydrated = true;
      state.error = null;
    },
    hydrateProductFailure: (state, action: PayloadAction<string>) => {
      state.hydrated = true;
      state.error = action.payload;
    },
    clearProductContext: () => ({
      ...initialProductState,
      hydrated: true,
    }),
  },
});

export const {
  setActiveProduct,
  setAvailableProducts,
  hydrateProductRequest,
  hydrateProductSuccess,
  hydrateProductFailure,
  clearProductContext,
} = productSlice.actions;

export default productSlice.reducer;
