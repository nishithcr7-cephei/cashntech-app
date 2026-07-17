import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {Bank, BankProgram} from '@constants/programSelection';
import {parseWorkflowLevel} from '@utils/getInvoiceApprovalLevel';
import {
  collectProductsFromScopeBanks,
  uniqueProductsByCode,
} from '@store/product/product.resolver';
import type {ResolvedProduct} from '@store/product/product.types';

export type UserScopeApiItem = {
  partner_bank: { id: string; name: string };
  party: { id: string; name: string };
  products: Array<{
    id: string;
    name: string;
    /** Future field — not returned by current backends; resolver falls back to name. */
    product_code?: string | null;
    permission_group?: string;
    approval_level?: number | null;
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
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map(item => {
    const bank = item.partner_bank;
    const products: BankProgram[] = (item.products || []).map(p => ({
      id: p.id,
      name: p.name,
      approval_level: parseWorkflowLevel(p.approval_level),
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

/**
 * Resolve unique DF/VF products from /user/scope for product bootstrap (PR2).
 * Name-based when product_code is absent.
 */
export function extractResolvedProductsFromScope(
  data: UserScopeApiItem[] | null | undefined,
): ResolvedProduct[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  const banks = mapUserScopeToBanks(data);
  return uniqueProductsByCode(collectProductsFromScopeBanks(banks));
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
