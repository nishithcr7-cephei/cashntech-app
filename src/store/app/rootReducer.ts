import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import {clientReducer} from '@store/client';
import {kycReducer} from '@store/kyc';
import {profileReducer} from '@store/profile';
import tasklogReducer from '@store/tasklog/tasklog.slice';
import mngReducer from '@store/mng/mng.slice';
import {visitReducer} from '@store/visit';
import {softReducer} from '@store/softsan';
import {leadReducer} from '@store/lead';
import {inboundClientReducer} from '@store/inboundclient';
import registerwebReducer from '@store/registerweb/register.slice';
import {programSelectionReducer} from '@store/programSelection';


const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  client: clientReducer,
  kyc: kycReducer,
  profile: profileReducer,
  tasklog: tasklogReducer,
  mng: mngReducer,
  visit: visitReducer,
  softsan: softReducer,
  lead: leadReducer,
  inboundClient: inboundClientReducer,
  programSelection: programSelectionReducer,
  ...registerwebReducer,
});

export default rootReducer;
