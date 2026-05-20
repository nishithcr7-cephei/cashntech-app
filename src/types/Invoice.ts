export type InvoiceItemTax = {
  taxType: string;
  taxPercentage?: string;
  taxAmount?: string;
};

export type InvoiceLineItem = {
  id?: string;
  itemName: string;
  description?: string; // Optional item description
  quantity: string;
  unit: string;
  pricePerQuantity: string;
  total: string; // Auto calculated (qty * price)
  // Item-level discount
  discountType?: string; // 'percentage' | 'value' | ''
  discountValue?: string; // Discount percentage or amount
  discountAmount?: string; // Auto calculated discount amount
  // Item-level tax (legacy single tax - used when taxes array empty)
  taxType?: string; // 'GST' | 'CGST' | 'OTHER' | ''
  taxPercentage?: string; // Tax percentage
  taxAmount?: string; // Auto calculated tax amount
  // Multiple taxes per item
  taxes?: InvoiceItemTax[];
};

export type InvoiceFields = {
  // Dealer Information Section
  dealer: string;
  dealerCode: string;
  odAccountNumber: string;

  // Invoice Details Section
  invoiceNumber: string; // Invoice / Unique Ref. No
  associatedPO: string;
  /** Invoice tenor in days (maps to backend `tenor`) */
  tenor: string;
  invoiceDate: string; // can be textual like "October 30, 2025"
  paymentDate: string; // Payment Date
  invoiceDueDate: string; // Invoice Due Date
  grnDate: string; // GRN Date (Goods Receipt Note Date) - Optional

  // Additional Invoice Information
  earlyPaymentDiscount: string; // Percentage
  currency: string;
  creditTo: string; // Credit To (bank account)
  remark: string;

  // Line Items
  items: InvoiceLineItem[];

  // Discount Fields
  discountType: string; // 'percentage' | 'absolute' | ''
  discountValue: string; // Discount amount or percentage

  // Tax Summary (Footer)
  subtotal?: string;
  taxTotal?: string;
  discountTotal?: string;
  cgst: string; // Central GST
  sgst: string; // State GST
  grandTotal: string; // Grand Total (Final Amount + CGST + SGST)

  // Attachments
  attachments?: {id: number; attachment_url: string}[];

  // Legacy fields (keep for backward compatibility / additional extraction)
  vendorName?: string;
  memberName?: string;
  memberId?: string;
  phone?: string;
  email?: string;
  program?: string;
  startDate?: string;
  expiryDate?: string;
  amount?: string;
  taxableAmount?: string;
  finalAmount?: string;
  paidAmount?: string;
  dueAmount?: string;
  gstNumber?: string;
  totalAmount?: string;
  taxAmount?: string;
  amountInWords?: string;
};

export type OcrResult = {
  rawText: string;
  fields: Partial<InvoiceFields>;
};


