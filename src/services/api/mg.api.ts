import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
import {CustomRequestConfig} from './api';
import {
  TaskRecordsListPayload,
  TaskRecordsListResponse,
  SalesmanListResponse,
} from '@store/mng';

const getTaskRecordsList = async (payload: TaskRecordsListPayload) => {
  console.log('API: getTaskRecordsList called with payload:', payload);
  
  const {data, error} = await tryCatch<AxiosResponse<TaskRecordsListResponse>>(
    Api.post(Endpoints.apiTaskRecords, payload, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  console.log('API: getTaskRecordsList response:', {
    hasData: !!data,
    hasError: !!error,
    dataLength: data?.data?.data?.length || 0,
  });

  if (error) {
    console.log('API: getTaskRecordsList error:', error);
    return {
      data: null,
      error: error,
    };
  }

  console.log('API: getTaskRecordsList success, data length:', data?.data?.data?.length || 0);
  return {
    data: data.data,
    error: null,
  };
};

const getSalesmanList = async () => {
  console.log('API: getSalesmanList called');
  
  const {data, error} = await tryCatch<AxiosResponse<SalesmanListResponse>>(
    Api.get('/client-info-master/salesman/list', {
      authRequired: true,
    } as CustomRequestConfig),
  );
  
  console.log('API: getSalesmanList response:', {
    hasData: !!data,
    hasError: !!error,
    dataLength: data?.data?.data?.length || 0,
  });

  if (error) {
    console.log('API: getSalesmanList error:', error);
    return {
      data: null,
      error: error,
    };
  }

  console.log('API: getSalesmanList success, data length:', data?.data?.data?.length || 0);
  return {
    data: data.data,
    error: null,
  };
};

export default {
  getTaskRecordsList,
  getSalesmanList,
};
