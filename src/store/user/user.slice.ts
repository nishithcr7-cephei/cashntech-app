import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserState} from './user.types';
import { decodeJWT } from '@utils/Utils';

const initialState: UserState = {
  id: 0,
  email: '',
  first_name: '',
  last_name: '',
  mobile_number: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserState>) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.first_name = action.payload.first_name;
      state.last_name = action.payload.last_name;
      state.mobile_number = action.payload.mobile_number;
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
    },
  },
});

export const {setUserInfo, loadInfoFromToken, clearUserInfo} = userSlice.actions;
export default userSlice.reducer;
