import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';
import type {DocumentPickerResponse} from '@react-native-documents/picker';

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
};

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
  anchorParticipantMapping: string;
  party: string;
  counterPartyName: string;
  counterPartyCode: string;
  counterPartyOdAccount: string;
  attachment?: DocumentPickerResponse | null;
};

function buildCreateInvoicePayload(input: CreateInvoicePayloadInput): Record<string, unknown> {
  const {fields, createdBy, partnerBank, program, anchorParticipantMapping, party, counterPartyName, counterPartyCode, counterPartyOdAccount} = input;

  const subtotal = fields.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const discountType = fields.discountType || '';
  const discountValue = parseFloat(fields.discountValue || '0') || 0;
  let discountTotal = 0;
  if (discountType === 'percentage' && discountValue > 0) {
    discountTotal = (subtotal * discountValue) / 100;
  } else if ((discountType === 'absolute' || discountType === 'flat') && discountValue > 0) {
    discountTotal = discountValue;
  }
  const finalAmount = Math.max(0, subtotal - discountTotal);
  const cgst = fields.cgst ? parseFloat(fields.cgst) : finalAmount * 0.025;
  const sgst = fields.sgst ? parseFloat(fields.sgst) : finalAmount * 0.025;
  const taxTotal = cgst + sgst;
  const finalTotalValue = finalAmount + taxTotal;

  const items = fields.items.map((item: InvoiceLineItem) => {
    const unitNum = UNIT_MAP[item.unit?.toUpperCase()] ?? 1;
    const baseItem: Record<string, unknown> = {
      name: item.itemName?.trim() || '',
      description: item.itemName?.trim() || '',
      created_by: createdBy,
      quantity: parseFloat(item.quantity) || 0,
      unit: unitNum,
      price_per_quantity: parseFloat(item.pricePerQuantity) || 0,
      total: parseFloat(item.total) || 0,
    };
    if (item.discountType && item.discountValue) {
      const discountType = item.discountType === 'value' ? 'absolute' : item.discountType;
      baseItem.discount_type = discountType;
      baseItem.discount_value = parseFloat(item.discountValue) || 0;
      baseItem.discount_amount = parseFloat(item.discountAmount || '0') || 0;
    }
    if (item.taxType && (item.taxPercentage || item.taxAmount)) {
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
    payment_date: toYYYYMMDD(fields.paymentDate),
    currency: fields.currency || 'INR',
    remark: fields.remark || '',
    created_by: createdBy,
    partnerBank,
    program,
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

  return payload;
}

export const invoiceApi = {
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

  createInvoice: async (input: CreateInvoicePayloadInput): Promise<any> => {
    const payload = buildCreateInvoicePayload(input);
    // Debug: print exact request body being sent to backend
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log('[CreateInvoice] request payload:', JSON.stringify(payload, null, 2));
    }

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
      
      formData.append('attachment', {
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
};
