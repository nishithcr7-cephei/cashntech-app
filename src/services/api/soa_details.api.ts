import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import {decryptValue} from '@utils/decrypt';
import moment from 'moment';
import {formatIndianNumber} from '@utils/Utils';
import type {ProgramCounterPartySummary} from '@store/soa/dealer/dealer.types';

export interface ProgramSummaryApi {
  account_number: string;
  total_limit: string | number;
  utilized_amount: string | number;
  overdue_days: string | number;
  entity_name?: string;
  total_outstanding?: string | number;
  pipeline_requests?: string | number;
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
  os_total?: string;
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

const asRelativeEndpoint = (path: string) =>
  path.startsWith('/') ? path : `/${path}`;

function formatSummaryDate(value: unknown): string {
  if (!value) {
    return '-';
  }
  const formatted = moment(value).format('DD-MM-YYYY');
  return formatted === 'Invalid date' ? '-' : formatted;
}

function formatSummaryAmount(value: unknown): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return '₹0.00';
  }
  return `₹${formatIndianNumber(String(num))}`;
}

function mapAccountSummaryAmounts(raw: any, totalKey: 'total_due' | 'total_received') {
  return {
    principal: formatSummaryAmount(raw?.principal),
    interest: formatSummaryAmount(raw?.interest),
    penalInterest: formatSummaryAmount(raw?.penal_interest),
    charges: formatSummaryAmount(raw?.charges),
    total: formatSummaryAmount(raw?.[totalKey] ?? raw?.total),
  };
}

export const soaDetailsApi = {
  /**
   * Account-level LOAN DETAILS (DUE / RECEIVED) — existing backend endpoint.
   * POST /transactions/counter-party/:participantId/summary
   */
  getCounterPartyAccountSummary: async (
    participantId: string,
  ): Promise<ProgramCounterPartySummary | null> => {
    const url = asRelativeEndpoint(
      ApiEndPoints.apiCounterPartyAccountSummary(participantId),
    );
    const response = await axiosInstance.post(url, {}, {
      authRequired: true,
    } as any);
    const data = response?.data;
    if (data?.statusCode !== 200 && data?.statusCode !== 201) {
      return null;
    }
    const raw = data?.data || {};
    const loanDetails = raw.loanDetails || {};
    const due = raw.due || {};
    const received = raw.received || {};
    const roiPercent =
      loanDetails.roi_percent != null && loanDetails.roi_percent !== ''
        ? `${loanDetails.roi_percent}%`
        : '-';

    return {
      loanDetails: {
        programName: loanDetails.program_name || '-',
        anchorName: decryptValue(loanDetails.anchor_name || '') || '-',
        bankName: loanDetails.bank_name || '-',
        programApprovalDate: formatSummaryDate(
          loanDetails.program_approval_date,
        ),
        programExpiryDate: formatSummaryDate(loanDetails.program_expiry_date),
        status: loanDetails.status || '-',
        programLimit: formatSummaryAmount(loanDetails.program_limit),
        availableLimit: formatSummaryAmount(loanDetails.available_limit),
        roiPercent,
      },
      due: mapAccountSummaryAmounts(due, 'total_due'),
      received: mapAccountSummaryAmounts(received, 'total_received'),
    };
  },

  getProgramSummary: async (id: string): Promise<ProgramSummaryApi | null> => {
    const url = asRelativeEndpoint(ApiEndPoints.apiProgramSummary(id));
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
    const url = asRelativeEndpoint(ApiEndPoints.apiProgramDealersDetails(id));
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
    const url = `/transactions/bank-statement/${id}`;
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
    const url = `/transactions/od-accounts/${id}/invoices?invoiceType=open`;
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
    const url = `/transactions/od-accounts/${id}/invoices?invoiceType=closed`;
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
    const url = `/transactions/od-accounts/${id}/repayments`;
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
