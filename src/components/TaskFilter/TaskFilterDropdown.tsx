import {FilterDropdown} from '@components/FilterBox/FilterDropdown';
import React, {useState} from 'react';

export const TaskFilterDropdown = ({
  isVisible,
  onClose,
  onApplyFilter,
}: {
  isVisible: boolean;
  onClose: () => void;
  onApplyFilter: (filters: {
    task_status: string[];
    assigned_to: string[];
    task_type: string[];
  }) => void;
}) => {
  const [activeField, setActiveField] = useState<
    'TaskStatus' | 'AssignedTo' | 'TaskType' | null
  >(null);

  const [selectedFilters, setSelectedFilters] = useState({
    task_status: '',
    assigned_to: '',
    task_type: '',
  });

  const getOptions = () => {
    switch (activeField) {
      case 'TaskStatus':
        return ['pending', 'completed', 'cancelled'];
      case 'AssignedTo':
        return ['Miral', 'Piyush', 'Karan'];
      case 'TaskType':
        return ['call', 'visit'];
      default:
        return [];
    }
  };

  const handleApply = () => {
    onApplyFilter({
      task_status: selectedFilters.task_status
        ? [selectedFilters.task_status]
        : [],
      assigned_to: selectedFilters.assigned_to
        ? [selectedFilters.assigned_to]
        : [],
      task_type: selectedFilters.task_type ? [selectedFilters.task_type] : [],
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedFilters({
      task_status: '',
      assigned_to: '',
      task_type: '',
    });
  };

  return (
    <FilterDropdown
      isFilterOpen={isVisible}
      activeFilterField={activeField}
      selectedFilters={{
        location: selectedFilters.task_status,
        initiator: selectedFilters.assigned_to,
        source: selectedFilters.task_type,
      }}
      onSetIsFilterOpen={onClose}
      onSetActiveFilterField={field => {
        const mapping = {
          Location: 'TaskStatus',
          Initiator: 'AssignedTo',
          Source: 'TaskType',
        } as const;
        setActiveField(mapping[field as keyof typeof mapping]);
      }}
      onSetSelectedFilters={filters => {
        setSelectedFilters({
          task_status: filters.location,
          assigned_to: filters.initiator,
          task_type: filters.source,
        });
      }}
      onApply={handleApply}
      onClear={handleClear}
    />
  );
};
