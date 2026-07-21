import {call, put, select, takeLatest} from 'redux-saga/effects';

import {PayloadAction} from '@reduxjs/toolkit';

import {

  fetchUserScopeRequest,

  fetchUserScopeSuccess,

  fetchUserScopeFailure,

  toggleProgramSelection,

  setProgramSelection,

} from './programSelection.slice';

import {fetchPermissionsRequest} from '@store/permissions';

import {

  extractResolvedProductsFromScope,

  userScopeApi,

  mapUserScopeToBanks,

} from '@services/api/userScope.api';

import {userSelector} from '@store/user';

import {setActiveProduct, setAvailableProducts} from '@store/product/product.slice';

import {resolveProduct} from '@store/product/product.resolver';

import type {SelectedProgram} from './programSelection.types';

import {selectProgramSelection} from './programSelection.selector';



function* syncActiveProductFromSelection(payload: {

  productId?: string | null;

  productName?: string | null;

}) {

  const productId = payload.productId?.trim();

  const productName = payload.productName?.trim();

  if (!productId || !productName) {

    return;

  }

  const resolved = resolveProduct({id: productId, name: productName});

  if (resolved) {

    yield put(setActiveProduct(resolved));

  }

}



function* onToggleProgramSelection(action: PayloadAction<SelectedProgram>) {

  yield call(syncActiveProductFromSelection, action.payload);

}



function* onSetProgramSelection(

  action: PayloadAction<{

    productId?: string | null;

    productName?: string | null;

  }>,

) {

  yield call(syncActiveProductFromSelection, action.payload);

}



function* fetchUserScopeSaga() {

  try {

    const isClient = (yield select(userSelector.getIsClient)) ?? true;

    const response = yield call(userScopeApi.getUserScope, isClient);

    const data = response?.data;



    if (Array.isArray(data) && data.length > 0) {

      const banks = mapUserScopeToBanks(data);

      yield put(fetchUserScopeSuccess(banks));

      yield put(setAvailableProducts(extractResolvedProductsFromScope(data)));

      yield put(fetchPermissionsRequest());



      const selection = yield select(selectProgramSelection);

      if (selection?.productId && selection?.productName) {

        yield call(syncActiveProductFromSelection, {

          productId: selection.productId,

          productName: selection.productName,

        });

      }

    } else {

      yield put(

        fetchUserScopeFailure(response?.message || 'No programs available'),

      );

    }

  } catch (error: any) {

    const msg =

      error?.message?.includes('fetch') || error?.code === 'ECONNABORTED'

        ? 'Network error. Check connection.'

        : error?.message || 'Failed to load programs';

    yield put(fetchUserScopeFailure(msg));

  }

}



export default function* programSelectionSaga() {

  yield takeLatest(fetchUserScopeRequest.type, fetchUserScopeSaga);

  yield takeLatest(toggleProgramSelection.type, onToggleProgramSelection);

  yield takeLatest(setProgramSelection.type, onSetProgramSelection);

}

