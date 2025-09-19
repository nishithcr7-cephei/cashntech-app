export type LeadState = {
  // Lead Progress fields
  leadLoader: boolean;
  leadList: Array<ILeadProgressResponseDatum>;
  leadProgressDetails: any[];
  leadProgressDetailsLoading: boolean;
  leadProgressDetailsError: string | null;
};

export interface ILeadProgressResponse {
  statusCode: number;
  message: string;
  data: Array<ILeadProgressResponseDatum>;
}

export interface ILeadProgressResponseDatum {
  id: number;
  source_of_lead: string;
  city: string;
  file_by: string;
  firm_name: string;
  monthly_turnover: number;
  sector: string;
  estimated_funding_required: number;
  created_at: string;
  leadProgress: Array<{
    id: number;
    lead_progress_status: string;
  }>;
  // Additional fields for compatibility
  client_name?: any;
  bank_name?: any;
  user?: any;
  report?: Array<{id: number; client: number; created_at: string}>;
  lead_progress_status?: string;
  current_status?: string;
  remark?: string;
  turn_around_time?: string;
}

export type User = {
  id: number;
  first_name: string;
  last_name: string;
};

export type LeadProgress = {
  id: number;
  lead_progress_status: string;
  remark: string;
  turn_around_time: number;
  completed_at: string | null;
  created_at: string | null;
  current_status: string;
  done_by: string;
  client: number;
};
