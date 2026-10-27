import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';

export type UserProfileRoleAssignment = {
  id?: number | string;
  product_id?: string;
  product_name?: string;
  role?: string;
  department?: string | null;
  label?: string;
};

export type UserProfileApi = {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  designation?: string | null;
  user_type?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string | null;
  party_name?: string | null;
  role_assignments?: UserProfileRoleAssignment[];
  permission_group?: Array<{
    business_role?: string;
    functional_role?: string;
    department?: string;
    product?: {name?: string} | null;
  }>;
};

type ProfileResponse = {
  statusCode?: number;
  message?: string;
  data?: UserProfileApi;
};

export const userApi = {
  getUserProfile: async (userId: number | string): Promise<UserProfileApi> => {
    const response = await axiosInstance.get(
      ApiEndPoints.apiUserProfile(userId),
      {authRequired: true} as any,
    );
    const body = response?.data as ProfileResponse;
    if (body?.data && typeof body.data === 'object') {
      return body.data;
    }
    // Some envs return the profile object at the top level
    if (body && typeof body === 'object' && 'email' in (body as object)) {
      return body as unknown as UserProfileApi;
    }
    return (body?.data ?? {}) as UserProfileApi;
  },
};
