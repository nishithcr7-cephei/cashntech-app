// TaskLog related types moved from client.types.ts

export interface ITaskLogState {
  reportList: Array<IRemarkReportResponseDatum>;
  reportLoader: boolean;
  TaskHistoryLoader: boolean;
  TaskHistoryList: Array<ITaskHistoryResponseDatum>;
  taskRecordsLoader?: boolean;
  taskRecordsList?: Array<any>;
  taskUpdateLoader?: boolean;
  taskUpdateSuccess?: string;
  taskUpdateError?: string;
  userTaskHistoryLoader?: boolean;
  userTaskHistoryList?: Array<any>;
  userTaskHistoryError?: string;
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

export type ITaskRecordsResponse = {
  statusCode: number;
  data: Array<any>;
};

export interface ITaskUpdateRequest {
  task_status: string;
  remark: string;
  completed_at: string; // ISO date string
}

export interface ITaskUpdateResponse {
  statusCode: number;
  message: string;
  data: any;
}

export interface IUserTaskHistoryRequest {
  userName: string;
}

export interface IUserTaskHistoryResponse {
  statusCode: number;
  data: Array<any>;
}
