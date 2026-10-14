import type {Bank, BankProgram, Program} from '@constants/programSelection';
import {
  PRODUCT_CODES,
  type ProductCode,
} from '@store/product/product.types';
import {getEffectiveProductCode, resolveProductCode} from '@store/product/product.resolver';

export type ProgramSelectabilityOptions = {
  /** Active product from PR1; absent = DF default behavior */
  activeProductCode?: ProductCode | string | null;
  /**
   * Role gate: user may select any program *within* the active product
   * (makers / checkers / CashnTech). Does NOT ignore the product filter.
   */
  allowAllPrograms?: boolean;
  bankName?: string;
};

function resolveScopeProductCode(product: BankProgram): ProductCode | null {
  return resolveProductCode({id: product.id, name: product.name});
}

function isLegacyDealerFinanceProgram(
  product: BankProgram,
  program: Program,
): boolean {
  const isDFProduct = product.name.toLowerCase().includes('dealer finance');
  const isDFProgramName =
    program.name.toLowerCase().includes('df') ||
    program.name.toLowerCase().includes('dealer finance');
  return isDFProduct || isDFProgramName;
}

/**
 * Whether a scope product node belongs to the given active product.
 */
export function doesProductMatchActiveProduct(
  product: BankProgram,
  activeProductCode?: ProductCode | string | null,
  program?: Program,
): boolean {
  const activeCode = getEffectiveProductCode(
    activeProductCode as ProductCode | null | undefined,
  );
  const scopeCode = resolveScopeProductCode(product);

  if (activeCode === PRODUCT_CODES.VENDOR_FINANCE) {
    return scopeCode === PRODUCT_CODES.VENDOR_FINANCE;
  }

  if (activeCode === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING) {
    return scopeCode === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING;
  }

  if (activeCode === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING) {
    return scopeCode === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING;
  }

  // Dealer Finance (default): DF-resolved products, or legacy DF-named rows.
  // Explicitly exclude VF/PID/SID so they never leak into the DF workspace.
  if (scopeCode === PRODUCT_CODES.DEALER_FINANCE) {
    return true;
  }
  if (
    scopeCode === PRODUCT_CODES.VENDOR_FINANCE ||
    scopeCode === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING ||
    scopeCode === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING
  ) {
    return false;
  }
  if (program) {
    return isLegacyDealerFinanceProgram(product, program);
  }
  return (
    product.name.toLowerCase().includes('dealer finance') ||
    product.programs.some(
      p =>
        p.name.toLowerCase().includes('df') ||
        p.name.toLowerCase().includes('dealer finance'),
    )
  );
}

/**
 * Whether a scope program row is selectable for the current product context.
 * Always product-scoped: allowAllPrograms never bypasses activeProductCode.
 */
export function isProgramSelectableForProduct(
  bankName: string,
  product: BankProgram,
  program: Program,
  options: ProgramSelectabilityOptions,
): boolean {
  if (!doesProductMatchActiveProduct(product, options.activeProductCode, program)) {
    return false;
  }

  // Within the active product: UGRO rows stay selectable (legacy exception).
  if (bankName.toLowerCase() === 'ugro') {
    return true;
  }

  // Role gate / default: once product matches, program is selectable.
  // allowAllPrograms documents "any program within active product" — same result
  // after the product match above.
  return true;
}

/**
 * Prune scope bank tree to the active product only.
 * Drops products that belong to other products, then drops empty banks.
 */
export function filterScopeBanksByActiveProduct(
  banks: Bank[] | null | undefined,
  activeProductCode?: ProductCode | string | null,
): Bank[] {
  if (!banks?.length) {
    return [];
  }

  return banks
    .map(bank => ({
      ...bank,
      products: bank.products
        .filter(product =>
          doesProductMatchActiveProduct(product, activeProductCode),
        )
        .map(product => ({
          ...product,
          programs: product.programs.filter(program =>
            doesProductMatchActiveProduct(product, activeProductCode, program),
          ),
        }))
        .filter(product => product.programs.length > 0),
    }))
    .filter(bank => bank.products.length > 0);
}

/**
 * Collect program IDs belonging to the active product only (for "All Program").
 */
export function collectProgramIdsForActiveProduct(
  banks: Bank[] | null | undefined,
  activeProductCode?: ProductCode | string | null,
): string[] {
  const filtered = filterScopeBanksByActiveProduct(banks, activeProductCode);
  const ids: string[] = [];
  filtered.forEach(bank =>
    bank.products.forEach(product =>
      product.programs.forEach(program => {
        ids.push(program.id);
      }),
    ),
  );
  return Array.from(new Set(ids));
}
