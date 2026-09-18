import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {EffectivePermissions} from '@store/permissions/permissions.types';

export type UserPermissionsApiResponse = {
  statusCode?: number;
  message?: string;
  data?: {permissions: EffectivePermissions};
  timestamp?: string;
};

export const userPermissionsApi = {
  getUserPermissions: async (
    isClient: boolean = true,
    groupId: number,
  ): Promise<UserPermissionsApiResponse> => {
    const params = new URLSearchParams({
      isClient: String(isClient),
      groupId: String(groupId),
    });
    const url = `${ApiEndPoints.apiUserPermissions}?${params.toString()}`;
    const response = await axiosInstance.get(url, {
      authRequired: true,
    } as any);
    return response.data;
  },
};
