import {all} from 'redux-saga/effects';
import authSaga from '../auth/auth.saga';
import {contactSaga, registerSaga, gstLookupSaga, applySaga} from '@store/registerweb/register.saga';
import invoiceSaga from '@store/invoice/inv.saga';
import invoiceOverviewSaga from '@store/invoiceOverview/invOverview.saga';
import {programSelectionSaga} from '@store/programSelection';
import {permissionsSaga} from '@store/permissions';

export default function* rootSaga() {
  yield all([
    authSaga(),
    contactSaga(),
    registerSaga(),
    gstLookupSaga(),
    applySaga(),
    invoiceSaga(),
    invoiceOverviewSaga(),
    programSelectionSaga(),
    permissionsSaga(),
  ]);
}
