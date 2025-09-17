import {tryCatch} from '@utils/TryCatch';
import {AxiosResponse} from 'axios';
import {Api} from '.';
import Endpoints from '@constants/ApiEndPoints';
import {CustomRequestConfig} from './api';
import {storage} from '@services/localStorage';
import {Config} from '@config/index';
import StorageKeys from '@constants/StorageKeys';

// TYPES
import {
  ISoftSanctionResponse,
  IsoftSanctionBankProductResponse,
} from '@store/softsan';

const getSoftSanction = async (bankName: string) => {
  const {data, error} = await tryCatch<AxiosResponse<ISoftSanctionResponse>>(
    Api.get(Endpoints.apiGetSoftSanction(bankName), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) {
    return {data: null, error};
  }
  return {data: data.data, error: null};
};

const getSoftSanctionProductBank = async (bank: string, product: string) => {
  const {data, error} = await tryCatch<
    AxiosResponse<IsoftSanctionBankProductResponse>
  >(
    Api.get(Endpoints.apiGetSoftSanctionBankProduct(bank, product), {
      authRequired: true,
    } as CustomRequestConfig),
  );
  if (error) return {data: null, error};
  return {data: data.data, error: null};
};

const getSoftSanctionRuleset = async (
  bank: string,
  product: string,
  method?: string,
) => {
  let url = `/client-info-master/soft-sanction/ruleset?bank=${encodeURIComponent(
    bank,
  )}&product=${encodeURIComponent(product)}`;
  if (method) {
    const methods = method.split(',');
    methods.forEach(m => {
      url += `&methods=${encodeURIComponent(m.trim())}`;
    });
  }
  const {data, error} = await tryCatch<AxiosResponse<unknown>>(
    Api.get(url, {authRequired: true} as CustomRequestConfig),
  );
  if (error) return {data: null, error};
  return {data: data.data, error: null};
};

const getSoftSanctionClientList = async () => {
  const url = '/client-info-master/soft-sanction/client/list';
  const {data, error} = await tryCatch<AxiosResponse<unknown>>(
    Api.get(url, {authRequired: true} as CustomRequestConfig),
  );
  if (error) return {data: null, error};
  return {data: data.data, error: null};
};

const getSoftSanctionFields = async (
  bankName: string,
  productName: string,
  methodName?: string,
) => {
  let url = `/client-info-master/soft-sanction/inputs?bank=${encodeURIComponent(
    bankName,
  )}&product=${encodeURIComponent(productName)}`;
  if (methodName) {
    const methods = methodName.split(',');
    methods.forEach(m => {
      url += `&methods=${encodeURIComponent(m.trim())}`;
    });
  }
  const {data, error} = await tryCatch<AxiosResponse<unknown>>(
    Api.get(url, {authRequired: true} as CustomRequestConfig),
  );
  if (error) return {data: null, error};
  return {data: data.data, error: null};
};

const softSanctionResult = async (
  clientId: string | number,
  method: string,
  bank: string,
) => {
  const {data, error} = await tryCatch<AxiosResponse<unknown>>(
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
  const {data, error} = await tryCatch<AxiosResponse<unknown>>(
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

export default {
  getSoftSanction,
  getSoftSanctionProductBank,
  getSoftSanctionRuleset,
  getSoftSanctionClientList,
  getSoftSanctionFields,
  softSanctionResult,
  softSanctionExport,
  softSanctionExportDownload,
};

