import axios from 'axios';

export interface PostalOffice {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  State: string;
  Country: string;
  Pincode: string;
}

export interface PostalCodeResponse {
  Message: string;
  Status: string;
  PostOffice: PostalOffice[];
}

// Create a separate axios instance for postal API
const postalApiInstance = axios.create({
  baseURL: 'https://api.postalpincode.in',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export const PostalApi = {
  getPostalCodes: async (cityName: string): Promise<PostalCodeResponse[]> => {
    try {
      console.log('PostalApi: Fetching postal codes for city:', cityName);
      const url = `/postoffice/${encodeURIComponent(cityName)}`;
      console.log('PostalApi: Making request to:', url);
      
      const response = await postalApiInstance.get(url);
      console.log('PostalApi: Response status:', response.status);
      console.log('PostalApi: Response data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('PostalApi: Error fetching postal codes:', error);
      console.error('PostalApi: Error message:', error.message);
      console.error('PostalApi: Error response:', error.response?.data);
      throw error;
    }
  },

  getPostOfficesByPincode: async (pincode: string): Promise<PostalCodeResponse[]> => {
    try {
      console.log('PostalApi: Fetching post offices for pincode:', pincode);
      const url = `/pincode/${pincode}`;
      console.log('PostalApi: Making request to:', url);
      
      const response = await postalApiInstance.get(url);
      console.log('PostalApi: Response status:', response.status);
      console.log('PostalApi: Response data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('PostalApi: Error fetching post offices by pincode:', error);
      console.error('PostalApi: Error message:', error.message);
      console.error('PostalApi: Error response:', error.response?.data);
      throw error;
    }
  },

  isErrorResponse: (response: PostalCodeResponse[]): boolean => {
    if (!response || !Array.isArray(response) || response.length === 0) {
      return true;
    }
    
    const firstResponse = response[0];
    return firstResponse.Status !== 'Success' || !firstResponse.PostOffice || firstResponse.PostOffice.length === 0;
  },

  extractPostOfficeNames: (response: PostalCodeResponse[]): string[] => {
    if (!response || !Array.isArray(response) || response.length === 0) {
      return [];
    }
    
    const firstResponse = response[0];
    if (!firstResponse.PostOffice || !Array.isArray(firstResponse.PostOffice)) {
      return [];
    }
    
    return firstResponse.PostOffice.map(office => office.Name).filter(name => name && name.trim() !== '');
  },
};