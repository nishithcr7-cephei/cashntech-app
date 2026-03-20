import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface PermissionsState {
  permissions: string[];
  loading: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  permissions: [],
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
