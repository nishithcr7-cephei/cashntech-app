import {API_URL} from '@config/config';
import {encryptUtility} from '@utils/crypto';
import axiosInstance from './api';
import {CustomRequestConfig} from './api';
import Endpoints from '@constants/ApiEndPoints';

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
      
      // Add GST document
      formDataObj.append('gstDoc', formData.gstDoc);
      
      // Add params
      formDataObj.append('params', 'GST');
      formDataObj.append('GST', 'true');
      
      // Add client details as JSON string (encrypted)
      const clientDetailsEncrypted = encryptUtility(formData.client_details);
      formDataObj.append('client_details', `[${clientDetailsEncrypted}]`);
      
      // Add company list
      formData.company_list.forEach((company, index) => {
        formDataObj.append(`company_list[${index}]`, company);
      });

      console.log('FormData created for API request');
      console.log('API URL:', `${API_URL}${Endpoints.apiRegisterClient}`);
      
      // Debug: Log FormData contents to verify it matches API format
      console.log('=== FormData Contents (for debugging) ===');
      console.log('company_name:', encryptUtility(formData.company_name));
      console.log('sector:', formData.sector);
      console.log('state:', encryptUtility(formData.state));
      console.log('city:', encryptUtility(formData.city));
      console.log('gst_number:', encryptUtility(formData.gst_number));
      console.log('address:', encryptUtility(formData.address));
      console.log('pin_code:', encryptUtility(formData.pin_code));
      console.log('client_details:', `[${encryptUtility(formData.client_details)}]`);
      console.log('company_list:', formData.company_list);
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
