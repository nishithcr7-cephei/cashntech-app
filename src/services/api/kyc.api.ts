import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
// KYC Types
import {
  IBankListResponse,
  IKycCheckedResponse,
  IKYCBusinessResponse,
  IBankStatementPayload,
  IKycDetailsPayload,
  IKycDetailsResponse,
  IGetPersonalKycPayload,
  IGetPersonalKycResponse,
} from '@store/kyc';
import {CustomRequestConfig} from './api';

// KYC Document Upload APIs
const uploadKycDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiKycProfilePic, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }

  return {
    data: data.data,
    error: null,
  };
};

const uploadPanDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiKycPanUpload, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }

  return {
    data: data.data,
    error: null,
  };
};

const uploadAadharDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiKycAadharUpload, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }

  return {
    data: data.data,
    error: null,
  };
};

const uploadResidenceDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiKycResidenceDetail, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }

  return {
    data: data.data,
    error: null,
  };
};

const uploadUdhyamDocument = async (FormData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiUdhyamCertificate, FormData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

const uploadGstDocument = async (FormData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiGstDocument, FormData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

const uploadGoDownDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiGodownDetails, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }

  return {
    data: data.data,
    error: null,
  };
};

const uploadShareholdingDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiShareholding, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }

  return {
    data: data.data,
    error: null,
  };
};

const uploadCompanyPanDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiCompanyPanDetails, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }

  return {
    data: data.data,
    error: null,
  };
};

const uploadCopmanyInfoDocument = async (formData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiCompanyInformation, formData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );

  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

// KYC Data APIs
const getBankList = async () => {
  const {data, error} = await tryCatch<AxiosResponse<IBankListResponse>>(
    Api.get(Endpoints.apiBankList, {authRequired: true} as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

const getKycChecked = async (clientID: string) => {
  const {data, error} = await tryCatch<AxiosResponse<IKycCheckedResponse>>(
    Api.get(Endpoints.apiGetKycChecked(clientID), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

const getBusinessKycChecked = async (clientID: string) => {
  const {data, error} = await tryCatch<AxiosResponse<IKYCBusinessResponse>>(
    Api.get(Endpoints.apiGetBusinessKycChecked(clientID), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

const bankStatement = async (FormData: FormData) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiBankStatement, FormData, {
      isFormData: true,
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

const getKycClients = async (clientId: number) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(Endpoints.apiGetKycDocuments(clientId.toString()), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  return {
    data: data.data,
    error: null,
  };
};

const getKycDetails = async (payload: IKycDetailsPayload) => {
  console.log('KYC API: Making request to:', Endpoints.apiGetKycDetails);
  console.log('KYC API: Payload:', payload);
  
  const {data, error} = await tryCatch<AxiosResponse<IKycDetailsResponse>>(
    Api.post(Endpoints.apiGetKycDetails, payload, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  console.log('KYC API: Raw response:', {data, error});
  
  if (error) {
    console.log('KYC API: Error occurred:', error);
    return {
      data: null,
      error: error,
    };
  }
  
  console.log('KYC API: Success - returning data:', data.data.data);
  return {
    data: data.data.data,
    error: null,
  };
};

const getPersonalKycDocuments = async (payload: IGetPersonalKycPayload) => {
  const {data, error} = await tryCatch<AxiosResponse<IGetPersonalKycResponse>>(
    Api.get(Endpoints.apiGetPersonalDocs(payload.clientId, payload.docType), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  
  return {
    data: data.data.data,
    error: null,
  };
};

const getBusinessKycDocuments = async (payload: IGetPersonalKycPayload) => {
  console.log('🏢🏢🏢 BUSINESS KYC API CALLED - NOT PERSONAL KYC 🏢🏢🏢');
  
  // Direct endpoint construction to ensure it's correct
  const directEndpoint = `/client-info-master/business-kyc/${payload.clientId}?doc_type=${payload.docType}`;
  console.log('🏢 Direct endpoint:', directEndpoint);
  
  const endpointFromConstant = Endpoints.apiGetBusinessDocs(payload.clientId, payload.docType);
  console.log('🏢 Endpoint from constant:', endpointFromConstant);
  
  console.log('🏢 Business KYC API: Payload:', payload);
  
  const {data, error} = await tryCatch<AxiosResponse<IGetPersonalKycResponse>>(
    Api.get(directEndpoint, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  console.log('🏢 Business KYC API: Raw response:', {data, error});
  
  if (error) {
    console.log('🏢 Business KYC API: Error occurred:', error);
    return {
      data: null,
      error: error,
    };
  }
  
  console.log('🏢 Business KYC API: Returning data:', data.data.data);
  return {
    data: data.data.data,
    error: null,
  };
};

const getBankStatementInfo = async (clientId: string) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(Endpoints.apiGetBankStatementInfo(clientId), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  
  // Extract the data array from the response
  const responseData = data.data?.data || [];
  
  return {
    data: responseData,
    error: null,
  };
};

const getBankStatementDetail = async (bankId: string) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(Endpoints.apiGetBankStatementDetail(bankId), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  
  // Extract the data from the response
  const responseData = data.data?.data || null;
  
  return {
    data: responseData,
    error: null,
  };
};

export default {
  // Document Upload APIs
  uploadKycDocument,
  uploadPanDocument,
  uploadAadharDocument,
  uploadResidenceDocument,
  uploadUdhyamDocument,
  uploadGstDocument,
  uploadGoDownDocument,
  uploadShareholdingDocument,
  uploadCompanyPanDocument,
  uploadCopmanyInfoDocument,
  
  // KYC Data APIs
  getBankList,
  getKycChecked,
  getBusinessKycChecked,
  bankStatement,
  getKycClients,
  getKycDetails,
  getPersonalKycDocuments,
  getBusinessKycDocuments,
  getBankStatementInfo,
  getBankStatementDetail,
};
