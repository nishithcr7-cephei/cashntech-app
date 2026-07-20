import {useMemo} from 'react';
import {useSelector} from 'react-redux';
import type {GenericExcelExportColumn} from '@services/api/export.api';
import {selectActiveProductCode} from '@store/product/product.selectors';
import {
  resolveReportColumns,
  toExportColumns,
} from '@products/shared/schemas/reports/reportColumnResolver';
import type {ReportId} from '@products/shared/schemas/reports/types';

export function useReportColumns(reportId: ReportId): {
  screenColumns: ReturnType<typeof resolveReportColumns>['screenColumns'];
  exportColumns: GenericExcelExportColumn[];
} {
  const activeProductCode = useSelector(selectActiveProductCode);

  return useMemo(() => {
    const resolved = resolveReportColumns(reportId, activeProductCode);
    return {
      screenColumns: resolved.screenColumns,
      exportColumns: toExportColumns(resolved.exportColumns),
    };
  }, [reportId, activeProductCode]);
}
