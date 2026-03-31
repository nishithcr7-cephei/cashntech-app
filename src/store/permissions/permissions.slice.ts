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

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    fetchPermissionsRequest: state => {
      state.loading = true;
      state.error = null;
    },
    fetchPermissionsSuccess: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      state.canSendMailToBank = action.payload.includes('lms.transactions.disbursement.action.send_mail_to_bank');
      state.canMarkAsDisbursed = action.payload.includes('lms.transactions.disbursement.action.mark_as_disbursed');
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
