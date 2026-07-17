import {call, put, takeLatest} from 'redux-saga/effects';
import StorageKeys from '@constants/StorageKeys';
import {
  getStorage,
  removeStorage,
  setStorage,
} from '@services/localStorage';
import {
  clearProductContext,
  hydrateProductFailure,
  hydrateProductRequest,
  hydrateProductSuccess,
  setActiveProduct,
  setAvailableProducts,
} from './product.slice';
import {ResolvedProduct} from './product.types';
import {resolveProduct, resolveAvailableProducts} from './product.resolver';

function parseStoredActiveProduct(
  raw: unknown,
): ResolvedProduct | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return resolveProduct(raw as ResolvedProduct);
}

function parseStoredAvailableProducts(raw: unknown): ResolvedProduct[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return resolveAvailableProducts(raw);
}

/**
 * Restore product context from MMKV. Not dispatched at boot in PR1 —
 * PR2 (auth bootstrap) will call hydrateProductRequest.
 */
function* hydrateProductSaga(): Generator {
  try {
    const activeRaw: unknown = yield call(
      getStorage,
      StorageKeys.ACTIVE_PRODUCT,
      true,
    );
    const availableRaw: unknown = yield call(
      getStorage,
      StorageKeys.AVAILABLE_PRODUCTS,
      true,
    );

    yield put(
      hydrateProductSuccess({
        activeProduct: parseStoredActiveProduct(activeRaw),
        availableProducts: parseStoredAvailableProducts(availableRaw),
      }),
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to restore product context';
    yield put(hydrateProductFailure(message));
  }
}

function* persistActiveProductSaga(
  action: ReturnType<typeof setActiveProduct>,
): Generator {
  try {
    if (action.payload == null) {
      yield call(removeStorage, StorageKeys.ACTIVE_PRODUCT);
    } else {
      yield call(setStorage, StorageKeys.ACTIVE_PRODUCT, action.payload);
    }
  } catch {
    // Persistence must not break app flows; PR2 can surface errors if needed.
  }
}

function* persistAvailableProductsSaga(
  action: ReturnType<typeof setAvailableProducts>,
): Generator {
  try {
    yield call(setStorage, StorageKeys.AVAILABLE_PRODUCTS, action.payload);
  } catch {
    // Ignore persistence failures in PR1 foundation.
  }
}

function* clearProductStorageSaga(): Generator {
  try {
    yield call(removeStorage, StorageKeys.ACTIVE_PRODUCT);
    yield call(removeStorage, StorageKeys.AVAILABLE_PRODUCTS);
  } catch {
    // Ignore persistence failures in PR1 foundation.
  }
}

export default function* productSaga() {
  yield takeLatest(hydrateProductRequest.type, hydrateProductSaga);
  yield takeLatest(setActiveProduct.type, persistActiveProductSaga);
  yield takeLatest(setAvailableProducts.type, persistAvailableProductsSaga);
  yield takeLatest(clearProductContext.type, clearProductStorageSaga);
}
