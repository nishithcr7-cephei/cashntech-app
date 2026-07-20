import {useCallback, useState} from 'react';
import {useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import {userSelector} from '@store/user';
import type {GenericExcelExportColumn} from '@services/api/export.api';
import {
  exportReportToExcel,
  rowsToExportData,
} from '@utils/reportExcelExport';
import {
  showExcelDownloadError,
  showExcelDownloadSuccess,
} from '@utils/downloadUtils';
import type {ReportApiFilterState} from '@utils/reportFilterPayload';

export type UseReportExportParams<T extends object> = {
  reportTitle: string;
  filename: string;
  /** Product-resolved columns from `useReportColumns` (PR8). */
  columns: GenericExcelExportColumn[];
  /** Full dataset after client search/filter (not paginated slice). */
  getExportRows: () => T[];
  appliedFilters?: ReportApiFilterState;
};

export function useReportExport<T extends object>({
  reportTitle,
  filename,
  columns,
  getExportRows,
  appliedFilters,
}: UseReportExportParams<T>) {
  const generatedBy = useSelector(userSelector.getFullName);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) {
      return;
    }

    const items = getExportRows();
    if (!items.length) {
      Toast.show({
        type: 'info',
        text1: 'Export',
        text2: 'No records to export for the current filters.',
        visibilityTime: 2500,
      });
      return;
    }

    setExporting(true);
    Toast.show({
      type: 'info',
      text1: 'Export',
      text2: 'Generating Excel file…',
      visibilityTime: 2000,
    });

    try {
      const data = rowsToExportData(items, columns);
      const result = await exportReportToExcel({
        reportTitle,
        filename,
        columns,
        rows: data,
        appliedFilters,
        generatedBy,
      });

      if (result.success && result.filePath) {
        showExcelDownloadSuccess(result.filePath);
      } else {
        showExcelDownloadError(result.error || 'Export failed');
      }
    } finally {
      setExporting(false);
    }
  }, [
    appliedFilters,
    columns,
    exporting,
    filename,
    generatedBy,
    getExportRows,
    reportTitle,
  ]);

  return {handleExport, exporting};
}
