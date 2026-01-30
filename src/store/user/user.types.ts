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
  scope?: { program_ids?: string[] };
  final_user_permission?: unknown;
}
