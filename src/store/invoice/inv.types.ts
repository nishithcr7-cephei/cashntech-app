export type DealerInfoParticipant = {
  id: string;
  company_code: string;
  company_code_given_by_party: string;
  od_account_no: string;
  party: {id: string; entity_name: string};
};

export type PartyBankDetail = {
  id: string;
  account_number: string;
};

export type DealerInfoResponse = {
  id: string;
  program_name: string;
  party: {
    id: string;
    party_bank_details: PartyBankDetail[];
  };
  participants: DealerInfoParticipant[];
};

export type PartnerBank = {
  id: string;
  bank_id: string;
  bank_name: string;
};

export type InvoiceListItemApi = {
  id: string;
  invoice_ref_no: string;
  counter_party_name: string;
  counter_party_code: string;
  invoice_amount?: string;
  invoice_date: string;
  request_date?: string;
  invoice_due_date: string;
  invoice_status: string;
  approval_status: string;
  admin_status?: string;
};

export type InvoiceState = {
  dealerInfo: DealerInfoResponse | null;
  dealerInfoLoading: boolean;
  dealerInfoError: string | null;
  bankList: PartnerBank[];
  bankListLoading: boolean;
  bankListError: string | null;
  createInvoiceLoading: boolean;
  createInvoiceError: string | null;
  createInvoiceSuccess: boolean;
  createInvoiceResponse: unknown | null;
  invoiceList: InvoiceListItemApi[];
  invoiceListLoading: boolean;
  invoiceListError: string | null;
};

export const initialInvoiceState: InvoiceState = {
  dealerInfo: null,
  dealerInfoLoading: false,
  dealerInfoError: null,
  bankList: [],
  bankListLoading: false,
  bankListError: null,
  createInvoiceLoading: false,
  createInvoiceError: null,
  createInvoiceSuccess: false,
  createInvoiceResponse: null,
  invoiceList: [],
  invoiceListLoading: false,
  invoiceListError: null,
};
