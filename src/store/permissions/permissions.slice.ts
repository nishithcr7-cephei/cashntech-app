import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {EffectivePermissions} from './permissions.types';
import {isEffectivePermissions} from './permissions.types';
import {hasActionGrant} from '@utils/effectivePermissions';

interface PermissionsState {
  permissions: EffectivePermissions | null;
  canSendMailToBank: boolean;
  canMarkAsDisbursed: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  permissions: null,
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
    fetchPermissionsSuccess: (
      state,
      action: PayloadAction<EffectivePermissions | null>,
    ) => {
      const payload = isEffectivePermissions(action.payload)
        ? action.payload
        : null;

      state.permissions = payload;
      state.canSendMailToBank = hasActionGrant(
        payload,
        'disbursement',
        'send_mail_to_bank',
      );
      state.canMarkAsDisbursed = hasActionGrant(
        payload,
        'disbursement',
        'mark_as_disbursed',
      );
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
