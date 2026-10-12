import axiosInstance from './api';
import ApiEndPoints from '@constants/ApiEndPoints';
import type {
  AlertDispatchFilters,
  AlertDispatchRow,
  BankRiskDetail,
  BorrowerRiskRow,
  EcosystemRiskData,
  FilterOption,
  PartyRiskProfile,
} from '@store/riskDashboard/riskDashboard.types';
import {
  normalizeAlertDispatchRow,
  normalizeBankRiskDetail,
  normalizeBorrowerRiskRow,
  normalizeEcosystemRisk,
  normalizePartyRiskProfile,
  normalizeProgramOptions,
} from '@utils/normalizeRiskDashboard';

const AUTH = {authRequired: true} as any;

/** Unwraps `BaseResponseDto` and throws on a body-level error status. */
function unwrap(body: any, fallbackMessage: string): any {
  const statusCode = Number(body?.statusCode);
  if (Number.isFinite(statusCode) && statusCode >= 400) {
    const rawMsg = body?.message;
    const message = Array.isArray(rawMsg)
      ? rawMsg.filter(Boolean).join('\n')
      : typeof rawMsg === 'string'
        ? rawMsg
        : fallbackMessage;
    const err: any = new Error(message);
    err.response = {status: statusCode, data: body};
    throw err;
  }
  return body?.data;
}

/** Only non-empty filters go on the query string. */
export function buildAlertDispatchParams(
  filters: AlertDispatchFilters,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.bankId) {
    params.bankId = filters.bankId;
  }
  if (filters.programId) {
    params.programId = filters.programId;
  }
  if (filters.status) {
    params.status = filters.status;
  }
  if (filters.date) {
    params.date = filters.date;
  }
  return params;
}

/** Dashboard Management APIs — product-independent, never send productId. */
export const riskDashboardApi = {
  getEcosystemRisk: async (): Promise<EcosystemRiskData> => {
    const res = await axiosInstance.post(ApiEndPoints.apiEcosystemRisk, {}, AUTH);
    return normalizeEcosystemRisk(
      unwrap(res?.data, 'Failed to fetch ecosystem risk profile'),
    );
  },

  /** Resolves `null` when the bank has no exposure. */
  getBankRiskDetail: async (bankId: string): Promise<BankRiskDetail | null> => {
    const res = await axiosInstance.post(
      ApiEndPoints.apiBankRiskDetail(bankId),
      {},
      AUTH,
    );
    return normalizeBankRiskDetail(
      unwrap(res?.data, 'Failed to fetch bank risk detail'),
    );
  },

  /** Backend responds 404 when the party has no exposure. */
  getPartyRiskProfile: async (partyId: string): Promise<PartyRiskProfile> => {
    const res = await axiosInstance.get(
      ApiEndPoints.apiPartyRiskProfile(partyId),
      AUTH,
    );
    return normalizePartyRiskProfile(
      unwrap(res?.data, 'Failed to fetch party risk profile'),
    );
  },

  /** Backend caps the list at 500 rows; no server pagination. */
  getAlertDispatches: async (
    filters: AlertDispatchFilters,
  ): Promise<AlertDispatchRow[]> => {
    const res = await axiosInstance.get(ApiEndPoints.apiAlertDispatches, {
      ...AUTH,
      params: buildAlertDispatchParams(filters),
    });
    const data = unwrap(res?.data, 'Failed to fetch alerts');
    return (Array.isArray(data) ? data : []).map(normalizeAlertDispatchRow);
  },

  getBorrowerRisk: async (): Promise<BorrowerRiskRow[]> => {
    const res = await axiosInstance.post(ApiEndPoints.apiBorrowerRisk, {}, AUTH);
    const data = unwrap(res?.data, 'Failed to fetch borrower risk dashboard');
    return (Array.isArray(data) ? data : []).map(normalizeBorrowerRiskRow);
  },

  getProgramDropdown: async (): Promise<FilterOption[]> => {
    const res = await axiosInstance.get(ApiEndPoints.apiMasterProgramDropdown, AUTH);
    return normalizeProgramOptions(unwrap(res?.data, 'Failed to fetch programs'));
  },
};
