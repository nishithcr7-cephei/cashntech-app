import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import {API_URL} from '@config/config';
import {decryptValue} from '@utils/decrypt';

export interface ProgramSummaryApi {
  account_number: string;
  total_limit: string | number;
  utilized_amount: string | number;
  overdue_days: string | number;
  entity_name?: string;
}

export interface InterestSlabApi {
  total_roi_percent: number;
}

export interface InterestParametersApi {
  interest_slabs: InterestSlabApi[];
}

export interface DealerListItemApi {
  id: string; // Internal ID for list mapping
  od_account_no: string;
  sanctioned_limit: number;
  interest_parameters: InterestParametersApi;
  default_payment_terms_days: number;
  limit_approval_date: string;
  od_expiry_date: string;
  status: string;
}

export interface TransactionDetailsApi {
  txn_date: string;
  payment_date: string;
  particulars: string;
  debit: string;
  credit: string;
  os_principal: string;
  os_interest: string;
  os_penal: string;
  due_other_charges: string;
  paid_other_charges: string;
  utr_number: string;
  loan_ref_no: string;
  invoice_no?: string;
}

export interface OpenInvoiceApi {
  tranch_loan_no: string;
  loan_amount: string;
  loan_date: string;
  principal_os: string;
  interest_os: string;
  penal_interest_os: string;
  other_charges_os: string;
  paid_principal: string;
  paid_interest: string;
  paid_penal_interest: string;
  paid_other_charges: string;
  due_date: string;
  status: string;
  invoice_no?: string;
}

export interface ClosedInvoiceApi {
  tranch_loan_no: string;
  loan_amount: string;
  loan_date: string;
  principal_os: string;
  interest_os: string;
  penal_interest_os: string;
  other_charges_os: string;
  paid_principal: string;
  paid_interest: string;
  paid_penal_interest: string;
  paid_other_charges: string;
  no_of_days: string | number;
  closed_date: string;
  invoice_no?: string;
}

export interface RepaymentApi {
  transaction_no: string;
  date: string;
  particulars: string;
  amount: string;
  transaction_mode: string;
  debit: string;
  credit: string;
  remark: string;
  invoice_no?: string;
}

const BASE_URL = API_URL || 'https://losapidev.cashntech.com';

export const soaDetailsApi = {
  getProgramSummary: async (id: string): Promise<ProgramSummaryApi | null> => {
    const endpoint = ApiEndPoints.apiProgramSummary(id);
    const url = `${BASE_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
    // eslint-disable-next-line no-console
    console.log('[soaDetailsApi] GET ProgramSummary URL:', url);
    const response = await axiosInstance.get(url, {
      authRequired: true,
    } as any);
    const data = response?.data;
    if (data?.statusCode === 200 || data?.statusCode === 201) {
      let rawSummary = data?.data ?? data;
      // Handle array response - take first item
      if (Array.isArray(rawSummary)) {
        rawSummary = rawSummary[0];
      }
      
      if (rawSummary) {
        return {
          ...rawSummary,
          account_number: decryptValue(rawSummary.account_number || ''),
          entity_name: decryptValue(rawSummary.entity_name || ''),
        };
      }
    }
    return null;
  },

  getDealersDetails: async (id: string): Promise<DealerListItemApi[]> => {
    const endpoint = ApiEndPoints.apiProgramDealersDetails(id);
    const url = `${BASE_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
    // eslint-disable-next-line no-console
    console.log('[soaDetailsApi] GET DealersDetails URL:', url);
    const response = await axiosInstance.post(url, {}, {
      authRequired: true,
    } as any);
    const data = response?.data;
    if (data?.statusCode === 200 || data?.statusCode === 201) {
      const dealers = data?.data ?? data;
      if (Array.isArray(dealers)) {
        return dealers.map((item: any) => ({
          ...item,
          od_account_no: decryptValue(item.od_account_no || ''),
        }));
      }
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  getTransactionDetails: async (id: string): Promise<TransactionDetailsApi[]> => {
    const url = `${BASE_URL}/transactions/bank-statement/${id}`;
    // eslint-disable-next-line no-console
    console.log('[soaDetailsApi] POST TransactionDetails URL:', url);
    const response = await axiosInstance.post(url, {}, {
      authRequired: true,
    } as any);
    const data = response?.data;
    if (data?.statusCode === 200 || data?.statusCode === 201) {
      const transactions = data?.data ?? data;
      return Array.isArray(transactions) ? transactions : [];
    }
    return [];
  },

  getOpenInvoices: async (id: string): Promise<{invoices: OpenInvoiceApi[]; message: string}> => {
    const url = `${BASE_URL}/transactions/od-accounts/${id}/invoices?invoiceType=open`;
    // eslint-disable-next-line no-console
    console.log('[soaDetailsApi] GET OpenInvoices URL:', url);
    const response = await axiosInstance.get(url, {
      authRequired: true,
    } as any);
    const data = response?.data;
    const invoices = data?.data ?? [];
    const message = data?.message || '';
    return {
      invoices: Array.isArray(invoices) ? invoices : [],
      message,
    };
  },

  getClosedInvoices: async (id: string): Promise<{invoices: ClosedInvoiceApi[]; message: string}> => {
    const url = `${BASE_URL}/transactions/od-accounts/${id}/invoices?invoiceType=closed`;
    // eslint-disable-next-line no-console
    console.log('[soaDetailsApi] GET ClosedInvoices URL:', url);
    const response = await axiosInstance.get(url, {
      authRequired: true,
    } as any);
    const data = response?.data;
    const invoices = data?.data ?? [];
    const message = data?.message || '';
    return {
      invoices: Array.isArray(invoices) ? invoices : [],
      message,
    };
  },

  getRepayments: async (id: string): Promise<{repayments: RepaymentApi[]; message: string}> => {
    const url = `${BASE_URL}/transactions/od-accounts/${id}/repayments`;
    // eslint-disable-next-line no-console
    console.log('[soaDetailsApi] GET Repayments URL:', url);
    const response = await axiosInstance.get(url, {
      authRequired: true,
    } as any);
    const data = response?.data;
    const repayments = data?.data ?? [];
    const message = data?.message || '';
    return {
      repayments: Array.isArray(repayments) ? repayments : [],
      message,
    };
  },
};
