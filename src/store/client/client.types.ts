import Cities from '@constants/Cities';
import {
  BasicDetailsNames,
  ClientFirmNames,
  VendorNames,
  VisitNames,
} from '@screens/CreateClientForm/CreateClientForm.type';

export type ClientState = {
  clientLoader: boolean;
  clientList: Array<IClientInfoResponseDatum>;
  basicDetails: BasicDetailsType;
  clientsDetails: ClientsDetailsType;

  clientFormId: number | undefined;
  isSavedClientsDetails: boolean;

  reportLoader: boolean;
  reportList: Array<IRemarkReportResponseDatum>;

  leadLoader: boolean;
  leadList: Array<ILeadProgressResponseDatum>;

  TaskHistoryLoader: boolean;
  TaskHistoryList: Array<ITaskHistoryResponseDatum>;

  basicLoader: boolean;
  clientId: null;

  // KYC Upload
  loading: boolean;
  data: IUploadKycDocumentResponse | null;
  error: string | null;

  // PAN Upload
  panLoading: boolean;
  panData: IUploadPanDocumentsResponse | null;
  panError: string | null;

  // Aadhar Upload
  adharLoading: boolean;
  adharData: IUploadAdharDocumentResponse | null;
  adharError: string | null;

  // Residence Upload
  residenceLoading: boolean;
  residenceData: IUploadResidenceDetailsResponse | null;
  residenceError: string | null;

  // Udhyam Upload
  udhyamLoading: boolean;
  udhyamData: IUploadUdhyamResponse | null;
  udhyamError: string | null;

  // Gst Upload
  gstDocLoading: boolean;
  gstDocData: IUploadGstResponse | null;
  gtsDocError: string | null;

  // GoDown Upload
  goDownLoading: boolean;
  goDownData: IUploadGodDownDetailsResponse | null;
  goDownError: string | null;

  // Shareholding Upload
  ShareholdingLoading: boolean;
  ShareholdingData: IUploadShareholdingResponse | null;
  ShareholdingError: string | null;

  // CompanyPan Upload
  CompanyPanLoading: boolean;
  CompanyPanData: IuplaodCompanyPanResponse | null;
  CompanyPanError: string | null;

  // CompanyInfo Upload
  CompanyInfoLoading: boolean;
  CompanyInfoData: IUploadCompanyInfoResponse | null;
  CompanyInfoError: string | null;

  // Bank List
  BankLoader: boolean;
  BankList: Array<IBankListResponseDatum>;

  // Kyc Checked Mark
  KycCheckedLoader: boolean;
  kycCheckedList: Array<IKycCheckedResponseDatum>;
  // Kyc Bussiness Checekd Mark
  KycBusinessLoader: boolean;
  KycBusinessList: Array<IKycBusinessResponseDatum>;

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

  // Bank Statement
  BankStatementLoading: boolean;
  BankStatementData: BankStatementDocument | null;
  BankStatementError: string | null;
  clientDetails: any | null;
  clientDetailsLoading: boolean;
  clientDetailsError: string | null;
  leadProgressDetails: any[];
  leadProgressDetailsLoading: boolean;
  leadProgressDetailsError: string | null;
};

export type BasicDetailsType = {
  sourceOfLead: string;
  firmName: string;
  location: string;
  state: keyof typeof Cities | undefined;
  city: string;
  dateOfVisit: Date | undefined;
  address: string;
  programType: string;
  productType: string;
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

export interface ClientsDetailsResponseType {
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
}

export type ClientFormPayload =
  | {
      formName: 'BasicDetails';
      name: BasicDetailsNames;
      value: string;
    }
  | {
      formName: 'ClientFirmScreen';
      name: ClientFirmNames;
      value: string | string[];
    }
  | {
      formName: 'VendorScreen';
      name: VendorNames;
      value: string;
    }
  | {
      formName: 'VisitScreen';
      name: VisitNames;
      value: string;
    };

export interface IClientInfoSuccessResponse {
  statusCode: number;
  message: string;
  data: Array<IClientInfoResponseDatum>;
}

export interface IClientInfoResponseDatum {
  reference_details: any;
  monthly_turnover: any;
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

export interface ILeadProgressResponse {
  statusCode: number;
  message: string;
  data: Array<ILeadProgressResponseDatum>;
}

export interface ILeadProgressResponseDatum {
  id: number;
  source_of_lead: string;
  city: string;
  client_name: any;
  monthly_turnover: any;
  bank_name: any;
  estimated_funding_required: any;
  created_at: string;
  user: any;
  report: Array<{id: number; client: number; created_at: string}>;
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

export type IBasicDetailsPayload = {
  source_of_lead: string;
  created_by: string;
  userId: number;
  date_of_visit: string;
  location: string;
  city: string;
  state: string;
  firm_name: string;
  address: string;
  program_type: string;
  product_type: string;
  clientId?: number;
};

export type IBasicDetailsResponse = {
  statusCode: number;
  message: string;
  data: number;
};

export type IClientsDetailsPayload = Array<{
  client_type: string;
  name_of_client: string;
  contact_number: string;
  email: string;
  created_by: string;
  client_detail_id?: number;
}>;

export type IvendorPayload = {
  product_category: string;
  product_type: string;
  vendor_name: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  vendor_contact_number: string;
  monthly_sales_value: number;
};

export type IVendorResponse = {
  statusCode: number;
  message: string;
  data: IVendorResponseDatum[];
};

export type IVendorResponseDatum = {
  id: number;
  product_category: string;
  product_type: string;
  vendor_name: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  vendor_contact_number: string;
  monthly_sales_value: number;
  client: Client;
};

export type Client = {
  id: number;
  source_of_lead: string;
  location: string;
  city: string;
  state: string;
  type_of_visit: string;
  visit: number;
  date_of_visit: string;
  client_name: string;
  firm_name: string;
  monthly_turnover: any;
  contact_number: string;
  firm_type: string;
  business_vintage: string;
  sector: string;
  bank_name: string;
  cibil_score: number;
  facility_type: string;
  existing_funding_sanctioned_amount: number;
  estimated_funding_required: number;
  credit_period_offer: number;
  client_response: any;
  intent: any;
  date_of_next_visit: any;
  reason_for_not_interested: any;
  are_you_interested_for: any;
  created_at: string;
  deleted_at: any;
  user: any;
  kyc: any;
};

export type IVisitPayload = {
  client_response: string;
  intent: string;
  date_of_next_visit: string;
  reason_for_not_interested: string;
  are_you_interested_for: string;
};

export type IvisitResponse = {
  statusCode: number;
  message: string;
};

export interface IUploadKycDocumentPayload {
  doc: {
    uri: string;
    type: string;
    name: string;
  };
  clientId: number;
  uploaded_by: string;
  params: string;
  client_name: string;
}

export interface IUploadKycDocumentResponse {
  status: boolean;
  message: string;
  data: {
    document_url: string;
  };
}

export interface IUploadPanDocumentsPayload {
  clientId: number;
  uploaded_by: string;
  doc: {
    name_as_per_pan: string;
    pan_number: string;
    dob: string;
  }[];
  files: {
    uri: string;
    type: string;
    name: string;
  }[];
}

export interface IUploadPanDocumentsResponse {
  status: boolean;
  message: string;
  data: any;
}

export interface IUploadAdharDocumnetsPayload {
  clientId: number;
  uploaded_by: string;
  doc: {
    name_as_per_aadhar: string;
    aadhar_number: string;
  }[];
  files: {
    uri: string;
    type: string;
    name: string;
  }[];
}

export interface IUploadAdharDocumentResponse {
  status: boolean;
  message: string;
  data: any;
}

export interface IUploadResidenceDetailsPayload {
  doc: {
    uri: string | null;
    type: string | null;
    name: string | null;
  };
  clientId: number;
  uploaded_by: string;
  params: string;
  client_name: string;
  name_of_owner: string;
  ownership_status: string;
}

export interface IUploadResidenceDetailsResponse {
  status: boolean;
  message: string;
  data: {
    document_url: string;
  };
}

export interface IUploadUdhyamPayload {
  doc: {
    uri: string;
    type: string;
    name: string;
  }[];
  clientId: number;
  uploaded_by: string;
  docDetails: {
    name_as_per_udhyam: string;
    urn_number: string;
  };
}

export interface IUploadUdhyamResponse {
  status: boolean;
  message: string;
  data: {
    document_urls: {
      url: string;
      name: string;
    }[];
    docDetails: {
      name_as_per_udhyam: string;
      urn_number: string;
    };
  };
}

export interface IUploadGstPayload {
  doc: {
    uri: string;
    type: string;
    name: string;
  };
  clientId: number;
  uploaded_by: string;
  name_as_per_gst: string;
  gst_number: string;
  params: string;
}

export interface IUploadGstResponse {
  status: boolean;
  message: string;
  data: {
    document_urls: {
      url: string;
      name: string;
    }[];
    docDetails: {
      name_as_per_gst: string;
      gst_number: string;
    };
  };
}

export interface IUploadGoDownDetailsPayload {
  doc: {
    uri: string | null;
    type: string | null;
    name: string | null;
  };
  clientId: number;
  uploaded_by: string;
  params: string;
  client_name: string;
  name_of_owner: string;
  ownership_status: string;
}

export interface IUploadGodDownDetailsResponse {
  status: boolean;
  message: string;
  data: {
    document_url: string;
  };
}

export interface IUploadShareholdingPayload {
  doc: {
    uri: string;
    type: string;
    name: string;
  };
  clientId: number;
  uploaded_by: string;
  params: string;
  client_name: string;
}

export interface IUploadShareholdingResponse {
  status: boolean;
  messsage: string;
  data: {
    document_url: string;
  };
}

export interface IuploadCompanyPanPayload {
  doc: {
    uri: string;
    type: string;
    name: string;
  }[];
  clientId: number;
  uploaded_by: string;
  docDetails: {
    name_as_per_pan: string;
    pan_number: string;
  };
}

export interface IuplaodCompanyPanResponse {
  status: boolean;
  message: string;
  data: {
    document_urls: {
      url: string;
      name: string;
    }[];
    docDetails: {
      name_as_per_pan: string;
      pan_number: string;
    };
  };
}

export interface IUploadCompanyInfoPayload {
  clientId: number;
  uploaded_by: string;
  doc: {
    uri: string;
    type: string;
    name: string;
  }[];
}

export interface IUploadCompanyInfoResponse {
  status: boolean;
  message: string;
  data: {
    uploaded_urls: {
      url: string;
      name: string;
    }[];
  };
}

export interface IBankListResponse {
  statusCode: number;
  data: IBankListResponseDatum[];
}

export interface IBankListResponseDatum {
  id: number;
  bank_name: string;
}

export interface IKycCheckedResponse {
  statusCode: number;
  data: IKycCheckedResponseDatum[];
}
export interface IKycCheckedResponseDatum {
  document_id: number;
  document_type: string;
}

export interface IKYCBusinessResponse {
  statusCode: number;
  data: IKycBusinessResponseDatum[];
}

export interface IKycBusinessResponseDatum {
  document_type: string;
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
  monthly_turnover: any;
  bank_name: string;
  estimated_funding_required: number;
  user: any;
}

export interface IBankStatementPayload {
  clientId: number;
  uploaded_by: string;
  doc: BankStatementDocument[];
  files: File[];
}

export type BankStatementDocument = {
  account_number: string;
  statement_duration: string;
  bank_name: string;
  acount_type: string;
  statement_from: string;
  statement_to: string;
};

export interface IBankStatementResponse {
  success: boolean;
  message: string;
  data?: any;
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
  monthly_turnover: string | null;
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
