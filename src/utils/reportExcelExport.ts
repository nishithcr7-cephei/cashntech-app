import {
  postGenericExcelExport,
  type GenericExcelExportColumn,
  type GenericExcelHeaderData,
} from '@services/api/export.api';
import {downloadExcelBuffer} from '@utils/downloadUtils';
import {
  getPresetDateRange,
  type ReportApiFilterState,
} from '@utils/reportFilterPayload';

export type ReportExcelExportOptions = {
  reportTitle: string;
  filename: string;
  columns: GenericExcelExportColumn[];
  rows: Record<string, unknown>[];
  appliedFilters?: ReportApiFilterState;
  generatedBy?: string;
  useReportHeader?: boolean;
};

function formatExportCellValue(value: unknown): string | number {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

export function rowsToExportData<T extends object>(
  items: T[],
  columns: GenericExcelExportColumn[],
): Record<string, unknown>[] {
  return items.map(item => {
    const record = item as Record<string, unknown>;
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      row[col.key] = formatExportCellValue(record[col.key]);
    }
    return row;
  });
}

function buildExportHeaderData(
  reportTitle: string,
  appliedFilters: ReportApiFilterState | undefined,
  generatedBy: string | undefined,
): GenericExcelHeaderData {
  const now = new Date();
  const generatedOn = now.toLocaleDateString('en-GB');

  let fromDate = '';
  let toDate = '';
  if (appliedFilters?.rangeEnabled) {
    if (appliedFilters.rangePreset !== 'custom') {
      const preset = getPresetDateRange(appliedFilters.rangePreset);
      fromDate = preset.startDate;
      toDate = preset.endDate;
    } else {
      fromDate = appliedFilters.startDate || '';
      toDate = appliedFilters.endDate || '';
    }
  }

  const programLabel =
    appliedFilters?.programEnabled && appliedFilters.programIds.length > 0
      ? `${appliedFilters.programIds.length} program(s) selected`
      : 'All Programs';

  return {
    companyName: 'CashnTech',
    reportName: reportTitle,
    program: programLabel,
    fromDate,
    toDate,
    generatedOn,
    generatedBy: generatedBy || '',
    asOnDate: generatedOn,
    reportPeriod:
      fromDate && toDate ? `${fromDate} to ${toDate}` : 'All dates',
  };
}

export async function exportReportToExcel(
  options: ReportExcelExportOptions,
): Promise<{success: boolean; filePath?: string; error?: string}> {
  const {
    reportTitle,
    filename,
    columns,
    rows,
    appliedFilters,
    generatedBy,
    useReportHeader = true,
  } = options;

  if (!rows.length) {
    return {success: false, error: 'No data to export'};
  }

  try {
    const buffer = await postGenericExcelExport({
      data: rows,
      columns,
      filename,
      headerFlag: useReportHeader,
      headerData: useReportHeader
        ? buildExportHeaderData(reportTitle, appliedFilters, generatedBy)
        : null,
    });

    return downloadExcelBuffer(buffer, filename);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to export report';
    return {success: false, error: message};
  }
}
