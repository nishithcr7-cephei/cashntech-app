import {useCallback, useState} from 'react';
import {useSelector} from 'react-redux';
import {
  selectActiveProduct,
  selectHasMultipleProducts,
} from '@store/product/product.selectors';

/**
 * Shared visibility + product context for ProductBottomSheet (home chip + drawer chip).
 * Selection itself stays in ProductBottomSheet via useSwitchProductWorkspace.
 */
export const useProductSwitcherSheet = () => {
  const [sheetVisible, setSheetVisible] = useState(false);
  const hasMultipleProducts = useSelector(selectHasMultipleProducts);
  const activeProduct = useSelector(selectActiveProduct);

  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);

  return {
    sheetVisible,
    openSheet,
    closeSheet,
    hasMultipleProducts,
    activeProduct,
  };
};
