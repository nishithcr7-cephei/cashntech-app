export type VisitState = {
  visitLoader: boolean;
  visitDetailsList: VisitDetailsItem[];
  visitDetailsError: string | null;
  
  salesmanLoader: boolean;
  salesmanList: SalesmanItem[];
  salesmanError: string | null;
  
  locationsLoader: boolean;
  locationsList: LocationItem[];
  locationsError: string | null;
  
  saveVisitLoader: boolean;
  saveVisitError: string | null;
};

export type VisitDetailsItem = {
  id: number;
  visit_date_time?: string;
  salesperson?: string;
  client_firm_name?: string;
  visit_type?: string;
  visit_number?: number;
  visit_remark?: string;
  sector?: string | null;
  client?: {
    id?: number;
    source_of_lead?: string;
    city?: string;
    sector?: string | null;
    created_at?: string;
  };
};

export type SalesmanItem = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

export type LocationItem = {
  id: number;
  city: string;
  state: string;
};

export type IVisitPayload = {
  client_response: string;
  intent: string;
  date_of_next_visit: string;
  reason_for_not_interested: string;
  are_you_interested_for: string;
  created_by?: string;
  isSubmitted?: boolean;
  responseId?: number;
};

export type IvisitResponse = {
  statusCode: number;
  message: string;
};
