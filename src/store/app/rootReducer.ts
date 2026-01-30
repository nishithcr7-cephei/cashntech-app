import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import registerwebReducer from '@store/registerweb/register.slice';
import {programSelectionReducer} from '@store/programSelection';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  programSelection: programSelectionReducer,
  ...registerwebReducer,
});

export default rootReducer;
