import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
// Types
import {
  BasicDetailsPayload,
  IBankListResponse,
  BasicDetailsResponse,
  IKycCheckedResponse,
  IFilterPayload,
  IFilterResponse,
  ITaskRecordsFilterPayload,
  ITaskReordsFilterResponse,
  ClientsDetailsPayload,
  ClientsDetailsResponseType,
  MasterBankResponse,
  FirmDetailsPayload,
  VendorDetailsPayload,
  VisitDetailsPayload,
  ClientsFilterResponse,
  IDeleteResponse,
  IDeletePayload,
  ClientsFilterPayload,
  GetBasicDetailsResponse,
  FirmDetailsResponse,
  VisitDetailsResponse,
  VendorDetailsResponse,
} from '@store/client';
import {
  IRemarkReportResponse,
  ITaskHistoryResponse,
} from '@store/tasklog';
import {CustomRequestConfig} from './api';
import {storage} from '@services/localStorage';
import {Config} from '@config/index';
import StorageKeys from '@constants/StorageKeys';
import {decryptUtility} from '@utils/crypto';

const getRemarkReport = async () => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
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


const getTaskHistory = async (userName: string) => {
  const {data, error} = await tryCatch<AxiosResponse<ITaskHistoryResponse>>(
    Api.get(Endpoints.apiGetTaskHistory(userName), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

// Client Filter API
const getClientsFilter = async (payload: ClientsFilterPayload) => {
  const {data, error} = await tryCatch<AxiosResponse<ClientsFilterResponse>>(
    Api.post(Endpoints.apiGetClientsFilter, payload, {
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

const getCityList = async () => {
  const {data: cityData, error} = await tryCatch<
    AxiosResponse<{statusCode: number; data: Array<string>}>
  >(
    Api.get(Endpoints.apiGetCityList, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {
      data: null,
      error: error,
    };
  }
  const apiData = cityData.data;
  return {
    data: apiData.data.map(city => decryptUtility(city)),
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

const getBasicDetailForm = async (clientId: number) => {
  const {data: basicDetails, error} = await tryCatch<
    AxiosResponse<GetBasicDetailsResponse>
  >(
    Api.get(`${Endpoints.apiGetBasicDetails}${clientId}`, {
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
    data: basicDetails.data.data,
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

const getFirmDetailsForm = async (clientFormId: number) => {
  const {data: firmDetails, error} = await tryCatch<
    AxiosResponse<FirmDetailsResponse>
  >(
    Api.get(`${Endpoints.apiGetFirmDetails}${clientFormId}`, {
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
    data: firmDetails.data.data,
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

const getVendorDetailsForm = async (clientFormId: number) => {
  const {data, error} = await tryCatch<AxiosResponse<VendorDetailsResponse>>(
    Api.get(`${Endpoints.apiGetVendorDetails}${clientFormId}`, {
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

const saveVisitDetailsForm = async (
  clientId: string,
  body: VisitDetailsPayload,
) => {
  const {data, error} = await tryCatch<
    AxiosResponse<{statusCode: number; message: string}>
  >(
    Api.post(`${Endpoints.apiSaveVisitDetails}${clientId}`, body, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  return {data: data?.data ?? null, error};
};

const getVisitDetailsForm = async (clientFormId: number) => {
  const {data, error} = await tryCatch<AxiosResponse<VisitDetailsResponse>>(
    Api.get(`${Endpoints.apiGetVisitDetails}${clientFormId}`, {
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

export const deleteClient = async (id: number, payload: IDeletePayload) => {
  const {data, error} = await tryCatch<AxiosResponse<IDeleteResponse>>(
    Api.post(`${Endpoints.apiDeleteClient}${id}`, payload, {
      authRequired: true,
    } as CustomRequestConfig),
  );

  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};


export default {
  getClientsFilter,
  getCityList,
  deleteClient,

  saveBasicDetailForm,
  saveClientsDetailsForm,
  saveFirmDetailsForm,
  saveVendorDetailsForm,
  saveVisitDetailsForm,

  getBasicDetailForm,
  getClientsDetailsForm,
  getFirmDetailsForm,
  getVendorDetailsForm,
  getVisitDetailsForm,
  getMasterBankList,

  getRemarkReport,
  getTaskHistory,
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
  FilterBox,
  bankStatement,
  taskRecordsFilter,
  getLocations,
  getSalesmanList,
  getVisitDetailsList,
  getRemarkReportByClient,
};
