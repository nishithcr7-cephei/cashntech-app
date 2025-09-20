import {all} from 'redux-saga/effects';
import authSaga from '../auth/auth.saga';
import clientSaga from '@store/client/client.saga';
import profileSaga from '@store/profile/profile.saga';
import tasklogSaga from '@store/tasklog/tasklog.saga';
import mngSaga from '@store/mng/mng.saga';
import {visitSaga} from '@store/visit';
import {softSaga} from '@store/softsan';
import {leadSaga} from '@store/lead';


export default function* rootSaga() {
  yield all([authSaga(), clientSaga(), profileSaga(), tasklogSaga(), mngSaga(), visitSaga(), softSaga(), leadSaga()]);
}
