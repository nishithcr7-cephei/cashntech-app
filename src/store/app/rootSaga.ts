import {all} from 'redux-saga/effects';
import authSaga from '../auth/auth.saga';
import clientSaga from '@store/client/client.saga';
import {kycSaga} from '@store/kyc';
import profileSaga from '@store/profile/profile.saga';
import tasklogSaga from '@store/tasklog/tasklog.saga';
import mngSaga from '@store/mng/mng.saga';
import {visitSaga} from '@store/visit';
import {softSaga} from '@store/softsan';
import {leadSaga} from '@store/lead';
import {inboundClientSaga} from '@store/inboundclient';
import {contactSaga, registerSaga, gstLookupSaga, applySaga} from '@store/registerweb/register.saga';


export default function* rootSaga() {
  yield all([authSaga(), clientSaga(), kycSaga(), profileSaga(), tasklogSaga(), mngSaga(), visitSaga(), softSaga(), leadSaga(), inboundClientSaga(), contactSaga(), registerSaga(), gstLookupSaga(), applySaga()]);
}
