// Contact Us Types
export interface ContactFormData {
  companyName: string;
  sector: string;
  name: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  monthlyTurnover: string;
  estimatedFunding: string;
  message: string;
  captcha: string;
}

export interface ContactApiRequest {
  firm_name: string; // Encrypted
  name_of_client: string; // Encrypted
  contact_number: string; // Encrypted
  email: string; // Encrypted
  message: string; // Not encrypted
  monthly_turnover: string; // Not encrypted - must be string
  estimated_funding_required: string; // Not encrypted - must be string
  source_of_lead: string; // Not encrypted
  sector: string; // Not encrypted
}

export interface ContactApiResponse {
  statusCode: number;
  message: string;
}

export interface ContactState {
  formData: ContactFormData;
  loading: boolean;
  error: string | null;
  success: boolean;
  captchaText: string;
  serverResponse: ContactApiResponse | null;
}

export const initialContactState: ContactState = {
  formData: {
    companyName: '',
    sector: '',
    name: '',
    email: '',
    phoneCode: '+91',
    phoneNumber: '',
    monthlyTurnover: '',
    estimatedFunding: '',
    message: '',
    captcha: '',
  },
  loading: false,
  error: null,
  success: false,
  captchaText: '9 2 q a j f',
  serverResponse: null,
};

// Register Types (updated for new API)
export interface RegisterFormData {
  sector: string;
  companyName: string;
  gstNumber: string;
  gstCertificate: any; // DocumentPickerResponse or similar
  state: string;
  city: string;
  address: string;
  pinCode: string;
  directCFASuppliers: string[];
  // Owner 1 details
  owner1FullName: string;
  owner1EmailId: string;
  owner1MobileNumber: string;
  // Owner 2 details
  owner2FullName: string;
  owner2EmailId: string;
  owner2MobileNumber: string;
  captcha: string;
}

export interface RegisterApiRequest {
  company_name: string;
  sector: string;
  state: string;
  city: string;
  gst_number: string;
  address: string;
  pin_code: string;
  gstDoc: any; // File object
  client_details: Array<{
    name_of_client: string;
    contact_number: string;
    email: string;
  }>;
  company_list: string[];
}

export interface RegisterApiResponse {
  statusCode: number;
  message: string;
}

export interface RegisterState {
  formData: RegisterFormData;
  loading: boolean;
  error: string | null;
  success: boolean;
  captchaImage: string;
  serverResponse: RegisterApiResponse | null;
}

export const initialRegisterState: RegisterState = {
  formData: {
    sector: '',
    companyName: '',
    gstNumber: '',
    gstCertificate: null,
    state: '',
    city: '',
    address: '',
    pinCode: '',
    directCFASuppliers: [],
    // Owner 1 details
    owner1FullName: '',
    owner1EmailId: '',
    owner1MobileNumber: '',
    // Owner 2 details
    owner2FullName: '',
    owner2EmailId: '',
    owner2MobileNumber: '',
    captcha: '',
  },
  loading: false,
  error: null,
  success: false,
  captchaImage: 'F C R T N F',
  serverResponse: null,
};

// GST Lookup Types
export interface InboundClient {
  id: number;
  name_of_client: string; // Encrypted
  email: string; // Encrypted
  contact_number: string; // Encrypted
}

export interface GstLookupApiResponse {
  statusCode: number;
  data: {
    registration_id: string;
    inboundClient: InboundClient[];
  };
}

export interface GstLookupState {
  loading: boolean;
  error: string | null;
  clientDetails: InboundClient[] | null;
  registrationId: string | null;
}

// Apply Types
export interface ApplyFormData {
  gstin: string;
  isRegistered: boolean;
  fullName: string;
  emailId: string;
  mobileNumber: string;
  applyFor: string;
  companySapCode: string;
  purchasePeriod: string;
  invoiceFile: any;
  captcha: string;
}

export interface ApplyApiResponse {
  statusCode: number;
  message: string;
}

export interface ApplyState {
  formData: ApplyFormData;
  loading: boolean;
  error: string | null;
  success: boolean;
  serverResponse: ApplyApiResponse | null;
}

export const initialApplyState: ApplyState = {
  formData: {
    gstin: '',
    isRegistered: false,
    fullName: '',
    emailId: '',
    mobileNumber: '',
    applyFor: '',
    companySapCode: '',
    purchasePeriod: '',
    invoiceFile: null,
    captcha: '',
  },
  loading: false,
  error: null,
  success: false,
  serverResponse: null,
};