import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
// Types
import {
  IVisitPayload,
  IvisitResponse,
} from '@store/visit/visit.types';
import {CustomRequestConfig} from './api';
import {Config} from '@config/index';

const saveVisitForm = async (clientId: string, body: IVisitPayload) => {
  const {data, error} = await tryCatch<AxiosResponse<IvisitResponse>>(
    Api.post(`${Endpoints.apiSaveVisitDetails}${clientId}`, body, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  if (error) {
    return {data: null, error};
  }
  
  return {data: data?.data ?? null, error};
};

const getVisitDetailsList = async () => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.get('/client-info-master/visit-details', {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

const postVisitDetailsList = async (payload?: any) => {
  const {data, error} = await tryCatch<AxiosResponse<any>>(
    Api.post('/client-info-master/visit-details', payload || {}, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
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

export default {
  saveVisitForm,
  getVisitDetailsList,
  postVisitDetailsList,
  getSalesmanList,
  getLocations,
};
