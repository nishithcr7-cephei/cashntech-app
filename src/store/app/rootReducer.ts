import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import registerwebReducer from '@store/registerweb/register.slice';
import {programSelectionReducer} from '@store/programSelection';
import {invoiceReducer} from '@store/invoice';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  programSelection: programSelectionReducer,
  invoice: invoiceReducer,
  ...registerwebReducer,
});

export default rootReducer;
