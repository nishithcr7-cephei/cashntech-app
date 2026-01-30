import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserState} from './user.types';
import { decodeJWT } from '@utils/Utils';

const initialState: UserState = {
  id: 0,
  email: '',
  first_name: '',
  last_name: '',
  mobile_number: '',
  is_client: false,
  is_internal: false,
  role: '',
  scope: undefined,
  final_user_permission: undefined,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<Partial<UserState> & Pick<UserState, 'id' | 'email' | 'first_name' | 'last_name' | 'mobile_number'>>) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.first_name = action.payload.first_name;
      state.last_name = action.payload.last_name;
      state.mobile_number = action.payload.mobile_number;
      state.is_client = action.payload.is_client ?? state.is_client;
      state.is_internal = action.payload.is_internal ?? state.is_internal;
      state.role = action.payload.role ?? state.role;
      state.scope = action.payload.scope ?? state.scope;
      state.final_user_permission = action.payload.final_user_permission ?? state.final_user_permission;
    },
    loadInfoFromToken: (state, action: PayloadAction<string>) => {
      const data = decodeJWT(action.payload);
      if (data) {
        state.id = data.id;
        state.email = data.email;
        state.first_name = data.first_name;
        state.last_name = data.last_name;
        state.mobile_number = data.mobile_number;
      }
    },
    clearUserInfo: (state) => {
      state.id = 0;
      state.email = '';
      state.first_name = '';
      state.last_name = '';
      state.mobile_number = '';
      state.is_client = false;
      state.is_internal = false;
      state.role = '';
      state.scope = undefined;
      state.final_user_permission = undefined;
    },
  },
});

export const {setUserInfo, loadInfoFromToken, clearUserInfo} = userSlice.actions;
export default userSlice.reducer;
