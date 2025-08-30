import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import {clientReducer} from '@store/client';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  client: clientReducer,
});

export default rootReducer;
