import type {Bank} from '@constants/programSelection';
import type {ProductCode} from '@store/product/product.types';
import {filterScopeBanksByActiveProduct} from '@utils/programProductFilter';

export type ReportProgramOption = {
  id: string;
  name: string;
};

/** Flatten user scope banks → programs for report filter (active product only). */
export function getReportProgramOptions(
  scopeData: Bank[] | null | undefined,
  activeProductCode?: ProductCode | string | null,
): ReportProgramOption[] {
  const banks = filterScopeBanksByActiveProduct(scopeData, activeProductCode);
  if (!banks.length) {
    return [];
  }

  const byId = new Map<string, string>();
  banks.forEach(bank => {
    bank.products?.forEach(product => {
      product.programs?.forEach(program => {
        if (program.id && !byId.has(program.id)) {
          byId.set(program.id, program.name || program.id);
        }
      });
    });
  });

  return Array.from(byId.entries())
    .map(([id, name]) => ({id, name}))
    .sort((a, b) => a.name.localeCompare(b.name));
}
