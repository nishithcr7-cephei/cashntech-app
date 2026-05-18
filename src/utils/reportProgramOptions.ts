import type {Bank} from '@constants/programSelection';

export type ReportProgramOption = {
  id: string;
  name: string;
};

/** Flatten user scope banks → programs for report filter list. */
export function getReportProgramOptions(
  scopeData: Bank[] | null | undefined,
): ReportProgramOption[] {
  if (!scopeData?.length) {
    return [];
  }

  const byId = new Map<string, string>();
  scopeData.forEach(bank => {
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
