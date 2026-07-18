import {AppRole} from '@constants/roles';
import type {NormalizedCapability} from '@utils/roleNormalizer';

export type UserProductRole = {
  product_id: string;
  role: string;
  level?: number | null;
};

export interface UserState {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  /** Full detail from OTP verify response */
  is_client?: boolean;
  is_internal?: boolean;
  user_type?: 'Cashntech' | 'SCF' | 'Bank' | 'Partner' | null;
  role?: string;
  /** App role for UI customization: anchor_maker, anchor_checker, dealer_maker */
  appRole?: AppRole | null;
  /**
   * Stable capability model from roleNormalizer (PR3).
   * Vendor Maker/Checker share counterparty categories with Dealer.
   */
  capability?: NormalizedCapability | null;
  scope?: { program_ids?: string[] };
  final_user_permission?: unknown;
  party_name?: string | null;
  /** From OTP verify - used for /user/permissions groupId */
  permission_group?: Array<{
    id?: number;
    department?: string;
    business_role?: string;
    functional_role?: string;
    level?: number | null;
    approval_level?: number | null;
  }>;
  /**
   * CWF additive JWT/login claim (optional).
   * Consumed by roleNormalizer as fallback when permission_group has no party role.
   */
  product_roles?: UserProductRole[] | null;
}
