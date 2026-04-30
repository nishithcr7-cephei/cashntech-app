import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserState} from './user.types';
import { decodeJWT } from '@utils/Utils';
import {AppRole} from '@constants/roles';
import {decryptValue} from '@utils/decrypt';
import {deriveAppRoleFromUser} from '@utils/deriveAppRole';

const initialState: UserState = {
  id: 0,
  email: '',
  first_name: '',
  last_name: '',
  mobile_number: '',
  is_client: false,
  is_internal: false,
  user_type: null,
  role: '',
  appRole: null,
  scope: undefined,
  final_user_permission: undefined,
  party_name: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<Partial<UserState> & Pick<UserState, 'id' | 'email' | 'first_name' | 'last_name' | 'mobile_number'>>) => {
      const payload = action.payload;
      state.id = payload.id;
      state.email = payload.email;
      state.first_name = decryptValue(payload.first_name || '');
      state.last_name = decryptValue(payload.last_name || '');
      state.mobile_number = decryptValue(payload.mobile_number || '');
      
      const userType = payload.user_type ?? state.user_type;
      state.user_type = userType;
      
      // Backward compatibility mapping
      state.is_client = userType === 'SCF' ? true : (payload.is_client ?? state.is_client);
      state.is_internal = userType === 'Cashntech' ? true : (payload.is_internal ?? state.is_internal);
      
      // Permission Group & Role Logic
      const pg = payload.permission_group ?? state.permission_group;
      state.permission_group = pg;
      
      if (userType === 'Cashntech') {
        state.role = '';
      } else if (pg && pg.length > 0) {
        const firstPg = pg[0];
        if (firstPg.business_role && firstPg.functional_role) {
          state.role = `${firstPg.business_role} ${firstPg.functional_role}`;
        } else {
          state.role = payload.role ?? state.role;
        }
      } else {
        state.role = payload.role ?? state.role;
      }

      // Derive appRole (for UI/Navigation)
      state.appRole = deriveAppRoleFromUser({
        first_name: state.first_name,
        user_type: userType || '',
        permission_group: pg || [],
      });

      state.scope = payload.scope ?? state.scope;
      state.final_user_permission = payload.final_user_permission ?? state.final_user_permission;
      state.party_name = payload.party_name ?? state.party_name;
    },
    setUserRole: (state, action: PayloadAction<AppRole | null>) => {
      state.appRole = action.payload;
    },
    loadInfoFromToken: (state, action: PayloadAction<string>) => {
      const data = decodeJWT(action.payload);
      if (data) {
        state.id = data.id;
        state.email = data.email;
        state.first_name = decryptValue(data.first_name || '');
        state.last_name = decryptValue(data.last_name || '');
        state.mobile_number = decryptValue(data.mobile_number || '');
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
      state.user_type = null;
      state.role = '';
      state.appRole = null;
      state.scope = undefined;
      state.final_user_permission = undefined;
      state.permission_group = undefined;
      state.party_name = null;
    },
  },
});

export const {setUserInfo, setUserRole, loadInfoFromToken, clearUserInfo} = userSlice.actions;
export default userSlice.reducer;
