import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as mngActions from '@store/mng';
import { mngSelector, TaskRecordItem } from '@store/mng';
import { decryptLocation } from '@utils/crypto';

export const useManageTaskFilters = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [enabledFilters, setEnabledFilters] = useState({
    taskType: false,
    salesman: false,
    status: false,
  });
  const [selectedFilters, setSelectedFilters] = useState({
    taskTypes: [] as string[],
    salesman: '',
    statuses: [] as string[],
  });
  const [taskTypeOptions, setTaskTypeOptions] = useState<{label: string; value: string}[]>([]);
  const [salesmanOptions, setSalesmanOptions] = useState<{label: string; value: string}[]>([]);
  const [statusOptions, setStatusOptions] = useState<{label: string; value: string}[]>([]);

  const dispatch = useDispatch();
  const taskRecordsList = useSelector(mngSelector.getTaskRecordsList);
  const salesmanList = useSelector(mngSelector.getSalesmanList);

  const fetchSalesmen = () => {
    dispatch(mngActions.getSalesmanList());
  };

  const toggleTaskType = (type: string) => {
    setSelectedFilters(prev => {
      const normalized = type.toLowerCase();
      const has = prev.taskTypes.includes(normalized);
      const next = has
        ? prev.taskTypes.filter(t => t !== normalized)
        : [...prev.taskTypes, normalized];
      return {...prev, taskTypes: next};
    });
  };

  const toggleStatus = (status: string) => {
    setSelectedFilters(prev => {
      const normalized = status.toLowerCase();
      const has = prev.statuses.includes(normalized);
      const next = has
        ? prev.statuses.filter(s => s !== normalized)
        : [...prev.statuses, normalized];
      return {...prev, statuses: next};
    });
  };

  const clearFilters = () => {
    setEnabledFilters({taskType: false, salesman: false, status: false});
    setSelectedFilters({taskTypes: [], salesman: '', statuses: []});
    dispatch(mngActions.setFilteredTaskRecords({filteredRecords: taskRecordsList}));
    setIsFilterOpen(false);
  };

  const applyFilters = async () => {
    try {
      const localPayload: any = { hasTask: true };
      if (selectedFilters.taskTypes.length > 0) {
        localPayload.byTaskType = { task_type: selectedFilters.taskTypes };
      }
      if (selectedFilters.salesman) {
        localPayload.bySalesman = { assigned_to: [selectedFilters.salesman] };
      }
      if (selectedFilters.statuses.length > 0) {
        localPayload.byStatus = { task_status: selectedFilters.statuses };
      }
      dispatch(mngActions.getTaskRecordsList(localPayload));
    } catch (e) {
      dispatch(mngActions.setFilteredTaskRecords({filteredRecords: []}));
    } finally {
      setIsFilterOpen(false);
    }
  };

  // Build filter options whenever data or panel opens
  useEffect(() => {
    if (!isFilterOpen) return;
    const ttypes = new Set<string>();
    const statuses = new Set<string>();
    (taskRecordsList || []).forEach((r: TaskRecordItem) => {
      (r.task || []).forEach((t: any) => {
        if (t?.task_type) ttypes.add(t.task_type);
        if (t?.task_status) statuses.add(t.task_status);
      });
    });
    setTaskTypeOptions(Array.from(ttypes).map(s => ({label: s, value: s})));
    setStatusOptions(Array.from(statuses).map(s => ({label: s, value: s})));
    fetchSalesmen();
  }, [isFilterOpen, taskRecordsList]);

  // Update salesman options when salesman list changes
  useEffect(() => {
    if (salesmanList && salesmanList.length > 0) {
      const names: string[] = salesmanList
        .map((item: any) => `${item.first_name || ''} ${item.last_name || ''}`.trim())
        .filter(Boolean);
      const uniqueNames = Array.from(new Set(names));
      const options = uniqueNames.map(name => ({label: name, value: name}));
      setSalesmanOptions(options);
    }
  }, [salesmanList]);

  return {
    isFilterOpen,
    setIsFilterOpen,
    enabledFilters,
    setEnabledFilters,
    selectedFilters,
    setSelectedFilters,
    taskTypeOptions,
    salesmanOptions,
    statusOptions,
    toggleTaskType,
    toggleStatus,
    clearFilters,
    applyFilters,
  };
};

export const useTaskSearch = () => {
  const dispatch = useDispatch();
  const taskRecordsList = useSelector(mngSelector.getTaskRecordsList);

  const handleSearch = (searchText: string) => {
    if (!searchText) {
      dispatch(mngActions.setFilteredTaskRecords({filteredRecords: taskRecordsList}));
    } else {
      const term = searchText.toLowerCase();
      const filtered = taskRecordsList.filter((it: TaskRecordItem) => {
        const firm = decryptLocation(it.firm_name || '').toLowerCase();
        const user = it.user ? `${it.user.first_name || ''} ${it.user.last_name || ''}`.trim().toLowerCase() : '';
        const taskTypes = (it.task || []).map((t: any) => (t.task_type || '').toLowerCase()).join(' ');
        const statuses = (it.task || []).map((t: any) => (t.task_status || '').toLowerCase()).join(' ');
        return (
          firm.includes(term) ||
          user.includes(term) ||
          taskTypes.includes(term) ||
          statuses.includes(term)
        );
      });
      dispatch(mngActions.setFilteredTaskRecords({filteredRecords: filtered}));
    }
  };

  return { handleSearch };
};
