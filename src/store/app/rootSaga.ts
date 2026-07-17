import {all} from 'redux-saga/effects';
import authSaga from '../auth/auth.saga';
import {contactSaga, registerSaga, gstLookupSaga, applySaga} from '@store/registerweb/register.saga';
import invoiceSaga from '@store/invoice/inv.saga';
import invoiceOverviewSaga from '@store/invoiceOverview/invOverview.saga';
import {programSelectionSaga} from '@store/programSelection';
import {productSaga} from '@store/product';
import {permissionsSaga} from '@store/permissions';
import {repaymentSaga} from '@store/repayment';
import {dpdSaga} from '@store/dpd';
import {interestAccrualSaga} from '@store/interestAccrual';
import {soaSaga} from '@store/soa/soa.saga';
import {dealerSaga} from '@store/soa/dealer/dealer.saga';
import {creditAccountDetailsSaga} from '@store/soa/creditAccountDetails/saga';

import {reportSaga} from '@store/report';

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
    productSaga(),
    permissionsSaga(),
    repaymentSaga(),
    dpdSaga(),
    interestAccrualSaga(),
    reportSaga(),
    soaSaga(),
    dealerSaga(),
    creditAccountDetailsSaga(),
  ]);
}
