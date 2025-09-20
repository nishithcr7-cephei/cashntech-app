export interface IClientProfileResponse {
  statusCode: number;
  data: IClientProfileData;
}

export interface IClientProfileData {
  id: number;
  source_of_lead: string;
  file_by: string;
  firm_name: string;
  personalKyc: IPersonalKycDocument[];
  logs: IClientProfileLog[];
}

export interface IClientProfileLog {
  id: number;
  action_by: string;
  action_time: string;
  client: number;
}

export interface ISoftSanctionResponse {
  data: {
    data: ISoftSanctionData[];
    statusCode: number;
  };
}

export interface ISoftSanctionData {
  id: number;
  client: number;
  bank_name: string;
  method_name: string;
  product_name: string;
  results: Record<string, number>;
  done_by: string | null;
  done_at: string;
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
  };
  uploaded_at: string;
}

export type ProfileState = {
  clientProfile: IClientProfileData | null;
  clientProfileLoading: boolean;
  clientProfileError: string | null;
  softSanctionData: ISoftSanctionData[] | null;
  softSanctionLoading: boolean;
  softSanctionError: string | null;
  kycDocumentsData: IKycDocumentsData | null;
  kycDocumentsLoading: boolean;
  kycDocumentsError: string | null;
};
