import {all} from 'redux-saga/effects';
import authSaga from '../auth/auth.saga';
import clientSaga from '@store/client/client.saga';
import tasklogSaga from '@store/tasklog/tasklog.saga';
import mngSaga from '@store/mng/mng.saga';
import {visitSaga} from '@store/visit';
import {softSaga} from '@store/softsan';


export default function* rootSaga() {
  yield all([authSaga(), clientSaga(), tasklogSaga(), mngSaga(), visitSaga(), softSaga()]);
}
