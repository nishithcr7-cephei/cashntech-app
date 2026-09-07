import {select} from 'redux-saga/effects';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {selectActiveProductId} from '@store/product/product.selectors';
import {resolveWorkspaceProductId} from '@store/product/product.resolver';

/**
 * productId for list/KPI bodies: selected program product, else active product.
 */
export function* selectOptionalProductId(): Generator<any, string | null, any> {
  const programSelection = yield select(selectProgramSelection);
  const productId = yield select(selectActiveProductId);
  return resolveWorkspaceProductId(programSelection, productId);
}
