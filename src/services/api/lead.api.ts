import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
import {ILeadProgressResponse} from '@store/lead';
import {CustomRequestConfig} from './api';

const getLeadProgress = async () => {
  const {data, error} = await tryCatch<AxiosResponse<ILeadProgressResponse>>(
    Api.post(Endpoints.apiGetLeadProgress, {}, {
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

const getLeadDesProgress = async (leadID: string) => {
  const {data, error} = await tryCatch<AxiosResponse<{statusCode: number; message: string; data: any[]}>>(
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

export default {
  getLeadProgress,
  getLeadDesProgress,
};
