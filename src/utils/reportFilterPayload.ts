/** API POST body for all report endpoints (matches backend report.controller). */
export type ReportApiRequestPayload = {
  startDate?: string;
  endDate?: string;
  programIds?: string[];
};

export type ReportRangePreset =
  | 'last_1_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_1_year'
  | 'custom';

export type ReportApiFilterState = {
  rangeEnabled: boolean;
  programEnabled: boolean;
  rangePreset: ReportRangePreset;
  /** YYYY-MM-DD for API */
  startDate?: string;
  endDate?: string;
  programIds: string[];
};

export const EMPTY_REPORT_API_FILTER: ReportApiFilterState = {
  rangeEnabled: false,
  programEnabled: false,
  rangePreset: 'last_1_year',
  programIds: [],
};

export const REPORT_RANGE_PRESET_LABELS: Record<ReportRangePreset, string> = {
  last_1_month: 'Last 1 Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  last_1_year: 'Last 1 Year',
  custom: 'Custom',
};

/** Format Date as YYYY-MM-DD for report API body. */
export function formatReportApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseReportApiDate(iso: string | undefined): Date | undefined {
  if (!iso) {
    return undefined;
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return new Date(parsed);
}

export function getPresetDateRange(preset: ReportRangePreset): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  const start = new Date();
  switch (preset) {
    case 'last_1_month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'last_3_months':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'last_6_months':
      start.setMonth(start.getMonth() - 6);
      break;
    case 'last_1_year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'custom':
    default:
      break;
  }
  return {
    startDate: formatReportApiDate(start),
    endDate: formatReportApiDate(end),
  };
}

/** Builds POST body: `{}` when no filters enabled; otherwise startDate/endDate and/or programIds. */
export function buildReportRequestPayload(
  state: ReportApiFilterState,
): ReportApiRequestPayload {
  const payload: ReportApiRequestPayload = {};

  if (state.rangeEnabled) {
    let startDate = state.startDate;
    let endDate = state.endDate;
    if (state.rangePreset !== 'custom') {
      const preset = getPresetDateRange(state.rangePreset);
      startDate = preset.startDate;
      endDate = preset.endDate;
    }
    if (startDate && endDate) {
      payload.startDate = startDate;
      payload.endDate = endDate;
    }
  }

  if (state.programEnabled && state.programIds.length > 0) {
    payload.programIds = state.programIds;
  }

  return payload;
}
