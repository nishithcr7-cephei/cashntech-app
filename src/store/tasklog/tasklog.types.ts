// TaskLog related types moved from client.types.ts

export interface ITaskLogState {
  reportList: Array<IRemarkReportResponseDatum>;
  reportLoader: boolean;
  TaskHistoryLoader: boolean;
  TaskHistoryList: Array<ITaskHistoryResponseDatum>;
  taskRecordsLoader?: boolean;
  taskRecordsList?: Array<ITaskRecord>;
  taskUpdateLoader?: boolean;
  taskUpdateSuccess?: string;
  taskUpdateError?: string;
  userTaskHistoryLoader?: boolean;
  userTaskHistoryList?: Array<ITaskHistoryItem>;
  userTaskHistoryError?: string;
}

// API Response Types
export interface ITaskRecordsResponse {
  statusCode: number;
  data: Array<ITaskRecord>;
}

export interface ITaskRecord {
  id: number;
  firm_name: string; // Encrypted
  sector: string;
  task: Array<ITaskItem>;
}

export interface ITaskItem {
  id: number;
  assigned_by: string;
  assigned_to: string;
  assigned_at: string; // ISO date string
  task_type: string;
  task_description: string;
  task_status: 'pending' | 'completed' | 'cancelled';
  remark: string | null;
  completed_at: string | null; // ISO date string
}

// Task History API Response
export interface IUserTaskHistoryResponse {
  statusCode: number;
  data: Array<ITaskHistoryItem>;
}

export interface ITaskHistoryItem {
  id: number;
  assigned_by: string;
  assigned_to: string;
  assigned_at: string; // ISO date string
  task_type: string;
  task_description: string;
  task_status: 'pending' | 'completed' | 'cancelled';
  remark: string | null;
  completed_at: string | null; // ISO date string
  client: number;
  firm_name: string; // Encrypted
}

// UI Display Types (processed data for components)
export interface ITaskDisplayItem {
  id: number;
  srNo: number;
  firmName: string; // Decrypted and formatted
  sector: string;
  assignedBy: string;
  assignedTo: string;
  taskDescription: string;
  taskStatus: string;
  remarks: string; // Will be 'N/A' if null
  createdAt: string; // Formatted as "Mon YYYY"
  completedAt: string; // Formatted as "dd-mm-yyyy" or 'N/A'
  // Legacy fields for compatibility
  tasktype: string;
  clientId: string;
  clientName: string;
  salesman: string;
  location: string;
  referenceDetails: string;
  sourceDHCO: string;
  status: 'Warm' | 'Hot' | 'Cold';
  raw: ITaskItem | ITaskHistoryItem; // Original API data
}
export interface IRemarkReportResponse {
  statusCode: number;
  message: string;
  data: Array<IRemarkReportResponseDatum>;
}

export interface IRemarkReportResponseDatum {
  id: number;
  client_name: string;
  user: null;
  task: Array<Task>;
}

export interface Task {
  id: number;
  task_type: string;
  task_description: string;
  task_status: string;
  remark: null;
  completed_at: null;
}

export interface ITaskHistoryResponse {
  statusCode: number;
  message: string;
  data: Array<ITaskHistoryResponseDatum>;
}

export interface ITaskHistoryResponseDatum {
  id: number;
  assigned_by: string;
  assigned_to: string;
  client_name: string;
  assigned_at: string;
  task_type: string;
  task_description: string;
  task_status: string;
  remark: null;
  completed_at: null;
  client: number;
}

export type ITaskRecordsRequest = {
  hasTask: boolean;
};
export interface ITaskUpdateRequest {
  task_status: string;
  remark: string;
  completed_at: string; // ISO date string
}

export interface ITaskUpdateResponse {
  statusCode: number;
  message: string;
  data: {
    id: number;
    task_status: string;
    remark: string;
    completed_at: string;
  };
}

export interface IUserTaskHistoryRequest {
  userName: string;
}
