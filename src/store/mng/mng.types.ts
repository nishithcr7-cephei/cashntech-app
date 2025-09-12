// ManageTask related types
export interface MngState {
  // Task Records
  taskRecordsLoading: boolean;
  taskRecordsList: Array<TaskRecordItem>;
  taskRecordsError: string | null;

  // Salesman List
  salesmanLoading: boolean;
  salesmanList: Array<SalesmanItem>;
  salesmanError: string | null;

  // Filtered Task Records
  filteredTaskRecords: Array<TaskRecordItem>;
}

export interface TaskRecordItem {
  id: number;
  firm_name?: string;
  user?: { 
    first_name?: string; 
    last_name?: string; 
  };
  task?: Array<{
    id?: number;
    task_type?: string;
    task_description?: string;
    task_status?: string;
    remark?: string;
    completed_at?: string;
    assigned_to?: string;
  }>;
  sector?: string | null;
  assigned_to?: string;
}

export interface SalesmanItem {
  id: number;
  first_name: string;
  last_name: string;
}

export interface TaskRecordsListPayload {
  hasTask?: boolean;
  byTaskType?: {
    task_type: string[];
  };
  bySalesman?: {
    assigned_to: string[];
  };
  byStatus?: {
    task_status: string[];
  };
}

export interface TaskRecordsListResponse {
  statusCode: number;
  message: string;
  data: Array<TaskRecordItem>;
}

export interface SalesmanListResponse {
  statusCode: number;
  message: string;
  data: Array<SalesmanItem>;
}

// Action payload types
export interface SetTaskRecordsListPayload {
  taskRecords: Array<TaskRecordItem>;
}

export interface SetSalesmanListPayload {
  salesmanList: Array<SalesmanItem>;
}

export interface SetFilteredTaskRecordsPayload {
  filteredRecords: Array<TaskRecordItem>;
}

export interface SetErrorPayload {
  error: string;
}
