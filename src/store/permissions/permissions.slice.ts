import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface PermissionsState {
  permissions: string[];
  canSendMailToBank: boolean;
  canMarkAsDisbursed: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  permissions: [],
  canSendMailToBank: false,
  canMarkAsDisbursed: false,
  loading: false,
  error: null,
};

const normalizePermission = (permission: string): string => {
  if (!permission) return permission;

  return permission
    .replace(/^lms\.products\.dealer_finance\./, 'lms.')
    .replace(/^lms\.products\.vendor_finance\./, 'lms.')
    .replace(/^lms\.vf_transactions\./, 'lms.transactions.')
    .replace(/\.vf_overview(?=\.|$)/, '.overview')
    .replace(/\.vf_invoice_list(?=\.|$)/, '.invoice_list')
    .replace(/\.vf_disbursement(?=\.|$)/, '.disbursement')
    .replace(/\.vf_interest_accruals(?=\.|$)/, '.interest_accruals')
    .replace(/\.vf_repayment_settlement(?=\.|$)/, '.repayment_settlement')
    .replace(/\.vf_dpd(?=\.|$)/, '.dpd')
    .replace(/\.vf_soa(?=\.|$)/, '.soa');
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    fetchPermissionsRequest: state => {
      state.loading = true;
      state.error = null;
    },
    fetchPermissionsSuccess: (state, action: PayloadAction<string[]>) => {
      const rawPermissions = action.payload || [];

      // Normalize product-specific permission namespaces so the app can keep
      // checking shared `lms.transactions.*` keys across DF and VF.
      const normalizedPermissions = rawPermissions.map(normalizePermission);

      // Combine unique permissions
      const allPermissions = Array.from(new Set([...rawPermissions, ...normalizedPermissions]));

      state.permissions = allPermissions;
      state.canSendMailToBank = allPermissions.includes('lms.transactions.disbursement.action.send_mail_to_bank');
      state.canMarkAsDisbursed = allPermissions.includes('lms.transactions.disbursement.action.mark_as_disbursed');
      state.loading = false;
      state.error = null;
    },
    fetchPermissionsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearPermissions: () => initialState,
  },
});

export const {
  fetchPermissionsRequest,
  fetchPermissionsSuccess,
  fetchPermissionsFailure,
  clearPermissions,
} = permissionsSlice.actions;
export default permissionsSlice.reducer;
