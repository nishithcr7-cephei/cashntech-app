import {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {
  buildReportRequestPayload,
  EMPTY_REPORT_API_FILTER,
  type ReportApiFilterState,
  type ReportApiRequestPayload,
} from '@utils/reportFilterPayload';

type ReportFetchAction = {
  type: string;
  payload: ReportApiRequestPayload;
};

/**
 * Initial load with `{}`; refetch with filter body when user applies Range / Program.
 */
export function useReportApiFilter(
  fetchRequest: (payload: ReportApiRequestPayload) => ReportFetchAction,
) {
  const dispatch = useDispatch();
  const [appliedFilters, setAppliedFilters] =
    useState<ReportApiFilterState>(EMPTY_REPORT_API_FILTER);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadReport = useCallback(
    (filters: ReportApiFilterState = EMPTY_REPORT_API_FILTER) => {
      dispatch(fetchRequest(buildReportRequestPayload(filters)));
    },
    [dispatch, fetchRequest],
  );

  useEffect(() => {
    loadReport(EMPTY_REPORT_API_FILTER);
  }, [loadReport]);

  const handleApplyFilters = useCallback(
    (filters: ReportApiFilterState) => {
      setAppliedFilters(filters);
      loadReport(filters);
    },
    [loadReport],
  );

  const handleClearAllFilters = useCallback(() => {
    setAppliedFilters(EMPTY_REPORT_API_FILTER);
    loadReport(EMPTY_REPORT_API_FILTER);
  }, [loadReport]);

  const refetch = useCallback(() => {
    loadReport(appliedFilters);
  }, [appliedFilters, loadReport]);

  return {
    appliedFilters,
    showFilterModal,
    setShowFilterModal,
    handleApplyFilters,
    handleClearAllFilters,
    refetch,
  };
}
