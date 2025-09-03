import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
// Types
import {
  BasicDetailsPayload,
  IBankListResponse,
  BasicDetailsResponse,
  IClientInfoSuccessResponse,
  ILeadProgressResponse,
  IRemarkReportResponse,
  ITaskHistoryResponse,
  IVisitPayload,
  IvisitResponse,
  IKycCheckedResponse,
  ISoftSanctionResponse,
  IsoftSanctionBankProductResponse,
  IFilterPayload,
  IFilterResponse,
  ITaskRecordsFilterPayload,
  ITaskReordsFilterResponse,
  ClientsDetailsPayload,
  ClientsDetailsResponseType,
  MasterBankResponse,
  FirmDetailsPayload,
  VendorDetailsPayload,
} from '@store/client';
import {CustomRequestConfig} from './api';
import {storage} from '@services/localStorage';
import {Config} from '@config/index';
import StorageKeys from '@constants/StorageKeys';

const getAllClients = async () => {
  console.log('API: getAllClients called');
  const {data, error} = await tryCatch<
    AxiosResponse<IClientInfoSuccessResponse>
  >(
    Api.get(Endpoints.apiGetAllClients, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  console.log('API: getAllClients response:', {
    hasData: !!data,
    hasError: !!error,
  });
  if (error) {
    console.log('API: getAllClients error:', error);
    return {
      data: null,
      error: error,
    };
  }
  console.log(
    'API: getAllClients success, data length:',
    data?.data?.length || 0,
  );
  return {
    data: data.data,
    error: null,
  };
};

const getRemarkReport = async () => {
  const {data, error} = await tryCatch<AxiosResponse<IRemarkReportResponse>>(
    Api.get(Endpoints.apiGetReport, {
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

const getRemarkReportByClient = async (clientId: string) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(Endpoints.apiGetRemarkReport(clientId), {
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

const getLeadProgress = async () => {
  console.log('API: getLeadProgress called');
  console.log('API: Using endpoint:', Endpoints.apiGetLeadProgress);
  const {data, error} = await tryCatch<AxiosResponse<ILeadProgressResponse>>(
    Api.get(Endpoints.apiGetLeadProgress, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  console.log('API: getLeadProgress response:', {
    hasData: !!data,
    hasError: !!error,
  });
  if (error) {
    console.log('API: getLeadProgress error:', error);
    return {
      data: null,
      error: error,
    };
  }
  console.log(
    'API: getLeadProgress success, data length:',
    data?.data?.length || 0,
  );
  return {
    data: data.data,
    error: null,
  };
};
const getLeadDesProgress = async (leadID: string) => {
  const {data, error} = await tryCatch<AxiosResponse<ILeadProgressResponse>>(
    Api.get(Endpoints.apiInfoLeadProgress(leadID), {
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

const getTaskHistory = async () => {
  const {data, error} = await tryCatch<AxiosResponse<ITaskHistoryResponse>>(
    Api.get(Endpoints.apiGetTaskHistory, {
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

// Form APIs
const saveBasicDetailForm = async (body: BasicDetailsPayload) => {
  const {data, error} = await tryCatch<AxiosResponse<BasicDetailsResponse>>(
    Api.post(Endpoints.apiSaveBasicDetails, body, {
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

const saveClientsDetailsForm = async (
  clientFormId: string,
  body: ClientsDetailsPayload,
) => {
  const {data, error} = await tryCatch<
    AxiosResponse<{statusCode: number; message: string}>
  >(
    Api.post(`${Endpoints.apiSaveClientsDetails}${clientFormId}`, body, {
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

const getClientsDetailsForm = async (clientFormId: string) => {
  const {data, error} = await tryCatch<
    AxiosResponse<ClientsDetailsResponseType>
  >(
    Api.get(`${Endpoints.apiGetClientsDetails}${clientFormId}`, {
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

const getMasterBankList = async () => {
  const {data, error} = await tryCatch<AxiosResponse<MasterBankResponse>>(
    Api.get(Endpoints.apiGetMasterBank, {
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

const saveFirmDetailsForm = async (
  clientFormId: string,
  body: FirmDetailsPayload,
) => {
  const {data, error} = await tryCatch<
    AxiosResponse<{statusCode: number; message: string}>
  >(
    Api.post(`${Endpoints.apiSaveFirmDetails}${clientFormId}`, body, {
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

const saveVendorDetailsForm = async (
  clientId: string,
  body: VendorDetailsPayload,
) => {
  const {data, error} = await tryCatch<
    AxiosResponse<{statusCode: number; message: string}>
  >(
    Api.post(`${Endpoints.apiSaveVendorDetails}${clientId}`, body, {
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

const saveVisitForm = async (clientId: string, body: IVisitPayload) => {
  const {data, error} = await tryCatch<AxiosResponse<IvisitResponse>>(
    Api.post(Endpoints.apiSaveVisitDetails(clientId), body, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  return {data: data?.data ?? null, error};
};

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
  const {data, error} = await tryCatch<AxiosResponse<IKycCheckedResponse>>(
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

const getSoftSanction = async (bankName: string) => {
  const {data, error} = await tryCatch<AxiosResponse<ISoftSanctionResponse>>(
    Api.get(Endpoints.apiGetSoftSanction(bankName), {
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

const getSoftSanctionProductBank = async (bank: string, product: string) => {
  const {data, error} = await tryCatch<
    AxiosResponse<IsoftSanctionBankProductResponse>
  >(
    Api.get(Endpoints.apiGetSoftSanctionBankProduct(bank, product), {
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

const FilterBox = async (payload: IFilterPayload) => {
  const {data, error} = await tryCatch<AxiosResponse<IFilterResponse>>(
    Api.post(Endpoints.apiFilterBox, payload, {
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

const taskRecordsFilter = async (payload: ITaskRecordsFilterPayload) => {
  const {data, error} = await tryCatch<
    AxiosResponse<ITaskReordsFilterResponse>
  >(
    Api.post(Endpoints.apitaskFilterBox, payload, {
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

const softSanctionCalculate = async (payload: any, clientId: string) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(Endpoints.apiSoftSanctionCalculate(clientId), payload, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  return {data: data?.data ?? null, error};
};

const softSanctionResult = async (
  clientId: string | number,
  method: string,
  bank: string,
) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(Endpoints.apiSoftSanctionResult(clientId, method, bank), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  return {data: data?.data ?? null, error};
};

const softSanctionExport = async (
  clientId: string | number,
  method: string,
  product: string,
) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(Endpoints.apiSoftSanctionExport(clientId, method, product), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  return {data: data?.data ?? null, error};
};

const softSanctionExportDownload = async (
  clientId: string | number,
  method: string,
  product: string,
) => {
  // For file downloads, we need to get the token and construct the URL manually
  const token = storage.getString(StorageKeys.TOKEN);
  const url = `${
    Config.API_URL
  }/client-info-master/soft-sanction/export/${clientId}?method=${encodeURIComponent(
    method,
  )}&product=${encodeURIComponent(product)}`;

  return {
    url,
    token,
    headers: {
      Authorization: `Bearer ${token}`,
      'Device-Type': 'mobile',
    },
  };
};

const getLocations = async () => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get('/client-info-master/cities', {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: []};
  }
  return {data: data.data};
};

const getSalesmanList = async () => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get('/client-info-master/salesman/list', {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: []};
  }
  return {data: data.data};
};

const getSoftSanctionRuleset = async (bank: string, product: string) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(
      `/client-info-master/soft-sanction/ruleset?bank=${encodeURIComponent(
        bank,
      )}&product=${encodeURIComponent(product)}`,
      {authRequired: true} as CustomRequestConfig,
    ),
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

const getSoftSanctionClientList = async () => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get('/client-info-master/soft-sanction/client/list', {
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

const getSoftSanctionFields = async (bankName: string, productName: string) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(
      `/client-info-master/soft-sanction?product_name=${encodeURIComponent(
        productName,
      )}`,
      {authRequired: true} as CustomRequestConfig,
    ),
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

const taskUpdate = async (taskId: string, body: any) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post(`/client-info-master/${taskId}/task-update`, body, {
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

const getVisitDetailsList = async () => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get(Endpoints.apiGetVisitDetailsList, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

export default {
  getAllClients,

  saveBasicDetailForm,
  saveClientsDetailsForm,
  saveFirmDetailsForm,
  saveVendorDetailsForm,

  getClientsDetailsForm,
  getMasterBankList,

  getRemarkReport,
  getLeadProgress,
  getLeadDesProgress,
  getTaskHistory,
  saveVisitForm,
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
  getBankList,
  getKycChecked,
  getBusinessKycChecked,
  getSoftSanction,
  getSoftSanctionProductBank,
  FilterBox,
  bankStatement,
  softSanctionCalculate,
  softSanctionResult,
  softSanctionExport,
  softSanctionExportDownload,
  taskRecordsFilter,
  getLocations,
  getSalesmanList,
  getSoftSanctionRuleset,
  getSoftSanctionClientList,
  getSoftSanctionFields,
  taskUpdate,
  getVisitDetailsList,
  getRemarkReportByClient,
};
