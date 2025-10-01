import Cities from '@constants/Cities';
import {IntentType, ProductCategory, UserResponse} from '@screens/index';

export type ClientState = {
  clientLoader: boolean;
  clientList: Array<ClientsFilterResponseDatum>;
  cityList: Array<string>;
  basicDetails: BasicDetailsType;
  clientsDetails: ClientsDetailsType;
  firmDetails: FirmDetailsType;
  vendorDetails: VendorDetailsType;
  visitDetails: VisitDetailsType;

  clientFormId: number | undefined;
  masterBankList: Array<{id: number; bank_name: string}>;
  isSavedClientsDetails: boolean;
  isSavedFirmDetails: boolean;
  isSavedVendorDetails: boolean;
  isSavedVisitDetails: boolean;


  basicLoader: boolean;
  clientId: null;


  // SoftSanction Bank Method
  SoftSanctionLoading: boolean;
  SoftSanctionData: Array<IsoftSanctionMethodDatum>;
  SoftSanctionError: string | null;

  // SoftSanction Bank Product
  SoftSanctionBNKPROLoading: boolean;
  SoftSanctionBNKPROData: Array<IsoftSanctionBankProductDatum>;
  SoftSanctionBNKPROError: string | null;

  // FilterBox
  FilterboxLoading: boolean;
  FilterboxData: IFilterResponseDatum | null;
  FilterboxError: string | null;

  // Task Records Filter Box
  TaskRecordsFilterLoading: boolean;
  TaskRecordsFilterData: ITaskReordsFilterResponseDatum | null;
  TaskRecordsFilterError: string | null;

  rulesetLoading: boolean;
  rulesetData: ISoftSanctionRuleset[];
  rulesetError: string | null;

  softSanctionClientLoading: boolean;
  softSanctionClientList: ISoftSanctionClient[];
  softSanctionClientError: string | null;

  softSanctionFields: Record<string, any[]>;
  softSanctionFieldsLoading: boolean;
  softSanctionFieldsError: string | null;

  clientDetails: any | null;
  clientDetailsLoading: boolean;
  clientDetailsError: string | null;

  // Soft Sanction Result
  softSanctionResult: any | null;
  softSanctionResultLoading: boolean;
  softSanctionResultError: string | null;

  // Remark Report fields
  reportLoader: boolean;
  reportList: Array<IRemarkReportResponseDatum>;
  
  // Client-specific Remark Report fields
  clientRemarkReportLoader: boolean;
  clientRemarkReportList: Array<any>;

  // Task History fields
  TaskHistoryLoader: boolean;
  TaskHistoryList: Array<ITaskHistoryResponseDatum>;

  // Generic error field optionally set by reducers like deleteClientFailure
  error: string | null;

};

export type BasicDetailsType = {
  sourceOfLead: string;
  firmName: string;
  location: string;
  state: keyof typeof Cities | undefined;
  city: string;
  pincode: string;
  dateOfVisit: string | undefined;
  address: string;
  programType: string;
  productType: string;
  filedBy: string;
};

export type ClientsDetailsType = Array<{
  key: string;
  id: number | undefined;
  clientType: string;
  nameOfClient: string;
  contactNumber: string;
  email: string;
  createdBy: string;
}>;

export type FirmDetailsType = {
  firmType: string;
  businessVintage: string;
  industry: string;
  sector: string;
  bankName: string[];
  cibilScore: string;
  facilityType: string[];
  annualTurnover: string;
  existingFundingSanctionedAmount: string;
  estimatedFundingRequired: string;
  creditPeriodOffer: string;
  createdBy: string;
};

export type VendorDetailsType = Array<{
  key: string;
  productCategory: ProductCategory | undefined;
  productType: string;
  vendorName: string;
  address: string;
  state: keyof typeof Cities | undefined;
  city: string;
  pinCode: string;
  vendorContactNumber: string;
  vendorContactEmail: string;
  monthlySalesValue: string;
}>;

export type VisitDetailsType = {
  userResponse: UserResponse | undefined;
  intent: IntentType | undefined;
  dateOfNextVisit: string | undefined;
  interestedFor: string;
  reasonForNotInterested: string;
};

export type ClientsDetailsResponseType = {
  statusCode: number;
  data: Array<{
    id: number;
    name_of_client: string;
    client_type: string;
    email: string;
    contact_number: string;
    client: number;
  }>;
  message: string;
};

export type MasterBankResponse = {
  statusCode: number;
  data: Array<{
    id: number;
    bank_name: string;
  }>;
};

export type VendorDetailsPayload = Array<{
  product_category: string;
  product_type: string;
  vendor_name: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  vendor_contact_number: string;
  monthly_sales_value: number;
}>;

export type VisitDetailsPayload =
  | {
      client_response: UserResponse.INTERESTED;
      intent: string;
      date_of_next_visit: string;
      created_by: string;
    }
  | {
      client_response: UserResponse.NOT_INTERESTED;
      reason_for_not_interested: string;
      are_you_interested_for: string;
      created_by: string;
    };

export type ClientsFilterPayload = {
  locations: string[];
  firstNames: string[];
  lastNames: string[];
  sourceOfLead: string[];
};

export type ClientsFilterResponse = {
  statusCode: number;
  data: Array<ClientsFilterResponseDatum>;
};

export type ClientsFilterResponseDatum = {
  id: number;
  source_of_lead: string;
  city: string;
  firm_name: string;
  annual_turnover: number | null;
  sector: null | string;
  existing_funding_sanctioned_amount: number | null;
  estimated_funding_required: number | null;
  created_at: string;
  user: User | null;
  leadProgress: Array<LeadProgress>;
};

export type BasicDetailsPayload = {
  source_of_lead: string;
  created_by: string;
  userId: number;
  date_of_visit: string;
  location: string;
  city: string;
  state: string;
  pin_code: string;
  firm_name: string;
  address: string;
  program_type: string;
  product_type: string;
  clientId?: number;
};

export type BasicDetailsResponse = {
  statusCode: number;
  message: string;
  data: number;
};

export type GetBasicDetailsResponse = {
  statusCode: number;
  data: GetBasicDetailsData;
  message: string;
};

export type GetBasicDetailsData = {
  id: number;
  source_of_lead: string;
  program_type: string;
  product_type: string;
  pin_code: string;
  location: string;
  city: string;
  address: string;
  state: string;
  file_by: string;
  date_of_visit: string;
  firm_name: string;
};

export type ClientsDetailsPayload = Array<{
  client_type: string;
  name_of_client: string;
  contact_number: string;
  email: string;
  created_by: string;
  client_detail_id?: number;
}>;

export type FirmDetailsPayload = {
  firm_type: string;
  business_vintage: string;
  sector: string;
  bank_name: string; // API expects comma-separated string
  cibil_score: number;
  annual_turnover: number;
  facility_type: string; // API expects comma-separated string
  existing_funding_sanctioned_amount: number;
  estimated_funding_required: number;
  credit_period_offer: number;
  created_by: string;
};

export type FirmDetailsResponse = {
  statusCode: number;
  data: FirmDetailsData;
  message: string;
};

export type FirmDetailsData = {
  id: number;
  annual_turnover: number;
  firm_type: string;
  business_vintage: string;
  sector: string;
  bank_name: string | string[]; // Support both string and array for backward compatibility
  cibil_score: number;
  facility_type: string;
  existing_funding_sanctioned_amount: number;
  estimated_funding_required: number;
  credit_period_offer: number;
};

export type VisitDetailsResponse = {
  statusCode: number;
  data: VisitDetailsData;
  message: string;
};

export type VisitDetailsData = {
  id: number;
  client_response: null | UserResponse;
  intent: null | IntentType;
  date_of_next_visit: null | string;
  reason_for_not_interested: null | string;
  are_you_interested_for: null | string;
};

export type VendorDetailsResponse = {
  statusCode: number;
  data: Array<{
    id: number;
    source_of_lead: string;
    program_type: string;
    product_type: string;
    pin_code: string;
    location: string;
    city: string;
    address: string;
    state: string;
    file_by: string;
    date_of_visit: string;
    firm_name: string;
    annual_turnover: number;
    firm_type: string | null;
    business_vintage: string;
    industry: string | null;
    sector: string | null;
    bank_name: string;
    cibil_score: number;
    facility_type: string;
    existing_funding_sanctioned_amount: number;
    estimated_funding_required: number;
    credit_period_offer: number;
    client_response: string;
    intent: string;
    date_of_next_visit: string;
    reason_for_not_interested: string | null;
    are_you_interested_for: string | null;
    created_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
    user: number;
    vendor: VendorDetailsDatum[];
  }>;
  message: string;
};

export type VendorDetailsDatum = {
  id: number;
  product_category: string;
  product_type: string;
  vendor_name: string;
  vendor_address: string;
  vendor_city: string;
  vendor_state: string;
  vendor_pin_code: string;
  vendor_contact_number: string;
  vendor_contact_email: null;
  monthly_sales_value: number;
  client: number;
};

export type LeadProgress = {
  id: number;
  lead_progress_status: string;
};

export type User = {
  id: number;
  first_name: string;
  last_name: string;
};

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

export interface IClientInfoSuccessResponse {
  statusCode: number;
  message: string;
  data: Array<IClientInfoResponseDatum>;
}

export interface IClientInfoResponseDatum {
  reference_details: any;
  annual_turnover: any;
  financier_name: any;
  id: number;
  source_of_lead: string;
  city: string;
  client_name: string;
  firm_name: string;
  bank_name: string;
  estimated_funding_required: number;
  user: {id: number; first_name: string; last_name: string} | null;
  vendor: Array<Vendor>;
}

export interface Vendor {
  id: number;
  monthly_sales_value: number;
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


export interface ISoftSanctionPayload {
  bank_name: string;
  product_name: string;
  method_name: string;
  done_by: string;
}

export interface ISoftSanctionResponse {
  statusCode: number;
  data: IsoftSanctionMethodDatum[];
}

export interface IsoftSanctionMethodDatum {
  id: number;
  method_name: string;
  label: string;
}

export interface IsoftSanctionBankProductResponse {
  statusCode: number;
  data: IsoftSanctionBankProductDatum[];
}

export interface IsoftSanctionBankProductDatum {
  soft_sanction_ruleset_id: string;
  method_name: string;
}

export interface IFilterPayload {
  locations: string[];
  firstNames: string[];
  lastNames: string[];
  sourceOfLead: string[];
}

export interface IFilterResponse {
  statusCode: number;
  data: IFilterResponseDatum[];
}

export interface IFilterResponseDatum {
  id: number;
  source_of_lead: string;
  location: string;
  client_name: string;
  firm_name: string;
  annual_turnover: any;
  bank_name: string;
  estimated_funding_required: number;
  user: any;
}


export interface ISoftSanctionRuleset {
  bank_name: string;
  method_name: string;
  product_name: string;
  rules: {label: string; value: string | null}[];
}

export interface ISoftSanctionRulesetResponse {
  statusCode: number;
  data: ISoftSanctionRuleset[];
}

export interface ISoftSanctionClient {
  id: number;
  location: string;
  client_name: string;
  annual_turnover: string | null;
  estimated_funding_required: number | null;
  credit_period_offer: number | null;
  user: any;
}

export interface ISoftSanctionClientListResponse {
  statusCode: number;
  data: ISoftSanctionClient[];
}

export interface ITaskRecordsFilterPayload {
  task_status: string[];
  assigned_to: string[];
  task_type: string[];
}

export interface ITaskReordsFilterResponse {
  statusCode: number;
  data: ITaskReordsFilterResponseDatum[];
}

export interface ITaskReordsFilterResponseDatum {
  task_type: string;
  task_description: string;
  id: number;
  clien_name: string;
  location: string;
  reference_details: any;
  source_of_lead: string;
}

export interface IDeletePayload {
  deleted_by: string;
}

export interface IDeleteResponse {
  statusCode: number;
  message: string;
}
