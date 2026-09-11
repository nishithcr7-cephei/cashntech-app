import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import registerwebReducer from '@store/registerweb/register.slice';
import {programSelectionReducer} from '@store/programSelection';
import {productReducer} from '@store/product';
import {invoiceReducer} from '@store/invoice';
import {invoiceOverviewReducer} from '@store/invoiceOverview';
import {permissionsReducer} from '@store/permissions';
import {repaymentReducer} from '@store/repayment';
import {dpdReducer} from '@store/dpd';
import {interestAccrualReducer} from '@store/interestAccrual';
import {reportReducer} from '@store/report';
import soaReducer from '@store/soa/soa.slice';
import soaDealerReducer from '@store/soa/dealer/dealer.slice';
import {creditAccountDetailsReducer} from '@store/soa/creditAccountDetails/slice';
import {uiReducer} from '@store/ui';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  programSelection: programSelectionReducer,
  product: productReducer,
  invoice: invoiceReducer,
  invoiceOverview: invoiceOverviewReducer,
  permissions: permissionsReducer,
  repayment: repaymentReducer,
  dpd: dpdReducer,
  interestAccrual: interestAccrualReducer,
  report: reportReducer,
  soa: soaReducer,
  soaDealer: soaDealerReducer,
  creditAccountDetails: creditAccountDetailsReducer,
  ui: uiReducer,
  ...registerwebReducer,
});

export default rootReducer;
