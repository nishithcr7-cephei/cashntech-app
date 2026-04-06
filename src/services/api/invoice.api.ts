import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';
import type {DocumentPickerResponse} from '@react-native-documents/picker';
import type {InvoiceListItemApi, UpdateInvoicePayload} from '@store/invoice/inv.types';

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

function toYYYYMMDD(dateStr: string): string {
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
      quantity: parseFloat(item.quantity) || 0,
      unit: String(unitNum),
      price_per_quantity: parseFloat(item.pricePerQuantity) || 0,
      total: parseFloat(item.total) || 0,
    };
    if (item.discountType && item.discountValue) {
      const discountType = item.discountType === 'value' ? 'absolute' : item.discountType;
      baseItem.discount_type = discountType;
      baseItem.discount_value = parseFloat(item.discountValue) || 0;
      baseItem.discount_amount = parseFloat(item.discountAmount || '0') || 0;
    }
    const taxesArray = item.taxes?.filter(t => t.taxType) || [];
    if (taxesArray.length > 0) {
      baseItem.taxes = taxesArray.map(t => ({
        tax_type: t.taxType,
        tax_percentage: parseFloat(t.taxPercentage || '0') || 0,
        tax_amount: parseFloat(t.taxAmount || '0') || 0,
      }));
    } else if (item.taxType && (item.taxPercentage || item.taxAmount)) {
      baseItem.taxes = [{
        tax_type: item.taxType,
        tax_percentage: parseFloat(item.taxPercentage || '0') || 0,
        tax_amount: parseFloat(item.taxAmount || '0') || 0,
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
    sub_total: Math.round(subtotal * 100) / 100,
    discount_total: Math.round(discountTotal * 100) / 100,
    tax_total: Math.round(taxTotal * 100) / 100,
    final_total: Math.round(finalTotalValue * 100) / 100,
    items,
  };

  if (fields.grnDate?.trim()) {
    payload.grn_date = toYYYYMMDD(fields.grnDate);
  }
  if (fields.paymentDate?.trim()) {
    payload.payment_date = toYYYYMMDD(fields.paymentDate);
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
  dpd_days: string;
};

export const invoiceApi = {
  getInvoiceList: async (
    programId: string,
    filters?: InvoiceListFilters,
  ): Promise<InvoiceListItemApi[]> => {
    const body: Record<string, unknown> = {
      ...(filters ?? {}),
    };

    // Mikro-ORM filter 'programIds' expects args in the shape:
    // { program_id: string[] }
    // so we must wrap the programId accordingly.
    if (programId) {
      (body as any).programIds = { program_id: [programId] };
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
    return response.data;
  },

  getBankProductList: async (): Promise<any> => {
    const response = await axiosInstance.get(ApiEndPoints.apiBankProductList, {
      authRequired: true,
    } as any);
    return response.data;
  },

  getInvoiceSummary: async (
    programIds?: string[],
  ): Promise<any> => {
    const body: any = {
      programIds: (programIds && programIds.length === 1) ? programIds[0] : (programIds ?? []),
    };
    // eslint-disable-next-line no-console
    console.log('[InvoiceSummary] POST Body:', JSON.stringify(body));
    const response = await axiosInstance.post(
      ApiEndPoints.apiInvoiceSummary,
      body,
      {authRequired: true} as any,
    );
    // Extract nested data structure: response.data.data contains the actual array
    const data = response?.data?.data ?? response?.data ?? [];
    return {data};
  },

  getLatestInvoices: async (
    programIds?: string[],
  ): Promise<any> => {
    const body: any = {
      programIds: (programIds && programIds.length === 1) ? programIds[0] : (programIds ?? []),
    };
    // eslint-disable-next-line no-console
    console.log('[InvoiceLatest] POST Body:', JSON.stringify(body));
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
    const body: any = {
      programIds: (programIds && programIds.length === 1) ? programIds[0] : (programIds ?? []),
    };
    // eslint-disable-next-line no-console
    console.log('[InvoiceKpis] POST Body:', JSON.stringify(body));
    const response = await axiosInstance.post(
      ApiEndPoints.apiInvoiceKpis,
      body,
      {authRequired: true} as any,
    );
    const raw = response?.data?.data ?? {};
    return {
      total_program_limit: raw.total_program_limit ?? '0',
      utilized_amount: raw.utilized_amount ?? '0',
      utilized_rate: raw.utilized_rate ?? '0',
      active_dealer_ratio: raw.active_dealer_ratio ?? '0',
      available_limit: raw.available_limit ?? '0',
      overdue_amount: raw.overdue_amount ?? '0',
      dpd_days: raw.dpd_days ?? '0',
    };
  },

  getInvoiceDetails: async (invoiceId: string): Promise<any> => {
    const response = await axiosInstance.get(
      ApiEndPoints.apiGetInvoiceDetails(invoiceId),
      {authRequired: true} as any,
    );
    const data = response?.data;
    return data?.data ?? data;
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
    if (progIds?.length) (body as any).programIds = { program_id: progIds };
    if (filters?.bankIds?.length) (body as any).bankIds = { bank_id: filters.bankIds };
    if (filters?.productIds?.length) (body as any).productIds = { product_id: filters.productIds };
    if (filters?.partyIds?.length) (body as any).partyIds = { party_id: filters.partyIds };
    if (filters?.counterPartyIds?.length)
      (body as any).counterPartyIds = { counter_party_id: filters.counterPartyIds };
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

  /** Disbursed invoices (invoice_status=Disbursed) */
  getDisbursedList: async (programIds?: string[]): Promise<any[]> => {
    const body: Record<string, unknown> = {};
    if (programIds?.length) (body as any).programIds = programIds; // Backend uses program: body.programIds
    const response = await axiosInstance.post(
      ApiEndPoints.apiDisbursedList,
      body,
      {authRequired: true} as any,
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

  createInvoice: async (input: CreateInvoicePayloadInput): Promise<any> => {
    console.log('[invoice.api] createInvoice called with input:', input);
    const payload = buildCreateInvoicePayload(input);
    // Log exact request body sent to backend (sub_total, final_total, items, etc.)
    // eslint-disable-next-line no-console
    console.log('[CreateInvoice] API body (sent to backend):', JSON.stringify(payload, null, 2));

    if (input.attachment) {
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
        formData.append(`items[${index}][name]`, item.name);
        formData.append(`items[${index}][description]`, item.description);
        formData.append(`items[${index}][created_by]`, item.created_by);
        formData.append(`items[${index}][quantity]`, String(item.quantity));
        formData.append(`items[${index}][unit]`, String(item.unit));
        formData.append(`items[${index}][price_per_quantity]`, String(item.price_per_quantity));
        formData.append(`items[${index}][total]`, String(item.total));
        
        if (item.discount_type) {
          formData.append(`items[${index}][discount_type]`, item.discount_type);
        }
        if (item.discount_value !== undefined && item.discount_value !== null) {
          formData.append(`items[${index}][discount_value]`, String(item.discount_value));
        }
        if (item.discount_amount !== undefined && item.discount_amount !== null) {
          formData.append(`items[${index}][discount_amount]`, String(item.discount_amount));
        }
        
        if (item.taxes && item.taxes.length > 0) {
          item.taxes.forEach((tax: any, taxIndex: number) => {
            formData.append(`items[${index}][taxes][${taxIndex}][tax_type]`, tax.tax_type);
            formData.append(`items[${index}][taxes][${taxIndex}][tax_percentage]`, String(tax.tax_percentage));
            formData.append(`items[${index}][taxes][${taxIndex}][tax_amount]`, String(tax.tax_amount));
          });
        }
      });
      
      formData.append('attachments', {
        uri: input.attachment.uri,
        name: input.attachment.name ?? 'invoice.pdf',
        type: input.attachment.type ?? 'application/pdf',
      } as any);

      const response = await axiosInstance.post(ApiEndPoints.apiCreateInvoice, formData, {
        isFormData: true,
        authRequired: true,
      } as any);
      return response.data;
    }

    const response = await axiosInstance.post(ApiEndPoints.apiCreateInvoice, payload, {
      headers: {'Content-Type': 'application/json'},
      authRequired: true,
    } as any);
    return response.data;
  },
  /**
   * TODO: Enable this when PATCH /invoice/:id is ready on backend.
   * Currently commented out as requested.
   */
  updateInvoice: async (input: UpdateInvoicePayload): Promise<any> => {
    const {invoiceId, fields, attachment, approval_level} = input;
    
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
      const baseItem: Record<string, unknown> = {
        name: item.itemName?.trim() || '',
        description: (item.description?.trim() || item.itemName?.trim() || ''),
        quantity: parseFloat(item.quantity) || 0,
        unit: String(unitNum),
        price_per_quantity: parseFloat(item.pricePerQuantity) || 0,
        total: parseFloat(item.total) || 0,
      };
      
      // Crucial: Backend needs the existing item ID if we want to update it instead of creating new ones
      if (item.id) {
        baseItem.id = item.id;
      }

      if (item.discountType && item.discountValue) {
        const discountType = item.discountType === 'value' ? 'absolute' : item.discountType;
        baseItem.discount_type = discountType;
        baseItem.discount_value = parseFloat(item.discountValue) || 0;
        baseItem.discount_amount = parseFloat(item.discountAmount || '0') || 0;
      }
      
      const taxesArray = item.taxes?.filter((t: any) => t.taxType) || [];
      if (taxesArray.length > 0) {
        baseItem.taxes = taxesArray.map((t: any) => ({
          tax_type: t.taxType,
          tax_percentage: parseFloat(t.taxPercentage || '0') || 0,
          tax_amount: parseFloat(t.taxAmount || '0') || 0,
        }));
      }
      return baseItem;
    });

    const payload: Record<string, unknown> = {
      approval_level: Number(approval_level ?? 1),
      invoice_date: toIsoString(fields.invoiceDate),
      invoice_due_date: toIsoString(fields.invoiceDueDate),
      currency: fields.currency || 'INR',
      remark: fields.remark || '',
      sub_total: Number((Math.round(subtotal * 100) / 100).toFixed(2)),
      discount_total: Number((Math.round(discountTotal * 100) / 100).toFixed(2)),
      tax_total: Number((Math.round(taxTotal * 100) / 100).toFixed(2)),
      final_total: Number((Math.round(finalTotalValue * 100) / 100).toFixed(2)),
      items,
    };

    if (fields.grnDate?.trim()) {
      payload.grn_date = toIsoString(fields.grnDate);
    }
    if (fields.paymentDate?.trim()) {
      payload.payment_date = toIsoString(fields.paymentDate);
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
    const response = await axiosInstance.delete(ApiEndPoints.apiUpdateInvoice(invoiceId), {
      authRequired: true,
    } as any);
    return response.data;
  },
};
