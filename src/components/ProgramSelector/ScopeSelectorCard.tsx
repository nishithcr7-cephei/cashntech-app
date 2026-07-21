import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Folder} from '@assets/Icons';
import {
  selectActiveProduct,
  selectHasMultipleProducts,
} from '@store/product/product.selectors';
import {ProductHeaderChip} from '@components/ProductSwitcher/ProductHeaderChip';
import {ProgramBreadcrumb} from './ProgramBreadcrumb';

/**
 * Single white card grouping program scope + active product switcher.
 * Product selection uses the shared Redux product store (synced with drawer).
 */
export const ScopeSelectorCard: React.FC = () => {
  const hasMultipleProducts = useSelector(selectHasMultipleProducts);
  const activeProduct = useSelector(selectActiveProduct);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ProgramBreadcrumb embedded />

        {hasMultipleProducts && activeProduct ? (
          <>
            <View style={styles.divider} />
            <View style={styles.productRow}>
              <View style={styles.productLabel}>
                <Folder
                  width={scaleWidth(13)}
                  height={scaleWidth(13)}
                  color={Colors.primaryColor}
                />
                <Text style={styles.productLabelText} numberOfLines={1}>
                  Active Product
                </Text>
              </View>
              <ProductHeaderChip filled />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E6',
    marginHorizontal: scaleWidth(14),
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(11),
    gap: scaleWidth(8),
  },
  productLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    minWidth: 0,
  },
  productLabelText: {
    flexShrink: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
});
