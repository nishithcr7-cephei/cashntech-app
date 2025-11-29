import {API_URL} from '@config/config';
import {ContactApiRequest, ContactApiResponse, RegisterApiRequest, RegisterApiResponse} from '@store/registerweb/register.types';
import {encryptUtility} from '@utils/crypto';
import axiosInstance from './api';
import {CustomRequestConfig} from './api';
import Endpoints from '@constants/ApiEndPoints';

export const contactUsApi = {
  submitContactForm: async (formData: any): Promise<ContactApiResponse> => {
    try {
      console.log('Form Data Received:', formData);
      
      // Validate required fields
      if (!formData.companyName?.trim()) {
        throw new Error('Company name is required');
      }
      if (!formData.name?.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.email?.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.phoneNumber?.trim()) {
        throw new Error('Phone number is required');
      }

      // Create FormData object to match web implementation
      const formDataObj = new FormData();
      
      // Add encrypted fields
      formDataObj.append('firm_name', encryptUtility(formData.companyName));
      formDataObj.append('name_of_client', encryptUtility(formData.name));
      formDataObj.append('contact_number', encryptUtility(`${formData.phoneCode}${formData.phoneNumber}`));
      formDataObj.append('email', encryptUtility(formData.email));
      
      // Add non-encrypted fields
      formDataObj.append('message', formData.message || '');
      formDataObj.append('monthly_turnover', formData.monthlyTurnover || '0');
      formDataObj.append('estimated_funding_required', formData.estimatedFunding || '0');
      formDataObj.append('source_of_lead', 'Inbound (I)');
      formDataObj.append('sector', formData.sector || '');

      console.log('FormData created for API request');
      console.log('API URL:', `${API_URL}/client-info-master/contact-us`);
      
      // Debug: Log FormData contents to verify it matches web format
      console.log('=== FormData Contents (for debugging) ===');
      console.log('firm_name:', encryptUtility(formData.companyName));
      console.log('name_of_client:', encryptUtility(formData.name));
      console.log('contact_number:', encryptUtility(`${formData.phoneCode}${formData.phoneNumber}`));
      console.log('email:', encryptUtility(formData.email));
      console.log('message:', formData.message || '');
      console.log('monthly_turnover:', formData.monthlyTurnover || '0');
      console.log('estimated_funding_required:', formData.estimatedFunding || '0');
      console.log('source_of_lead:', 'Inbound (I)');
      console.log('sector:', formData.sector || '');
      console.log('=== End FormData Contents ===');

      // Use the existing API instance with FormData support
      const response = await axiosInstance.post('/client-info-master/contact-us', formDataObj, {
        isFormData: true,
        authRequired: false,
      } as CustomRequestConfig);
      
      console.log('=== API Response ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      console.log('API Success Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Contact Us API Error:', error);
      throw error;
    }
  },
};

export const gstLookupApi = {
  lookupGstDetails: async (gstNumber: string): Promise<any> => {
    try {
      console.log('GST Lookup API called with GST:', gstNumber);
      
      // Validate GST number
      if (!gstNumber?.trim()) {
        throw new Error('GST number is required');
      }

      // Encrypt the GST number
      const encryptedGst = encryptUtility(gstNumber);
      console.log('Encrypted GST:', encryptedGst);
      
      // Make API call to get client details
      const response = await axiosInstance.get(`/client-info-master/register/client-details/${encryptedGst}`, {
        authRequired: false,
      } as CustomRequestConfig);
      
      console.log('GST Lookup API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('GST Lookup API Error:', error);
      throw error;
    }
  },
};

export const applyApi = {
  submitApplication: async (formData: any, registrationId: string): Promise<any> => {
    try {
      console.log('Apply Form Data Received:', formData);
      console.log('Registration ID:', registrationId);
      
      // Validate required fields
      if (!formData.gstin?.trim()) {
        throw new Error('GSTIN is required');
      }
      if (!formData.fullName?.trim()) {
        throw new Error('Full name is required');
      }
      if (!formData.emailId?.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.mobileNumber?.trim()) {
        throw new Error('Mobile number is required');
      }
      if (!formData.applyFor?.trim()) {
        throw new Error('Apply for is required');
      }
      if (!formData.companySapCode?.trim()) {
        throw new Error('Company SAP code is required');
      }
      if (!formData.purchasePeriod?.trim()) {
        throw new Error('Purchase period is required');
      }
      if (!formData.invoiceFile) {
        throw new Error('Invoice file is required');
      }

      // Create FormData object to match API requirements
      const formDataObj = new FormData();
      
      // Add encrypted fields
      formDataObj.append('applied_for', formData.applyFor);
      formDataObj.append('company_sap_code', encryptUtility(formData.companySapCode));
      formDataObj.append('name_of_client', encryptUtility(formData.fullName));
      formDataObj.append('email', encryptUtility(formData.emailId));
      formDataObj.append('contact_number', encryptUtility(formData.mobileNumber));
      formDataObj.append('gst_in', encryptUtility(formData.gstin));
      formDataObj.append('quarterly_purchase_value', formData.purchasePeriod);
      formDataObj.append('is_registered', formData.isRegistered ? 'true' : 'false');
      formDataObj.append('params', 'Invoice');
      
      // Add invoice file
      formDataObj.append('cfaInvoice', {
        uri: formData.invoiceFile.uri,
        name: formData.invoiceFile.name,
        type: formData.invoiceFile.type,
      } as any);

      console.log('FormData created for Apply API request');
      console.log('API URL:', `${API_URL}/client-info-master/apply/${registrationId}`);
      
      // Debug: Log FormData contents
      console.log('=== Apply FormData Contents (for debugging) ===');
      console.log('applied_for:', formData.applyFor);
      console.log('company_sap_code:', encryptUtility(formData.companySapCode));
      console.log('name_of_client:', encryptUtility(formData.fullName));
      console.log('email:', encryptUtility(formData.emailId));
      console.log('contact_number:', encryptUtility(formData.mobileNumber));
      console.log('gst_in:', encryptUtility(formData.gstin));
      console.log('quarterly_purchase_value:', formData.purchasePeriod);
      console.log('is_registered:', formData.isRegistered ? 'true' : 'false');
      console.log('params:', 'Invoice');
      console.log('cfaInvoice type:', typeof formData.invoiceFile);
      console.log('cfaInvoice:', formData.invoiceFile);
      console.log('=== End Apply FormData Contents ===');

      // Use the existing API instance with FormData support
      const response = await axiosInstance.post(`/client-info-master/apply/${registrationId}`, formDataObj, {
        isFormData: true,
        authRequired: false,
      } as CustomRequestConfig);
      
      console.log('=== Apply API Response ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      console.log('Apply API Success Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Apply API Error:', error);
      throw error;
    }
  },
};

export const registerApi = {
  submitRegistration: async (formData: RegisterApiRequest): Promise<RegisterApiResponse> => {
    try {
      console.log('Registration Form Data Received:', formData);
      
      // Validate required fields
      if (!formData.company_name?.trim()) {
        throw new Error('Company name is required');
      }
      if (!formData.sector?.trim()) {
        throw new Error('Sector is required');
      }
      if (!formData.state?.trim()) {
        throw new Error('State is required');
      }
      if (!formData.city?.trim()) {
        throw new Error('City is required');
      }
      if (!formData.gst_number?.trim()) {
        throw new Error('GST number is required');
      }
      if (!formData.address?.trim()) {
        throw new Error('Address is required');
      }
      if (!formData.pin_code?.trim()) {
        throw new Error('Pin code is required');
      }
      if (!formData.gstDoc) {
        throw new Error('GST document is required');
      }
      if (!formData.client_details || formData.client_details.length === 0) {
        throw new Error('At least one client detail is required');
      }
      if (!formData.company_list || formData.company_list.length === 0) {
        throw new Error('At least one company must be selected');
      }

      // Create FormData object to match API requirements
      const formDataObj = new FormData();
      
      // Add encrypted fields
      formDataObj.append('company_name', encryptUtility(formData.company_name));
      formDataObj.append('sector', formData.sector); // Not encrypted as per API example
      formDataObj.append('state', encryptUtility(formData.state));
      formDataObj.append('city', encryptUtility(formData.city));
      formDataObj.append('gst_number', encryptUtility(formData.gst_number));
      formDataObj.append('address', encryptUtility(formData.address));
      formDataObj.append('pin_code', encryptUtility(formData.pin_code));
      
      // Add GST document - format for FormData
      formDataObj.append('gstDoc', {
        uri: formData.gstDoc.uri,
        name: formData.gstDoc.name,
        type: formData.gstDoc.type,
      } as any);
      
      // Add params
      formDataObj.append('params', 'GST');
      formDataObj.append('GST', 'true');
      
      // Add client details - encrypt each field individually
      const encryptedClientDetails = formData.client_details.map(client => ({
        name_of_client: encryptUtility(client.name_of_client),
        contact_number: encryptUtility(client.contact_number),
        email: encryptUtility(client.email),
      }));
      formDataObj.append('client_details', JSON.stringify(encryptedClientDetails));
      
      console.log('client_details (encrypted):', JSON.stringify(encryptedClientDetails));
      
      // Add company list
      formData.company_list.forEach((company, index) => {
        formDataObj.append(`company_list[${index}]`, company);
      });

      console.log('FormData created for API request');
      console.log('API URL:', `${API_URL}${Endpoints.apiRegisterClient}`);
      console.log('Full URL:', `${API_URL}${Endpoints.apiRegisterClient}`);
      
      // Debug: Log FormData contents to verify it matches API format
      console.log('=== FormData Contents (for debugging) ===');
      console.log('company_name:', encryptUtility(formData.company_name));
      console.log('sector:', formData.sector);
      console.log('state:', encryptUtility(formData.state));
      console.log('city:', encryptUtility(formData.city));
      console.log('gst_number:', encryptUtility(formData.gst_number));
      console.log('address:', encryptUtility(formData.address));
      console.log('pin_code:', encryptUtility(formData.pin_code));
      console.log('client_details (raw):', formData.client_details);
      console.log('company_list:', formData.company_list);
      console.log('gstDoc type:', typeof formData.gstDoc);
      console.log('gstDoc:', formData.gstDoc);
      console.log('gstDoc.uri:', formData.gstDoc?.uri);
      console.log('gstDoc.name:', formData.gstDoc?.name);
      console.log('gstDoc.type:', formData.gstDoc?.type);
      console.log('=== End FormData Contents ===');

      // Use the existing API instance with FormData support
      const response = await axiosInstance.post(Endpoints.apiRegisterClient, formDataObj, {
        isFormData: true,
        authRequired: false,
      } as CustomRequestConfig);
      
      console.log('=== API Response ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      console.log('Registration API Success Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration API Error:', error);
      throw error;
    }
  },
};
