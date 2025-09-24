// KYC Upload Types

export type User = {
  id: number;
  first_name: string;
  last_name: string;
};

export type LeadProgress = {
  id: number;
  lead_progress_status: string;
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
  clientId: number;
  uploaded_by: string;
  name_as_per_udhyam: string;
  urn_number: string;
  params: string;
  doc: {
    uri: string;
    type: string;
    name: string;
  } | null;
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

// Bank List Types
export interface IBankListResponse {
  statusCode: number;
  data: IBankListResponseDatum[];
}

export interface IBankListResponseDatum {
  id: number;
  bank_name: string;
}

// KYC Checked Types
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
  data: string[]; // Changed from IKycBusinessResponseDatum[] to string[]
}

export interface IKycBusinessResponseDatum {
  document_type: string;
}

// Bank Statement Types
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

// Bank Statement Info Types
export interface IBankStatementInfoResponse {
  statusCode: number;
  data: IBankStatementInfoData[];
}

export interface IBankStatementInfoData {
  id: number;
  bank_name: string;
}

// Individual Bank Statement Detail Types
export interface IBankStatementDetailResponse {
  statusCode: number;
  data: IBankStatementDetailData;
}

export interface IBankStatementDetailData {
  id: number;
  bank_name: string;
  account_number: string;
  acount_type: string;
  statement_duration: string;
  statement_from: string;
  statement_to: string;
  statement_file_names: string[];
  bank_statement_verfication_status: string;
}

// KYC Documents Response Types
export interface IKycDocumentsResponse {
  statusCode: number;
  data: IKycDocumentsData[];
}

export interface IKycDocumentsData {
  id: number;
  bankStatement: IBankStatementDocument[];
  business: IBusinessDocument[];
  personalKyc: IPersonalKycDocument[];
}

export interface IBankStatementDocument {
  id: number;
  bank_name: string;
  statement_file_names: string[];
  uploaded_at: string;
}

export interface IBusinessDocument {
  id: number;
  filename_obj: {
    udhyam?: {
      file_name: string;
      urn_number: string;
      name_as_per_udhyam: string;
    };
  };
  uploaded_at: string;
}

export interface IPersonalKycDocument {
  id: number;
  document_type: string;
  filename_obj: {
    profile?: {
      file_name: string;
      client_name: string;
    };
    pan?: {
      dob: string;
      file_name: string;
      pan_number: string;
      name_as_per_pan: string;
    };
    aadhar?: {
      aadhar_front_filename: string;
      aadhar_back_filename: string;
      name_as_per_aadhar: string;
      aadhar_number: string;
    };
    residence?: {
      filename: string;
      name_of_owner: string;
      ownership_status: string;
    };
  };
  uploaded_at: string;
}

// KYC State Type
export type KycState = {
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
  KycBusinessList: string[];

  // Bank Statement
  BankStatementLoading: boolean;
  BankStatementData: BankStatementDocument | null;
  BankStatementError: string | null;

  // Bank Statement Info
  BankStatementInfoLoading: boolean;
  BankStatementInfoData: IBankStatementInfoData[];
  BankStatementInfoError: string | null;

  // Individual Bank Statement Detail
  BankStatementDetailLoading: boolean;
  BankStatementDetailData: IBankStatementDetailData | null;
  BankStatementDetailError: string | null;

  // KYC Documents
  kycDocumentsLoading: boolean;
  kycDocumentsData: IKycDocumentsData | null;
  kycDocumentsError: string | null;
  kycClientList: Array<IKycClientListResponseDatum>;
  
  // KYC Details
  kycDetailsLoading: boolean;
  kycDetailsData: Array<IKycDetailsResponseDatum>;
  kycDetailsError: string | null;
  
  // Personal KYC Documents
  personalKycLoading: boolean;
  personalKycData: Array<IPersonalKycDocument>;
  personalKycError: string | null;
};

export type IKycClientListResponseDatum = {
  id: number;
  source_of_lead: string;
  city: string;
  firm_name: string;
  monthly_turnover: number | null;
  sector: null | string;
  existing_funding_sanctioned_amount: number | null;
  estimated_funding_required: number | null;
  created_at: string;
  user: User | null;
  leadProgress: Array<LeadProgress>;
};

// KYC Details API Types
export interface IKycDetailsPayload {
  byIntent: {
    intent: string[];
  };
}

export interface IKycDetailsResponse {
  statusCode: number;
  data: IKycDetailsResponseDatum[];
}

export interface IKycDetailsResponseDatum {
  clientId: number;
  firm_name: string;
  city: string;
  created_at: string;
  file_by: string;
  source_of_lead: string;
  bank_name: string | null;
  monthly_turnover: number | null;
  intent: string | null;
  sector: string | null;
  status: string;
}

// Personal KYC Document Types
export interface IGetPersonalKycPayload {
  clientId: string;
  docType: string;
}

export interface IGetPersonalKycResponse {
  statusCode: number;
  data: IPersonalKycDocument[];
}

export interface IPersonalKycDocument {
  id: number;
  document_type: string;
  filename_obj: {
    profile?: {
      file_name: string;
      client_name: string;
    };
    pan?: {
      dob: string;
      file_name: string;
      pan_number: string;
      name_as_per_pan: string;
    };
    aadhar?: {
      aadhar_front_filename: string;
      aadhar_back_filename: string;
      name_as_per_aadhar: string;
      aadhar_number: string;
    };
    residence?: {
      filename: string;
      name_of_owner: string;
      ownership_status: string;
    };
  };
  uploaded_at: string;
}