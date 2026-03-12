import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import registerwebReducer from '@store/registerweb/register.slice';
import {programSelectionReducer} from '@store/programSelection';
import {invoiceReducer} from '@store/invoice';
import {invoiceOverviewReducer} from '@store/invoiceOverview';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  programSelection: programSelectionReducer,
  invoice: invoiceReducer,
  invoiceOverview: invoiceOverviewReducer,
  ...registerwebReducer,
});

export default rootReducer;
