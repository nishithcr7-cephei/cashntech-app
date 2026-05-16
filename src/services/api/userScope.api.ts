import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {Bank, BankProgram, Program} from '@constants/programSelection';

export type UserScopeApiItem = {
  partner_bank: { id: string; name: string };
  party: { id: string; name: string };
  products: Array<{
    id: string;
    name: string;
    permission_group?: string;
    workflow_method: string;
    programs: Array<{ 
      id: string; 
      name: string; 
      method: string;
      role: string;
      status: string;
    }>;
  }>;
};

export type UserScopeApiResponse = {
  statusCode?: number;
  message?: string;
  data?: UserScopeApiItem[];
  timestamp?: string;
};

/**
 * Maps API response to Bank[] for SelectProgramScreen UI
 */
export function mapUserScopeToBanks(data: UserScopeApiItem[]): Bank[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  return data.map(item => {
    const bank = item.partner_bank;
    const products: BankProgram[] = (item.products || []).map(p => ({
      id: p.id,
      name: p.name,
      programs: (p.programs || []).map(pr => ({
        id: pr.id,
        name: pr.name,
        userType: 'dealer' as const, // default - API doesn't provide
        method: pr.method,
        role: pr.role,
        status: pr.status,
      })),
    }));

    return {
      id: bank.id,
      name: bank.name,
      partyId: item.party.id,
      products,
    };
  });
}

export const userScopeApi = {
  getUserScope: async (isClient: boolean = true): Promise<UserScopeApiResponse> => {
    const params = new URLSearchParams({isClient: String(isClient)});
    const url = `${ApiEndPoints.apiUserScope}?${params.toString()}`;
    const response = await axiosInstance.get(url, {
      authRequired: true,
    } as any);
    return response.data;
  },
};
