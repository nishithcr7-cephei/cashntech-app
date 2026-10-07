import type {Bank} from '@constants/programSelection';
import {resolveProductCode} from '@store/product/product.resolver';
import type {ProductCode} from '@store/product/product.types';

export type ConsolidatedProgramOption = {
  id: string;
  name: string;
  productName: string;
};

export type ConsolidatedProgramGroup = {
  bankId: string;
  bankName: string;
  programs: ConsolidatedProgramOption[];
};

/**
 * Programs from GET /user/scope grouped by bank, across every product.
 * `productCodes` empty = no product filter. Scope product ids are matched as
 * well as codes because a product can be listed once per bank.
 */
export function buildConsolidatedProgramGroups(
  banks: Bank[] | null | undefined,
  productIds: string[],
  productCodes: ProductCode[],
): ConsolidatedProgramGroup[] {
  if (!banks?.length) {
    return [];
  }
  const filterOn = productIds.length > 0 || productCodes.length > 0;
  const groups: ConsolidatedProgramGroup[] = [];

  for (const bank of banks) {
    const seen = new Set<string>();
    const programs: ConsolidatedProgramOption[] = [];
    for (const product of bank.products) {
      if (filterOn) {
        const code = resolveProductCode({id: product.id, name: product.name});
        const matches =
          productIds.includes(product.id) ||
          (!!code && productCodes.includes(code));
        if (!matches) {
          continue;
        }
      }
      for (const program of product.programs) {
        if (seen.has(program.id)) {
          continue;
        }
        seen.add(program.id);
        programs.push({
          id: program.id,
          name: program.name,
          productName: product.name,
        });
      }
    }
    if (programs.length) {
      groups.push({bankId: bank.id, bankName: bank.name, programs});
    }
  }
  return groups;
}

export function collectProgramIds(groups: ConsolidatedProgramGroup[]): Set<string> {
  const ids = new Set<string>();
  groups.forEach(group => group.programs.forEach(program => ids.add(program.id)));
  return ids;
}
