import React, {useState} from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {UpChevron} from '@assets/Icons';
import {
  selectActiveProduct,
  selectHasMultipleProducts,
} from '@store/product/product.selectors';
import {ProductBottomSheet} from './ProductBottomSheet';
import {ProductIcon} from './ProductIcon';

type ProductHeaderChipProps = {
  /** Soft filled pill (used inside ScopeSelectorCard). Default outlined. */
  filled?: boolean;
};

/**
 * Header pill showing the current product with a tap-to-switch bottom sheet.
 * Self-contained: only visible for multi-product users, manages its own sheet state.
 * Selection updates Redux product store (same source the drawer reads).
 */
export const ProductHeaderChip: React.FC<ProductHeaderChipProps> = ({
  filled = false,
}) => {
  const [sheetVisible, setSheetVisible] = useState(false);
  const hasMultipleProducts = useSelector(selectHasMultipleProducts);
  const activeProduct = useSelector(selectActiveProduct);

  if (!hasMultipleProducts || !activeProduct) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.pill, filled && styles.pillFilled]}
        activeOpacity={0.8}
        onPress={() => setSheetVisible(true)}>
        <ProductIcon
          code={activeProduct.code}
          size={scaleHeight(12)}
          color={Colors.primaryColor}
        />
        <Text style={styles.pillText} numberOfLines={1} ellipsizeMode="tail">
          {activeProduct.name}
        </Text>
        <UpChevron rotation={180} height={scaleHeight(8)} width={scaleWidth(8)} />
      </TouchableOpacity>

      <ProductBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    backgroundColor: Colors.white,
    paddingHorizontal: scaleWidth(10),
    minHeight: scaleHeight(34),
    borderRadius: scaleWidth(16),
    borderWidth: 1,
    borderColor: Colors.primaryColor,
    maxWidth: scaleWidth(160),
    flexShrink: 0,
  },
  pillFilled: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFD9D9',
  },
  pillText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    flexShrink: 1,
  },
});
