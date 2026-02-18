import {AppRole} from '@constants/roles';

export interface UserState {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  /** Full detail from OTP verify response */
  is_client?: boolean;
  is_internal?: boolean;
  role?: string;
  /** App role for UI customization: anchor_maker, anchor_checker, dealer_maker */
  appRole?: AppRole | null;
  scope?: { program_ids?: string[] };
  final_user_permission?: unknown;
}
