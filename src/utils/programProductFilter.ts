import type {BankProgram, Program} from '@constants/programSelection';
import {
  DEFAULT_PRODUCT_CODE,
  PRODUCT_CODES,
  type ProductCode,
} from '@store/product/product.types';
import {resolveProductCode} from '@store/product/product.resolver';

export type ProgramSelectabilityOptions = {
  /** Active product from PR1; absent = DF default behavior */
  activeProductCode?: ProductCode | string | null;
  /** Makers/checkers/admin can pick any program in scope */
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
 * Whether a scope program row is selectable for the current product context.
 * VF programs become selectable when active product is VF; DF logic unchanged when absent.
 */
export function isProgramSelectableForProduct(
  bankName: string,
  product: BankProgram,
  program: Program,
  options: ProgramSelectabilityOptions,
): boolean {
  if (options.allowAllPrograms) {
    return true;
  }

  if (bankName.toLowerCase() === 'ugro') {
    return true;
  }

  const scopeCode = resolveScopeProductCode(product);
  const activeCode =
    (options.activeProductCode as ProductCode | null) ?? DEFAULT_PRODUCT_CODE;

  if (activeCode === PRODUCT_CODES.VENDOR_FINANCE) {
    return scopeCode === PRODUCT_CODES.VENDOR_FINANCE;
  }

  if (scopeCode === PRODUCT_CODES.DEALER_FINANCE) {
    return true;
  }

  return isLegacyDealerFinanceProgram(product, program);
}
