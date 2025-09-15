import { TaskRecordItem } from '@store/mng';

export const getDisplayTask = (tasks: any[] = []) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return null;
  return tasks[0];
};

export const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB') : 'N/A');

export const capitalizeFirst = (str?: string) => {
  const s = (str || '').toString().trim();
  if (!s) return 'N/A';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const isTaskCompleted = (taskStatus?: string) => {
  return (taskStatus || '').toString().trim().toLowerCase() === 'completed';
};

export const formatTaskDescription = (taskDescription?: string) => {
  return capitalizeFirst(taskDescription);
};

export const formatTaskRemark = (remark?: string | null) => {
  return remark && String(remark).trim() ? capitalizeFirst(remark) : 'NA';
};

export const formatTaskStatus = (taskStatus?: string) => {
  return capitalizeFirst(taskStatus);
};

export const buildFilterOptions = (taskRecordsList: TaskRecordItem[]) => {
  const taskTypes = new Set<string>();
  const statuses = new Set<string>();
  
  (taskRecordsList || []).forEach((r: TaskRecordItem) => {
    (r.task || []).forEach((t: any) => {
      if (t?.task_type) taskTypes.add(t.task_type);
      if (t?.task_status) statuses.add(t.task_status);
    });
  });
  
  return {
    taskTypeOptions: Array.from(taskTypes).map(s => ({label: s, value: s})),
    statusOptions: Array.from(statuses).map(s => ({label: s, value: s})),
  };
};

export const buildSalesmanOptions = (salesmanList: any[]) => {
  if (!salesmanList || salesmanList.length === 0) return [];
  
  const names: string[] = salesmanList
    .map((item: any) => `${item.first_name || ''} ${item.last_name || ''}`.trim())
    .filter(Boolean);
  const uniqueNames = Array.from(new Set(names));
  return uniqueNames.map(name => ({label: name, value: name}));
};
