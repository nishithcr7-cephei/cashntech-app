import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import {clientReducer} from '@store/client';
import tasklogReducer from '@store/tasklog/tasklog.slice';
import mngReducer from '@store/mng/mng.slice';
import {visitReducer} from '@store/visit';
import {softReducer} from '@store/softsan';


const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  client: clientReducer,
  tasklog: tasklogReducer,
  mng: mngReducer,
  visit: visitReducer,
  softsan: softReducer,
});

export default rootReducer;
