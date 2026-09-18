/**
 * Product context types for multi-product (DF + VF + PID) support.
 * productId / product-aware fields stay optional; absent context = current DF behavior.
 */

export const PRODUCT_CODES = {
  DEALER_FINANCE: 'dealer_finance',
  VENDOR_FINANCE: 'vendor_finance',
  PURCHASE_INVOICE_DISCOUNTING: 'purchase_invoice_discounting',
} as const;

export type ProductCode = (typeof PRODUCT_CODES)[keyof typeof PRODUCT_CODES];

export const PRODUCT_DISPLAY_NAMES: Record<ProductCode, string> = {
  [PRODUCT_CODES.DEALER_FINANCE]: 'Dealer Finance',
  [PRODUCT_CODES.VENDOR_FINANCE]: 'Vendor Finance',
  [PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING]:
    'Purchase Invoice Discounting',
};

/** Canonical default when no product context is set (preserves DF production behavior). */
export const DEFAULT_PRODUCT_CODE: ProductCode = PRODUCT_CODES.DEALER_FINANCE;

/**
 * Normalized product record used in Redux / persistence.
 * `id` is the backend product UUID when known; may be empty until scope is loaded.
 */
export type ResolvedProduct = {
  id: string;
  name: string;
  code: ProductCode;
  /** Future backend field; not returned by login/JWT/scope today. */
  productCode?: string | null;
};

/**
 * Loose backend-like product shape for resolver input.
 * Prefer `product_code` when present; otherwise infer from `name`.
 */
export type ProductLike = {
  id?: string | null;
  name?: string | null;
  /** Explicit backend product_code when available (not in login/JWT/scope today). */
  product_code?: string | null;
  productCode?: string | null;
  /** Already-resolved mobile code (e.g. from persistence). */
  code?: ProductCode | string | null;
};

export type ProductState = {
  activeProduct: ResolvedProduct | null;
  availableProducts: ResolvedProduct[];
  /** True after a hydrate attempt from persistence (PR2 will dispatch hydrate). */
  hydrated: boolean;
  error: string | null;
};

export const initialProductState: ProductState = {
  activeProduct: null,
  availableProducts: [],
  hydrated: false,
  error: null,
};
