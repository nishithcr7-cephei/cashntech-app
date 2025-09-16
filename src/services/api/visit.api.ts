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
  try {
    const {data, error} = await tryCatch<AxiosResponse<any>>(
      Api.post('/client-info-master/visit-details', payload || {hasVisit: true}, {
        authRequired: true,
        timeout: 10000, // 10 second timeout
      } as CustomRequestConfig),
    );
    
    if (error) {
      return {data: null, error};
    }
    
    // Handle both 200 and 201 status codes
    // The response comes as {data: {data: [...], statusCode: 200/201}}
    return {data: data?.data?.data || [], error: null};
  } catch (exception) {
    return {data: null, error: exception};
  }
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
