import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
import {CustomRequestConfig} from './api';
import {InboundClientData} from '@components/InboundClientCard';

// Types for Inbound Client API
export interface InboundClientListResponse {
  statusCode: number;
  data: InboundClientData[];
}

export interface InboundClientFilterPayload {
  sectors?: string[];
  cities?: string[];
  application_status?: string[];
  registration_status?: string[];
  overall_status?: string[];
}

export interface InboundClientFilterResponse {
  statusCode: number;
  data: InboundClientData[];
}

export interface InboundClientDeletePayload {
  id: number;
  deleted_by: string;
}

export interface InboundClientDeleteResponse {
  statusCode: number;
  message: string;
}

// API Functions
const getInboundClients = async () => {
  const {data, error} = await tryCatch<AxiosResponse<InboundClientListResponse>>(
    Api.post(Endpoints.apiInboundClientsList, {}, {
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

const InboundClientApis = {
  getInboundClients,
};

export default InboundClientApis;
