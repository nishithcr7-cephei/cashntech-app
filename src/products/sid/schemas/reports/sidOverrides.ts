import type {
  ReportColumnOverride,
  ReportId,
} from '@products/shared/schemas/reports/types';

/** SID reuses the PID (vendor-party) report columns; only party wording changes. */
const toDebtorLabel = (text?: string): string | undefined =>
  text?.replace(/\bVendor\b/g, 'Debtor');

export function toSidOverrides(
  pidOverrides: Record<ReportId, ReportColumnOverride[]>,
): Record<ReportId, ReportColumnOverride[]> {
  const result = {} as Record<ReportId, ReportColumnOverride[]>;
  (Object.keys(pidOverrides) as ReportId[]).forEach(reportId => {
    result[reportId] = pidOverrides[reportId].map(entry => ({
      ...entry,
      label: toDebtorLabel(entry.label),
      exportHeader: toDebtorLabel(entry.exportHeader),
    }));
  });
  return result;
}
