import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from '@store/auth';
import {userReducer} from '@store/user';
import {clientReducer} from '@store/client';
import tasklogReducer from '@store/tasklog/tasklog.slice';
import mngReducer from '@store/mng/mng.slice';
import {visitReducer} from '@store/visit';


const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  client: clientReducer,
  tasklog: tasklogReducer,
  mng: mngReducer,
  visit: visitReducer,
});

export default rootReducer;
