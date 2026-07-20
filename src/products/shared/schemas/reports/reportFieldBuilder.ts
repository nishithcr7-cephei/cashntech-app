import type {
  ReportFieldDef,
  ResolvedReportColumn,
} from '@products/shared/schemas/reports/types';

export type ReportFieldValue = {
  value: string;
  valueStyle?: object;
};

export type ReportFieldAccessor<T> = (
  item: T,
  key: string,
) => ReportFieldValue;

/** Build on-screen field rows from resolved column defs + per-report accessors. */
export function buildReportFields<T>(
  item: T,
  columns: ResolvedReportColumn[],
  accessor: ReportFieldAccessor<T>,
): ReportFieldDef[] {
  return columns.map(column => {
    const field = accessor(item, column.key);
    return {
      label: column.label,
      value: field.value,
      valueStyle: field.valueStyle,
    };
  });
}
