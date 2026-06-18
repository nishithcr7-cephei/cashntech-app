import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';
import type {DocumentPickerResponse} from '@react-native-documents/picker';
import type {InvoiceListItemApi, UpdateInvoicePayload} from '@store/invoice/inv.types';
import {normalizeDealerInfoResponse} from '@utils/normalizeDealerInfo';
import {
  mapInvoiceAttachmentsWithUrls,
} from '@utils/invoiceAttachments';
import {transformApiResponse} from '@utils/apiTransformer';

// Unit mapping: PCS=1, KG=2, LTR=3, etc. (backend accepts any number)
const UNIT_MAP: Record<string, number> = {
  PCS: 1,
  KG: 2,
  LTR: 3,
  MTR: 4,
  BOX: 5,
  CARTON: 6,
  BAG: 7,
  BOTTLE: 8,
  DOZEN: 9,
  PAIR: 10,
  SET: 11,
  PACK: 12,
  STRIP: 13,
};

/**
 * Numeric precision utility (equivalent to Web's Ue() utility)
 * Rounds a value to 2 decimal places and ensures it's a valid number.
 */
const Ue = (val: number | string): number => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

function toIsoString(dateStr: string): string {
  if (!dateStr?.trim()) return '';
  const ymd = toYYYYMMDD(dateStr);
  if (!ymd) return '';
  try {
    const d = new Date(ymd);
    // Explicitly set time to noon to avoid day-shifts across timezones
    d.setHours(12, 0, 0, 0); 
    return d.toISOString();
  } catch {
    return dateStr;
  }
}

export function toYYYYMMDD(dateStr: string): string {
  if (!dateStr?.trim()) return '';
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (y > 1000) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (d <= 31 && m <= 12) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return dateStr;
}

export type CreateInvoicePayloadInput = {
  fields: InvoiceFields;
  createdBy: string;
  partnerBank: string;
  program: string;
  product: string;
  anchorParticipantMapping: string;
  party: string;
  counterPartyName: string;
  counterPartyCode: string;
  counterPartyOdAccount: string;
  attachment?: DocumentPickerResponse | null;
};

function parseTenorDays(raw: string | undefined): number {
  const n = parseInt(String(raw ?? '').trim(), 10);
  return Number.isFinite(n) ? n : NaN;
}

function buildCreateInvoicePayload(input: CreateInvoicePayloadInput): Record<string, unknown> {
  const {fields, createdBy, partnerBank, program, product, anchorParticipantMapping, party, counterPartyName, counterPartyCode, counterPartyOdAccount} = input;

  // Align with InvoiceForm: use item-level discount and tax (same as form summary)
  const subtotal = fields.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const discountTotal = fields.items.reduce(
    (sum, item) => sum + (parseFloat(item.discountAmount || '0') || 0),
    0,
  );
  const taxTotal = fields.items.reduce(
    (sum, item) => sum + (parseFloat(item.taxAmount || '0') || 0),
    0,
  );
  const finalTotalValue = Math.max(0, subtotal - discountTotal + taxTotal);

  const items = fields.items.map((item: InvoiceLineItem) => {
    // Map textual unit (PCS, KG...) to numeric code that DB expects,
    // but keep it as a string so DTO (@IsString) validation passes.
    const unitNum = UNIT_MAP[item.unit?.toUpperCase()] ?? 1;
    const baseItem: Record<string, unknown> = {
      name: item.itemName?.trim() || '',
      description: (item.description?.trim() || item.itemName?.trim() || ''),
      created_by: createdBy,
      quantity: Ue(item.quantity),
      unit: String(unitNum),
      price_per_quantity: Ue(item.pricePerQuantity),
      total: Ue(item.total),
    };
    if (item.discountType && item.discountValue) {
      const discountType = item.discountType === 'value' ? 'absolute' : item.discountType;
      baseItem.discount_type = discountType;
      baseItem.discount_value = Ue(item.discountValue);
      baseItem.discount_amount = Ue(item.discountAmount || '0');
    }
    const taxesArray = item.taxes?.filter(t => t.taxType) || [];
    if (taxesArray.length > 0) {
      baseItem.taxes = taxesArray.map(t => ({
        tax_type: t.taxType,
        tax_percentage: Ue(t.taxPercentage || '0'),
        tax_amount: Ue(t.taxAmount || '0'),
      }));
    } else if (item.taxType && (item.taxPercentage || item.taxAmount)) {
      baseItem.taxes = [{
        tax_type: item.taxType,
        tax_percentage: Ue(item.taxPercentage || '0'),
        tax_amount: Ue(item.taxAmount || '0'),
      }];
    }
    return baseItem;
  });

  const payload: Record<string, unknown> = {
    invoice_ref_no: fields.invoiceNumber?.trim() || '',
    counter_party_name: counterPartyName,
    counter_party_code: counterPartyCode,
    counter_party_od_account: counterPartyOdAccount,
    credit_to: fields.creditTo?.trim() || '',
    invoice_date: toYYYYMMDD(fields.invoiceDate),
    invoice_due_date: toYYYYMMDD(fields.invoiceDueDate),
    currency: fields.currency || 'INR',
    remark: fields.remark || '',
    created_by: createdBy,
    partnerBank,
    program,
    product,
    anchorParticipantMapping,
    party,
    tenor: parseTenorDays(fields.tenor),
    sub_total: Ue(subtotal),
    discount_total: Ue(discountTotal),
    tax_total: Ue(taxTotal),
    final_total: Ue(finalTotalValue),
    items,
  };

  if (fields.grnDate?.trim()) {
    payload.grn_date = toYYYYMMDD(fields.grnDate);
  }
  if (fields.paymentDate?.trim()) {
    payload.payment_date = toYYYYMMDD(fields.paymentDate);
  }
  const poRef = fields.associatedPO?.trim();
  if (poRef) {
    payload.po_ref_no = poRef;
  }

  return payload;
}

export type InvoiceListFilters = {
  byInvoiceStatus?: string[];
  byApprovalStatus?: string[];
};

export type InvoiceSummaryRequest = {
  programIds?: string[];
};

export type InvoiceLatestRequest = {
  programIds?: string[];
};

export type UpdateInvoiceStatusPayload = {
  invoiceId: string;
  action: 'Approve' | 'Reject';
  approvalLevel: number;
  remark?: string;
};

export type UpdateInvoiceVerificationPayload = {
  invoiceId: string;
  action: 'Verify' | 'Reject';
  remark?: string;
};

export type DisbursementListRequest = {
  programIds?: string[];
};

export type MarkAsDisbursedPayload = {
  utr_no?: string;
  transaction_no?: string;
  disbursed_amount: number;
  disbursement_date: string; // YYYY-MM-DD
  status: string;
  remark?: string;
  payment_mode?: string;
  rejection_reason?: string;
  hold_category?: string;
  expected_release_date?: string;
};

/** API response shape for invoice approval log (GET /invoice/logs/:invoiceId) */
export type InvoiceApprovalLogApi = {
  id: string;
  action: string;
  action_by_role?: string;
  remark?: string;
  action_at: string;
  user?: { first_name?: string; last_name?: string };
  rejection_reason?: string;
  role_approval_level?: number;
};

export type DailyInterestApiRow = {
  id: number;
  accrual_date: string;
  outstanding_principal_date: number;
  interest_rate: number;
  daily_interest: number;
  base_interest: number;
  grace_period_interest: number;
  penal_interest_on_interest: number;
  penal_interest_on_principal: number;
  cumulative_interest: number;
  accrual_type: string;
};

export type InvoiceKpisResponse = {
  total_program_limit: string;
  utilized_amount: string;
  utilized_rate?: string;
  active_dealer_ratio?: string;
  available_limit: string;
  overdue_amount?: string;
  principal_overdue?: string;
  interest_overdue?: string;
  penal_overdue?: string;
  dpd_days: string;
};

export type DisbursementKpisResponse = {
  total_uploaded_amount: string;
  total_disbursed_amount: string;
  pending_disbursed_amount: string;
  repeat_usage_rate?: string;
  turn_around_time?: string;
  days_sales_outstanding?: string;
};

export type InterestAccrualKpisResponse = {
  total_interest_accrued_daily: string;
  accrual_vs_expected: number;
  overdue_interest?: string;
};

export type RepaymentKpisResponse = {
  total_dsibursed_amount: string;
  principal_repaid: string;
  interest_repaid: string;
  penal_repaid: string;
  totalClosedInvoices: string | number;
  totalOs?: {
    totalPrincipalOutstanding?: string;
    totalBaseInterestOutstanding?: string;
    totalPenalOutstanding?: string;
  };
  overDueSum?: {
    total_principal_outstanding?: string;
    total_base_interest_outstanding?: string;
    total_penal_outstanding?: string;
  };
};

export type DpdKpisResponse = {
  disbursedInvoices?: Array<{
    overdue_invoice_ids?: string[];
    dpd_1_30?: string;
    dpd_31_60?: string;
    dpd_61_90?: string;
    average_dpd?: string;
  }>;
  overdueSum?: Array<{
    total_principal_outstanding?: string;
    total_base_interest_outstanding?: string;
    total_penal_outstanding?: string;
  }>;
  gross_npa_percent?: string;
  total_outstanding_amount?: string;
  totalOsResult?: Array<{
    totalPrincipalOutstanding?: string;
    totalBaseInterestOutstanding?: string;
    totalPenalOutstanding?: string;
  }>;
};

export const invoiceApi = {
  getInvoiceList: async (
    programId: string,
    filters?: InvoiceListFilters,
  ): Promise<InvoiceListItemApi[]> => {
    const body: Record<string, unknown> = {
      ...(filters ?? {}),
    };

    if (programId) {
      (body as any).programIds = [programId];
    }

    const response = await axiosInstance.post(
      ApiEndPoints.apiInvoiceList,
      body,
      {authRequired: true} as any,
    );
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  getDealerInfo: async (programId: string): Promise<any> => {
    const response = await axiosInstance.get(ApiEndPoints.apiDealerInfo(programId), {
      authRequired: true,
    } as any);
    const body = response.data;
    if (!body || typeof body !== 'object') {
      return body;
    }
    return {
      ...body,
      data: normalizeDealerInfoResponse(programId, body),
    };
  },

  getBankProductList: async (): Promise<any> => {
    const response = await axiosInstance.get(ApiEndPoints.apiBankProductList, {
      authRequired: true,
    } as any);
    return response.data;
  },

  /** GET /configuration/party/tax/ — active taxes for logged-in user's party (web parity). */
  getPartyTaxes: async (): Promise<
    Array<{id: number; name: string; value: number; is_active?: boolean; account_no?: string}>
  > => {
    const response = await axiosInstance.get(ApiEndPoints.apiPartyTaxList, {
      authRequired: true,
    } as any);
    const body = response?.data;
    const list = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
        ? body
        : [];
    return list
      .filter((t: any) => t && t.is_active !== false && t.name)
      .map((t: any) => ({
        id: Number(t.id),
        name: String(t.name),
        value: Number(t.value) || 0,
        is_active: t.is_active,
        account_no: t.account_no,
      }));
  },

  getInvoiceSummary: async (programIds?: string[]): Promise<any> => {
    const body = {
      programIds: Array.isArray(programIds) ? programIds : programIds ? [programIds] : [],
    };
    const response = await axiosInstance.post(
      ApiEndPoints.apiInvoiceSummary,
      body,
      {authRequired: true} as any,
    );
    // Extract nested data structure: response.data.data contains the actual array
    const data = response?.data?.data ?? response?.data ?? [];
    return {data};
  },

  getLatestInvoices: async (programIds?: string[]): Promise<any> => {
    const body = {
      programIds: Array.isArray(programIds) ? programIds : programIds ? [programIds] : [],
    };
    const response = await axiosInstance.post(
      ApiEndPoints.apiInvoiceLatest,
      body,
      {authRequired: true} as any,
    );
    // Extract nested data structure: response.data.data contains the actual array
    const data = response?.data?.data ?? response?.data ?? [];
    return {data};
  },

  getInvoiceKpis: async (programIds?: string[]): Promise<InvoiceKpisResponse> => {
    const body = {
      programIds: Array.isArray(programIds) ? programIds : programIds ? [programIds] : [],
    };
    const response = await axiosInstance.post(ApiEndPoints.apiInvoiceKpis, body, {
      authRequired: true,
    } as any);
    const raw = response?.data?.data ?? {};
    return {
      total_program_limit: raw.total_program_limit ?? '0',
      utilized_amount: raw.utilized_amount ?? '0',
      utilized_rate: raw.utilisation_rate ?? '0',
      active_dealer_ratio: raw.active_dealer_ratio ?? '0',
      available_limit: raw.available_limit ?? '0',
      overdue_amount: raw.overduePrincipalAmount ?? '0',
      principal_overdue: raw.overduePrincipalAmount ?? '0',
      interest_overdue: raw.overdueInterestAmount ?? '0',
      penal_overdue: raw.overduePenalAmount ?? '0',
      dpd_days: raw.dpd_days ?? '0',
    };
  },

  getDisbursementKpis: async (programIds?: string[]): Promise<DisbursementKpisResponse> => {
    const body = {
      programIds: Array.isArray(programIds) ? programIds : programIds ? [programIds] : [],
    };
    const response = await axiosInstance.post(ApiEndPoints.apiDisbursementKpis, body, {
      authRequired: true,
    } as any);
    const raw = response?.data?.data ?? {};
    return {
      total_uploaded_amount: raw.total_uploaded_amount ?? '0.00',
      total_disbursed_amount: raw.total_disbursed_amount ?? '0.00',
      pending_disbursed_amount: raw.pending_disbursed_amount ?? '0.00',
      repeat_usage_rate: raw.repeat_usage_rate,
      turn_around_time: raw.turn_around_time,
      days_sales_outstanding: raw.days_sales_outstanding,
    };
  },

  getInterestAccrualKpis: async (programIds?: string[]): Promise<InterestAccrualKpisResponse> => {
    const body = {
      programIds: Array.isArray(programIds) ? programIds : programIds ? [programIds] : [],
    };
    const response = await axiosInstance.post(ApiEndPoints.apiInterestAccrualKpis, body, {
      authRequired: true,
    } as any);
    const raw = response?.data?.data ?? {};
    return {
      total_interest_accrued_daily: raw.total_interest_accrued_daily ?? '0.00',
      accrual_vs_expected: raw.accrual_vs_expected ?? 0,
      overdue_interest: raw.overdue_interest,
    };
  },

  getRepaymentKpis: async (programIds?: string[]): Promise<RepaymentKpisResponse> => {
    const body = {
      programIds: Array.isArray(programIds) ? programIds : programIds ? [programIds] : [],
    };
    const response = await axiosInstance.post(ApiEndPoints.apiRepaymentKpis, body, {
      authRequired: true,
    } as any);
    const raw = response?.data?.data ?? {};
    return {
      total_dsibursed_amount: raw.total_dsibursed_amount ?? '0.00',
      principal_repaid: raw.principal_repaid ?? '0.00',
      interest_repaid: raw.interest_repaid ?? '0.00',
      penal_repaid: raw.penal_repaid ?? '0.00',
      totalClosedInvoices: raw.totalClosedInvoices ?? '0',
      totalOs: raw.totalOs,
      overDueSum: raw.overDueSum,
    };
  },

  getDpdKpis: async (programIds?: string[]): Promise<DpdKpisResponse> => {
    const body = {
      programIds: Array.isArray(programIds) ? programIds : programIds ? [programIds] : [],
    };
    const response = await axiosInstance.post(ApiEndPoints.apiDpdKpis, body, {
      authRequired: true,
    } as any);
    const raw = response?.data?.data ?? {};
    return {
      disbursedInvoices: raw.disbursedInvoices,
      overdueSum: raw.overdueSum,
      gross_npa_percent: raw.gross_npa_percent ?? '0.00%',
      total_outstanding_amount: raw.total_outstanding_amount ?? '0.00',
      totalOsResult: raw.totalOsResult,
    };
  },

  getInvoiceDetails: async (invoiceId: string): Promise<any> => {
    let response: any;
    try {
      response = await axiosInstance.get(
        ApiEndPoints.apiGetInvoiceDetails(invoiceId),
        {authRequired: true, skipResponseTransform: true} as any,
      );
    } catch (primaryErr) {
      // Fallback for environments where route is registered with trailing slash.
      response = await axiosInstance.get(
        `${ApiEndPoints.apiGetInvoiceDetails(invoiceId)}/`,
        {authRequired: true, skipResponseTransform: true} as any,
      );
    }
    const body = response?.data;
    const rawInvoice =
      body?.data != null &&
      typeof body.data === 'object' &&
      !Array.isArray(body.data) &&
      (body.data.invoice_ref_no != null || body.data.id != null)
        ? body.data
        : body?.invoice_ref_no != null || body?.id != null
          ? body
          : body?.data ?? body;
    if (!rawInvoice || typeof rawInvoice !== 'object') return {};

    const rawAttachments = mapInvoiceAttachmentsWithUrls(rawInvoice);
    const data = transformApiResponse(rawInvoice);
    const attachmentList =
      rawAttachments.length > 0
        ? rawAttachments
        : mapInvoiceAttachmentsWithUrls(data);

    // Map backend snake_case to frontend camelCase InvoiceFields
    return {
      ...data,
      attachment: attachmentList,
      invoiceNumber: data.invoice_ref_no,
      invoiceDate: data.invoice_date,
      invoiceDueDate: data.invoice_due_date,
      grnDate: data.grn_date,
      paymentDate: data.payment_date,
      currency: data.currency,
      remark: data.remark,
      subtotal: String(data.sub_total ?? ''),
      taxTotal: String(data.tax_total ?? ''),
      discountTotal: String(data.discount_total ?? ''),
      grandTotal: String(data.final_total ?? ''),
      dealer: data.anchorParticipantMapping?.party?.entity_name,
      odAccountNumber: data.anchorParticipantMapping?.od_account_no,
      dealerCode: data.anchorParticipantMapping?.company_code_given_by_party,
      creditTo: data.credit_to,
      items: (data.invoiceItems || []).map((item: any) => ({
        id: item.id,
        itemName: item.name,
        description: item.description,
        quantity: String(item.quantity ?? ''),
        unit: item.unit,
        pricePerQuantity: String(item.price_per_quantity ?? ''),
        total: String(item.total ?? ''),
        discountType: item.discount_type,
        discountValue: String(item.discount_value ?? ''),
        discountAmount: String(item.discount_amount ?? ''),
        taxes: (item.taxes || []).map((t: any) => ({
          taxType: t.tax_type,
          taxPercentage: String(t.tax_percentage ?? ''),
          taxAmount: String(t.tax_amount ?? ''),
        })),
      })),
      attachments: attachmentList,
    };
  },

  /** POST multipart file to `/invoice/attachment/:invoiceId` */
  uploadInvoiceAttachment: async (
    invoiceId: string,
    file: DocumentPickerResponse,
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('attachments', {
      uri: file.uri,
      name: file.name ?? 'attachment.pdf',
      type: file.type ?? 'application/octet-stream',
    } as any);
    const response = await axiosInstance.post(
      ApiEndPoints.apiUploadInvoiceAttachment(invoiceId),
      formData,
      {isFormData: true, authRequired: true} as any,
    );
    return response.data;
  },

  /** DELETE `/invoice/:attachmentId` (attachment row id, not invoice uuid) */
  deleteInvoiceAttachment: async (attachmentId: number | string): Promise<any> => {
    const response = await axiosInstance.delete(
      ApiEndPoints.apiDeleteInvoiceAttachment(attachmentId),
      {authRequired: true} as any,
    );
    return response.data;
  },

  /**
   * Approval history for an invoice (GET /invoice/logs/:invoiceId)
   * Returns array of { id, action, action_by_role, remark, action_at, user, rejection_reason }
   */
  getInvoiceApprovalHistory: async (invoiceId: string): Promise<InvoiceApprovalLogApi[]> => {
    const response = await axiosInstance.get(
      ApiEndPoints.apiGetInvoiceApprovalLogs(invoiceId),
      {authRequired: true} as any,
    );
    const body = response?.data as any;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.logs)) return body.logs;
    if (Array.isArray(body?.approvalHistory)) return body.approvalHistory;
    return [];
  },

  updateInvoiceStatus: async (
    payload: UpdateInvoiceStatusPayload,
  ): Promise<any> => {
    const {invoiceId, action, approvalLevel, remark} = payload;
    const body = {
      action,
      approval_level: approvalLevel,
      remark: remark ?? '',
    };
    const response = await axiosInstance.patch(
      ApiEndPoints.apiUpdateInvoiceStatus(invoiceId),
      body,
      {authRequired: true} as any,
    );
    return response.data;
  },

  /**
   * CashnTech admin verification: PATCH /invoice/admin/:invoiceId
   * Body: { action: 'Verify' | 'Reject', remark: string }
   */
  updateInvoiceVerification: async (
    payload: UpdateInvoiceVerificationPayload,
  ): Promise<any> => {
    const {invoiceId, action, remark} = payload;
    const response = await axiosInstance.patch(
      ApiEndPoints.apiUpdateInvoiceVerification(invoiceId),
      { action, remark: remark ?? '' },
      {authRequired: true} as any,
    );
    return response.data;
  },

  /**
   * CashnTech admin bulk verification: PATCH /invoice/admin/bulk-status
   * Payload: { action: 'Verify' | 'Approve' | 'Reject' | 'On Hold', invoices: [{ invoiceId, action, remark, approvalRemark }] }
   */
  bulkUpdateInvoiceVerification: async (payload: {
    action: 'Verify' | 'Approve' | 'Reject' | 'On Hold';
    invoices: {
      invoiceId: string;
      action: string;
      remark: string;
      approvalRemark?: string;
    }[];
  }): Promise<any> => {
    const response = await axiosInstance.patch(
      ApiEndPoints.apiBulkUpdateInvoiceVerification,
      payload,
      {authRequired: true} as any,
    );
    return response.data;
  },

  /**
   * Regular user bulk approval: PATCH /invoice/bulk-update-status
   * Payload: { action: 'Approve' | 'Reject', invoices: [{ invoiceId, action, approval_level, remark }] }
   */
  bulkUpdateInvoiceStatus: async (payload: {
    action: 'Approve' | 'Reject';
    invoices: {
      invoiceId: string;
      action: string;
      approval_level: number;
      remark: string;
    }[];
  }): Promise<any> => {
    const response = await axiosInstance.patch(
      ApiEndPoints.apiBulkUpdateInvoiceStatus,
      payload,
      {authRequired: true} as any,
    );
    return response.data;
  },

  /** Verified invoices (admin_status=Verified). Supports filter payload for API-side filtering. */
  getVerifiedList: async (
    programIds?: string[],
    filters?: {
      bankIds?: string[];
      programIds?: string[];
      productIds?: string[];
      partyIds?: string[];
      counterPartyIds?: string[];
      byInvoiceStatus?: string[];
    },
  ): Promise<any[]> => {
    const body: Record<string, unknown> = {};
    const progIds = filters?.programIds?.length ? filters.programIds : programIds;
    if (progIds?.length) (body as any).programIds = progIds;
    if (filters?.bankIds?.length) (body as any).bankIds = filters.bankIds;
    if (filters?.productIds?.length) (body as any).productIds = filters.productIds;
    if (filters?.partyIds?.length) (body as any).partyIds = filters.partyIds;
    if (filters?.counterPartyIds?.length)
      (body as any).counterPartyIds = filters.counterPartyIds;
    if (filters?.byInvoiceStatus?.length)
      (body as any).byInvoiceStatus = filters.byInvoiceStatus;
    const response = await axiosInstance.post(
      ApiEndPoints.apiVerifiedList,
      body,
      {authRequired: true} as any,
    );
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /** Disbursed / closed invoices for interest accrual list */
  getDisbursedList: async (
    programIds?: string[],
    options?: {byInvoiceStatus?: string[]},
  ): Promise<any[]> => {
    const body: Record<string, unknown> = {
      byInvoiceStatus: options?.byInvoiceStatus ?? ['Disbursed', 'Closed'],
    };
    if (programIds?.length) (body as any).programIds = programIds;
    const response = await axiosInstance.post(
      ApiEndPoints.apiDisbursedList,
      body,
      {authRequired: true, timeout: 60000} as any,
    );
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /** Daily interest rows for a single invoice */
  getDailyInterest: async (invoiceId: string): Promise<DailyInterestApiRow[]> => {
    const response = await axiosInstance.post(
      ApiEndPoints.apiInvoiceDailyInterest(invoiceId),
      {},
      {authRequired: true} as any,
    );
    const data = response?.data;
    if (Array.isArray(data)) return data as DailyInterestApiRow[];
    if (data?.data && Array.isArray(data.data)) return data.data as DailyInterestApiRow[];
    return [];
  },

  /** Mail to Bank - updates invoice_status to Submitted (DB only, no email) */
  mailToBank: async (invoiceId: string): Promise<any> => {
    const response = await axiosInstance.post(
      ApiEndPoints.apiMailToBank(invoiceId),
      {},
      {authRequired: true} as any,
    );
    return response.data;
  },

  /** Bulk email to bank */
  bulkEmailToBank: async (payload: {invoiceIds: string[]}): Promise<any> => {
    const response = await axiosInstance.post(
      ApiEndPoints.apiBulkEmail,
      payload,
      {authRequired: true} as any,
    );
    return response.data;
  },

  /** Bank accounts for disbursement (Debit From dropdown) */
  getBankAccountsForDisbursement: async (invoiceId: string): Promise<any> => {
    const response = await axiosInstance.get(
      ApiEndPoints.apiTransactionAccount(invoiceId),
      {authRequired: true} as any,
    );
    return response?.data?.data ?? response?.data;
  },

  /** Mark invoice as disbursed */
  markAsDisbursed: async (
    invoiceId: string,
    payload: MarkAsDisbursedPayload,
  ): Promise<any> => {
    const response = await axiosInstance.post(
      ApiEndPoints.apiDisbursement(invoiceId),
      payload,
      {authRequired: true} as any,
    );
    return response.data;
  },

  /** Mark multiple invoices as disbursed (BulkInvoiceDisbursementDto) */
  bulkDisbursement: async (payload: {
    invoices: {
      invoiceId: string;
      status: string;
      utr_no?: string;
      transaction_no?: string;
      disbursed_amount: number;
      disbursement_date?: string;
      remark?: string;
      hold_category?: string;
      expected_release_date?: string;
      rejection_reason?: string;
    }[];
  }): Promise<any> => {
    const response = await axiosInstance.post(
      ApiEndPoints.apiBulkDisbursement,
      payload,
      {authRequired: true} as any,
    );
    return response.data;
  },

  createInvoice: async (input: CreateInvoicePayloadInput): Promise<any> => {
    const payload = buildCreateInvoicePayload(input);
    
    const formData = new FormData();
    const items = payload.items as any[];
    
    // Append all fields except items
    for (const [key, value] of Object.entries(payload)) {
      if (key !== 'items' && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    }
    
    // Append items with array notation
    items.forEach((item, index) => {
      formData.append(`items[${index}][name]`, String(item.name || ''));
      formData.append(`items[${index}][description]`, String(item.description || ''));
      formData.append(`items[${index}][created_by]`, String(item.created_by || ''));
      formData.append(`items[${index}][quantity]`, String(item.quantity || 0));
      formData.append(`items[${index}][unit]`, String(item.unit || '1'));
      formData.append(`items[${index}][price_per_quantity]`, String(item.price_per_quantity || 0));
      formData.append(`items[${index}][total]`, String(item.total || 0));
      
      if (item.discount_type) {
        formData.append(`items[${index}][discount_type]`, String(item.discount_type));
      }
      if (item.discount_value !== undefined && item.discount_value !== null) {
        formData.append(`items[${index}][discount_value]`, String(item.discount_value));
      }
      if (item.discount_amount !== undefined && item.discount_amount !== null) {
        formData.append(`items[${index}][discount_amount]`, String(item.discount_amount));
      }
      
      if (item.taxes && item.taxes.length > 0) {
        item.taxes.forEach((tax: any, taxIndex: number) => {
          formData.append(`items[${index}][taxes][${taxIndex}][tax_type]`, String(tax.tax_type || ''));
          formData.append(`items[${index}][taxes][${taxIndex}][tax_percentage]`, String(tax.tax_percentage || 0));
          formData.append(`items[${index}][taxes][${taxIndex}][tax_amount]`, String(tax.tax_amount || 0));
        });
      }
    });
    
    if (input.attachment) {
      formData.append('attachments', {
        uri: input.attachment.uri,
        name: input.attachment.name ?? 'invoice.pdf',
        type: input.attachment.type ?? 'application/pdf',
      } as any);
    }

    const response = await axiosInstance.post(ApiEndPoints.apiCreateInvoice, formData, {
      isFormData: true,
      authRequired: true,
    } as any);
    return response.data;
  },
  /**
   * TODO: Enable this when PATCH /invoice/:id is ready on backend.
   * Currently commented out as requested.
   */
  updateInvoice: async (input: UpdateInvoicePayload): Promise<any> => {
    const {invoiceId, fields, attachment, approval_level, createdBy} = input;
    
    // Manually calculate totals for the update payload
    const subtotal = fields.items.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0);
    const discountTotal = fields.items.reduce(
      (sum: number, item: any) => sum + (parseFloat(item.discountAmount || '0') || 0),
      0,
    );
    const taxTotal = fields.items.reduce(
      (sum: number, item: any) => sum + (parseFloat(item.taxAmount || '0') || 0),
      0,
    );
    const finalTotalValue = Math.max(0, subtotal - discountTotal + taxTotal);

    const items = fields.items.map((item: any) => {
      const unitNum = UNIT_MAP[item.unit?.toUpperCase()] ?? 1;
      const baseItem: any = {
        name: item.itemName?.trim() || '',
        description: (item.description?.trim() || item.itemName?.trim() || ''),
        created_by: createdBy,
        quantity: Ue(item.quantity),
        unit: String(unitNum),
        price_per_quantity: Ue(item.pricePerQuantity),
        total: Ue(item.total),
      };
      
      // Crucial: Backend needs the existing item ID if we want to update it instead of creating new ones
      if (item.id) {
        baseItem.id = item.id;
      }

      if (item.discountType && item.discountValue) {
        baseItem.discount_type = item.discountType === 'value' ? 'absolute' : item.discountType;
        baseItem.discount_value = Ue(item.discountValue);
        baseItem.discount_amount = Ue(item.discountAmount || '0');
      }
      
      const taxesArray = item.taxes?.filter((t: any) => t.taxType) || [];
      if (taxesArray.length > 0) {
        baseItem.taxes = taxesArray.map((t: any) => ({
          tax_type: t.taxType,
          tax_percentage: Ue(t.taxPercentage || '0'),
          tax_amount: Ue(t.taxAmount || '0'),
        }));
      }
      return baseItem;
    });

    const payload: any = {
      approval_level: Number(approval_level ?? 1),
      tenor: parseTenorDays(fields.tenor),
      invoice_ref_no: fields.invoiceNumber || '',
      invoice_date: toYYYYMMDD(fields.invoiceDate),
      invoice_due_date: toYYYYMMDD(fields.invoiceDueDate),
      currency: fields.currency || 'INR',
      remark: fields.remark || '',
      sub_total: Ue(subtotal),
      discount_total: Ue(discountTotal),
      tax_total: Ue(taxTotal),
      final_total: Ue(finalTotalValue),
      // Add counter-party information for update
      counter_party_name: fields.dealer || '',
      counter_party_code: fields.dealerCode || '',
      counter_party_od_account: fields.odAccountNumber || '',
      credit_to: fields.creditTo || '',
      items,
    };

    if (fields.grnDate?.trim()) {
      payload.grn_date = toYYYYMMDD(fields.grnDate);
    }
    if (fields.paymentDate?.trim()) {
      payload.payment_date = toYYYYMMDD(fields.paymentDate);
    }
    const poRefUpdate = fields.associatedPO?.trim();
    if (poRefUpdate) {
      payload.po_ref_no = poRefUpdate;
    }

    if (attachment) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (key !== 'items' && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      
      (payload.items as any[]).forEach((item, index) => {
        if (item.id) formData.append(`items[${index}][id]`, item.id);
        formData.append(`items[${index}][name]`, item.name);
        formData.append(`items[${index}][description]`, item.description);
        formData.append(`items[${index}][quantity]`, String(item.quantity));
        formData.append(`items[${index}][unit]`, String(item.unit));
        formData.append(`items[${index}][price_per_quantity]`, String(item.price_per_quantity));
        formData.append(`items[${index}][total]`, String(item.total));
        if (item.discount_type) formData.append(`items[${index}][discount_type]`, item.discount_type);
        if (item.discount_value !== undefined) formData.append(`items[${index}][discount_value]`, String(item.discount_value));
        if (item.discount_amount !== undefined) formData.append(`items[${index}][discount_amount]`, String(item.discount_amount));
        if (item.taxes) {
          item.taxes.forEach((tax: any, tIdx: number) => {
            formData.append(`items[${index}][taxes][${tIdx}][tax_type]`, tax.tax_type);
            formData.append(`items[${index}][taxes][${tIdx}][tax_percentage]`, String(tax.tax_percentage));
            formData.append(`items[${index}][taxes][${tIdx}][tax_amount]`, String(tax.tax_amount));
          });
        }
      });
      
      formData.append('attachments', {
        uri: attachment.uri,
        name: attachment.name ?? 'invoice_update.pdf',
        type: attachment.type ?? 'application/pdf',
      } as any);

      const response = await axiosInstance.patch(ApiEndPoints.apiUpdateInvoice(invoiceId), formData, {
        isFormData: true,
        authRequired: true,
      } as any);
      return response.data;
    }

    const response = await axiosInstance.patch(ApiEndPoints.apiUpdateInvoice(invoiceId), payload, {
      authRequired: true,
    } as any);
    return response.data;
  },

  deleteInvoice: async (invoiceId: string): Promise<any> => {
    const response = await axiosInstance.delete(ApiEndPoints.apiInvoiceById(invoiceId), {
      authRequired: true,
    } as any);
    return response.data;
  },

  deleteInvoiceItem: async (itemId: string): Promise<any> => {
    const response = await axiosInstance.delete(ApiEndPoints.apiDeleteInvoiceItem(itemId), {
      authRequired: true,
    } as any);
    return response.data;
  },

  deleteInvoiceItemTax: async (itemTaxId: string): Promise<any> => {
    const response = await axiosInstance.delete(ApiEndPoints.apiDeleteInvoiceItemTax(itemTaxId), {
      authRequired: true,
    } as any);
    return response.data;
  },
};
