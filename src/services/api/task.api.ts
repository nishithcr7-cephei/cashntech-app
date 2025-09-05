import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
import {CustomRequestConfig} from './api';
import {ITaskRecordsRequest, ITaskRecordsResponse, ITaskUpdateRequest, ITaskUpdateResponse, IUserTaskHistoryResponse} from '@store/tasklog/tasklog.types';

const getTaskRecords = async (payload: ITaskRecordsRequest) => {
  const {data, error} = await tryCatch<AxiosResponse<ITaskRecordsResponse>>(
    Api.post(Endpoints.apiTaskRecords, payload, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

const getTaskHistory = async (userName: string) => {
  const endpoint = Endpoints.apiGetTaskHistory(userName);
  
  const {data, error} = await tryCatch<AxiosResponse<IUserTaskHistoryResponse>>(
    Api.get(endpoint, {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

const taskUpdate = async (taskId: string, body: ITaskUpdateRequest) => {
  const {data, error} = await tryCatch<AxiosResponse<ITaskUpdateResponse>>(
    Api.patch(`/client-info-master/${taskId}/task-update`, body, {
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

export default {
  getTaskRecords,
  getTaskHistory,
  taskUpdate,
};
