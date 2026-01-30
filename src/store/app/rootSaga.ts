import {all} from 'redux-saga/effects';
import authSaga from '../auth/auth.saga';
import {contactSaga, registerSaga, gstLookupSaga, applySaga} from '@store/registerweb/register.saga';

export default function* rootSaga() {
  yield all([authSaga(), contactSaga(), registerSaga(), gstLookupSaga(), applySaga()]);
}
