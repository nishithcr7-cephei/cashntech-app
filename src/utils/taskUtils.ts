import { TaskRecordItem } from '@store/mng';

export const getDisplayTask = (tasks: any[] = []) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return null;
  return tasks[0];
};

export const formatDate = (iso?: string | number | Date | null) => {
  if (!iso) return 'N/A';
  
  try {
    // Handle different input types
    let date: Date;
    if (iso instanceof Date) {
      date = iso;
    } else if (typeof iso === 'number') {
      date = new Date(iso);
    } else if (typeof iso === 'string') {
      date = new Date(iso);
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-GB');
  } catch (error) {
    return 'N/A';
  }
};

export const formatMonthYear = (iso?: string | number | Date | null) => {
  if (!iso) return 'N/A';
  
  try {
    // Handle different input types
    let date: Date;
    if (iso instanceof Date) {
      date = iso;
    } else if (typeof iso === 'number') {
      date = new Date(iso);
    } else if (typeof iso === 'string') {
      date = new Date(iso);
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Format as "Sep 2025" (Month Year)
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${month} ${year}`;
  } catch (error) {
    return 'N/A';
  }
};

export const capitalizeFirst = (str?: string | number | null) => {
  if (str === null || str === undefined) return 'N/A';
  
  try {
    const s = String(str).trim();
    if (!s) return 'N/A';
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch (error) {
    return 'N/A';
  }
};

export const isTaskCompleted = (taskStatus?: string | number | null) => {
  if (taskStatus === null || taskStatus === undefined) return false;
  
  try {
    const status = String(taskStatus).trim().toLowerCase();
    return status === 'completed';
  } catch (error) {
    return false;
  }
};

export const formatTaskDescription = (taskDescription?: string | number | null) => {
  return capitalizeFirst(taskDescription);
};

export const formatTaskRemark = (remark?: string | number | null) => {
  if (remark === null || remark === undefined) return 'NA';
  
  try {
    const remarkStr = String(remark).trim();
    return remarkStr ? capitalizeFirst(remarkStr) : 'NA';
  } catch (error) {
    return 'NA';
  }
};

export const formatTaskStatus = (taskStatus?: string | number | null) => {
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
