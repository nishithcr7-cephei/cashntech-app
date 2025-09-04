import {all} from 'redux-saga/effects';
import authSaga from '../auth/auth.saga';
import clientSaga from '@store/client/client.saga';
import tasklogSaga from '@store/tasklog/tasklog.saga';

export default function* rootSaga() {
  yield all([authSaga(), clientSaga(), tasklogSaga()]);
}
