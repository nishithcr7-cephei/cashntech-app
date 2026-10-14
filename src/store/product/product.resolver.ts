import {
  DEFAULT_PRODUCT_CODE,
  PRODUCT_CODES,
  PRODUCT_DISPLAY_NAMES,
  PRODUCT_NAV_LABELS,
  ProductCode,
  ProductLike,
  ResolvedProduct,
} from './product.types';

const DF_NAME_HINTS = ['dealer finance', 'dealer_finance'];
const VF_NAME_HINTS = ['vendor finance', 'vendor_finance'];
const PID_NAME_HINTS = [
  'purchase invoice discounting',
  'purchase_invoice_discounting',
];
const SID_NAME_HINTS = [
  'sales invoice discounting',
  'sales_invoice_discounting',
];

function normalizeToken(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Resolve a mobile ProductCode from an explicit backend product_code / slug.
 * Returns null when the value is missing or unrecognized (do not invent VF/PID).
 */
export function resolveProductCodeFromProductCode(
  productCode: string | null | undefined,
): ProductCode | null {
  const token = normalizeToken(productCode).replace(/[\s-]+/g, '_');
  if (!token) {
    return null;
  }

  if (
    token === PRODUCT_CODES.DEALER_FINANCE ||
    token === 'df' ||
    token === 'dealer'
  ) {
    return PRODUCT_CODES.DEALER_FINANCE;
  }

  if (
    token === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING ||
    token === 'pid' ||
    token === 'purchase_invoice_discounting'
  ) {
    return PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING;
  }

  if (token === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING || token === 'sid') {
    return PRODUCT_CODES.SALES_INVOICE_DISCOUNTING;
  }

  if (
    token === PRODUCT_CODES.VENDOR_FINANCE ||
    token === 'vf' ||
    token === 'vendor'
  ) {
    return PRODUCT_CODES.VENDOR_FINANCE;
  }

  return null;
}

/**
 * Infer ProductCode from backend `product.name` values
 * (e.g. "Dealer Finance" / "Vendor Finance" / "Purchase Invoice Discounting")
 * when product_code is absent.
 */
export function resolveProductCodeFromName(
  name: string | null | undefined,
): ProductCode | null {
  const token = normalizeToken(name);
  if (!token) {
    return null;
  }

  // PID/SID before VF — names must not be confused with generic "vendor".
  if (PID_NAME_HINTS.some(hint => token.includes(hint))) {
    return PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING;
  }
  if (SID_NAME_HINTS.some(hint => token.includes(hint))) {
    return PRODUCT_CODES.SALES_INVOICE_DISCOUNTING;
  }
  if (VF_NAME_HINTS.some(hint => token.includes(hint))) {
    return PRODUCT_CODES.VENDOR_FINANCE;
  }
  if (DF_NAME_HINTS.some(hint => token.includes(hint))) {
    return PRODUCT_CODES.DEALER_FINANCE;
  }

  // Exact / slug fallbacks already covered by product_code helper
  return resolveProductCodeFromProductCode(token);
}

/**
 * Prefer product_code when present; otherwise name-based inference.
 * Pure and safe for unit tests — never defaults to DF/VF/PID when unknown.
 */
export function resolveProductCode(input: ProductLike): ProductCode | null {
  const fromCode = resolveProductCodeFromProductCode(
    input.product_code ?? input.productCode ?? input.code,
  );
  if (fromCode) {
    return fromCode;
  }
  return resolveProductCodeFromName(input.name);
}

/**
 * Build a ResolvedProduct from a backend-like product object.
 * Returns null when code cannot be resolved (unknown product stays out of branching).
 */
export function resolveProduct(input: ProductLike): ResolvedProduct | null {
  const code = resolveProductCode(input);
  if (!code) {
    return null;
  }

  const name =
    (input.name && input.name.trim()) || PRODUCT_DISPLAY_NAMES[code];
  const id = (input.id && String(input.id).trim()) || '';

  return {
    id,
    name,
    code,
    productCode: input.product_code ?? input.productCode ?? null,
  };
}

/**
 * Deduplicate and resolve a list of backend-like products (e.g. from /user/scope).
 * Unknown products are skipped — they must not activate VF/PID UI accidentally.
 */
export function resolveAvailableProducts(
  products: ProductLike[] | null | undefined,
): ResolvedProduct[] {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const byKey = new Map<string, ResolvedProduct>();

  for (const item of products) {
    const resolved = resolveProduct(item);
    if (!resolved) {
      continue;
    }

    const key = resolved.id || `${resolved.code}:${resolved.name}`;
    if (!byKey.has(key)) {
      byKey.set(key, resolved);
    }
  }

  return Array.from(byKey.values());
}

/**
 * Collect unique products from bank/scope trees shaped like programSelection scopeData.
 */
export function collectProductsFromScopeBanks(
  banks:
    | Array<{
        products?: Array<{
          id?: string | null;
          name?: string | null;
          product_code?: string | null;
          productCode?: string | null;
        }> | null;
      }>
    | null
    | undefined,
): ResolvedProduct[] {
  if (!Array.isArray(banks) || banks.length === 0) {
    return [];
  }

  const flat: ProductLike[] = [];
  for (const bank of banks) {
    const products = bank.products;
    if (!Array.isArray(products)) {
      continue;
    }
    for (const p of products) {
      flat.push(p);
    }
  }
  return resolveAvailableProducts(flat);
}

export function isDealerFinance(code: ProductCode | null | undefined): boolean {
  return code === PRODUCT_CODES.DEALER_FINANCE;
}

export function isVendorFinance(code: ProductCode | null | undefined): boolean {
  return code === PRODUCT_CODES.VENDOR_FINANCE;
}

export function isPid(code: ProductCode | null | undefined): boolean {
  return code === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING;
}

export function isSid(code: ProductCode | null | undefined): boolean {
  return code === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING;
}

/** PID + SID — standalone program/vendor mapping products. */
export function isStandaloneProduct(
  code: ProductCode | null | undefined,
): boolean {
  return isPid(code) || isSid(code);
}

/** VF + PID party labels are Vendor (not Dealer). SID uses Debtor — see getPartyLabels. */
export function usesVendorPartyLabels(
  code: ProductCode | null | undefined,
): boolean {
  return isVendorFinance(code) || isPid(code);
}

/**
 * VF + PID + SID: transaction rows put the counterparty (vendor / debtor) in the
 * party column and the anchor in the counter column. Use for layout, not text.
 */
export function usesVendorPartyLayout(
  code: ProductCode | null | undefined,
): boolean {
  return usesVendorPartyLabels(code) || isSid(code);
}

export type PartyLabels = {
  singular: string;
  plural: string;
  nameLabel: string;
  codeLabel: string;
};

/** Counterparty wording per product: DF = Dealer, VF/PID = Vendor, SID = Debtor. */
export function getPartyLabels(code: ProductCode | null | undefined): PartyLabels {
  if (isSid(code)) {
    return {
      singular: 'Debtor',
      plural: 'Debtors',
      nameLabel: 'Debtor Name',
      codeLabel: 'Debtor Code',
    };
  }
  if (usesVendorPartyLabels(code)) {
    return {
      singular: 'Vendor',
      plural: 'Vendors',
      nameLabel: 'Vendor Name',
      codeLabel: 'Vendor Code',
    };
  }
  return {
    singular: 'Dealer',
    plural: 'Dealers',
    nameLabel: 'Dealer Name',
    codeLabel: 'Dealer Code',
  };
}

/**
 * Effective code for callers that need a non-null value.
 * Absent context defaults to DF so existing behavior is preserved.
 * When a code is set (including PID), it is returned as-is — never rewrite PID→DF.
 */
export function getEffectiveProductCode(
  code: ProductCode | null | undefined,
): ProductCode {
  return code ?? DEFAULT_PRODUCT_CODE;
}

/**
 * productId for list/KPI/summary APIs.
 * Prefer a specifically selected program product; otherwise the active product
 * (DF, VF, PID). Backend summary/latest require productId.
 */
export function resolveWorkspaceProductId(
  programSelection?: {
    programScope?: string | null;
    productId?: string | null;
  } | null,
  activeProductId?: string | null,
): string | null {
  if (
    programSelection?.programScope === 'selected' &&
    typeof programSelection.productId === 'string' &&
    programSelection.productId.trim()
  ) {
    return programSelection.productId.trim();
  }
  if (typeof activeProductId === 'string' && activeProductId.trim()) {
    return activeProductId.trim();
  }
  return null;
}

/**
 * One entry per ProductCode for selection UI — DF → VF → PID → SID.
 * Prefer the first occurrence's backend id/name.
 */
export function uniqueProductsByCode(
  products: ResolvedProduct[],
): ResolvedProduct[] {
  const byCode = new Map<ProductCode, ResolvedProduct>();
  for (const product of products) {
    if (!byCode.has(product.code)) {
      byCode.set(product.code, product);
    }
  }

  const ordered: ProductCode[] = [
    PRODUCT_CODES.DEALER_FINANCE,
    PRODUCT_CODES.VENDOR_FINANCE,
    PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING,
    PRODUCT_CODES.SALES_INVOICE_DISCOUNTING,
  ];
  const result: ResolvedProduct[] = [];
  for (const code of ordered) {
    const match = byCode.get(code);
    if (match) {
      result.push(match);
      byCode.delete(code);
    }
  }
  byCode.forEach(product => {
    result.push(product);
  });
  return result;
}

/** Compact nav label (e.g. PID) for drawer and header chips. */
export function getProductNavLabel(code: ProductCode): string {
  return PRODUCT_NAV_LABELS[code];
}

/** Full display name for tooltips / bottom sheets. */
export function getProductFullDisplayName(
  product: Pick<ResolvedProduct, 'code' | 'name'>,
): string {
  return (product.name && product.name.trim()) || PRODUCT_DISPLAY_NAMES[product.code];
}

/** True when nav label is shorter than the canonical display name. */
export function hasCompactNavLabel(code: ProductCode): boolean {
  return PRODUCT_NAV_LABELS[code] !== PRODUCT_DISPLAY_NAMES[code];
}
