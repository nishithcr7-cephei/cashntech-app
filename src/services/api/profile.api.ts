import {AxiosResponse} from 'axios';

import Endpoints from '@constants/ApiEndPoints';
import {IClientProfileResponse, IClientProfileData, ISoftSanctionResponse, IKycDocumentsResponse, IKycDocumentsData} from '@store/profile/profile.types';
import {tryCatch} from '@utils/TryCatch';

import {Api} from '.';
import {CustomRequestConfig} from './api';


const getClientProfile = async (clientId: string | number) => {
  try {
    const {data, error} = await tryCatch<AxiosResponse<IClientProfileResponse>>(
      Api.get(Endpoints.apiGetClientProfile(clientId), {
        authRequired: true,
      } as CustomRequestConfig),
    );
    
    if (error) {
      return {data: null, error};
    }
    
    const profileData = (data?.data as unknown) as IClientProfileData | undefined;
    return {data: profileData || null, error: null};
  } catch (apiError) {
    return {data: null, error: apiError};
  }
};

const getSoftSanctionDetails = async (clientId: string | number) => {
  const timestamp = Date.now();
  const endpoint = `${Endpoints.apiGetSoftSanctionDetails(clientId)}?t=${timestamp}`;
  
  try {
    const {data, error} = await tryCatch<AxiosResponse<ISoftSanctionResponse>>(
      Api.get(endpoint, {
        authRequired: true,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      } as unknown as CustomRequestConfig),
    );
    
    if (error) {
      return {data: null, error};
    }
    
    const responseData = data?.data;
    const softSanctionData = responseData?.data;
    
    return {data: softSanctionData || null, error: null};
  } catch (apiError) {
    return {data: null, error: apiError};
  }
};

const getKycDocuments = async (clientId: string | number) => {
  try {
    const {data, error} = await tryCatch<AxiosResponse<IKycDocumentsResponse>>(
      Api.get(Endpoints.apiGetKycDocuments(clientId.toString()), {
        authRequired: true,
      } as CustomRequestConfig),
    );
    
    if (error) {
      return {data: null, error};
    }
    
    const kycData = data?.data?.data as IKycDocumentsData[] | undefined;
    return {data: kycData || null, error: null};
  } catch (apiError) {
    return {data: null, error: apiError};
  }
};

export default {
  getClientProfile,
  getSoftSanctionDetails,
  getKycDocuments,
};
