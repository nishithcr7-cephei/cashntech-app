export type InvoiceLineItem = {
  itemName: string;
  quantity: string;
  unit: string;
  pricePerQuantity: string;
  total: string; // Auto calculated
};

export type InvoiceFields = {
  // Dealer Information Section
  dealer: string;
  dealerCode: string;
  odAccountNumber: string;

  // Invoice Details Section
  invoiceNumber: string; // Invoice / Unique Ref. No
  associatedPO: string;
  invoiceDate: string; // can be textual like "October 30, 2025"
  invoiceDueDate: string;

  // Additional Invoice Information
  earlyPaymentDiscount: string; // Percentage
  currency: string;
  remark: string;

  // Line Items
  items: InvoiceLineItem[];

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


