import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {RightCheckmark} from '@assets/Icons';
import {
  selectActiveProductCode,
  selectAvailableProducts,
} from '@store/product/product.selectors';
import {setActiveProduct} from '@store/product/product.slice';
import {ResolvedProduct} from '@store/product/product.types';
import {setProgramScope} from '@store/programSelection/programSelection.slice';
import {ProductIcon} from './ProductIcon';

type ProductBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export const ProductBottomSheet: React.FC<ProductBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useDispatch();
  const availableProducts = useSelector(selectAvailableProducts);
  const activeProductCode = useSelector(selectActiveProductCode);

  const handleSelect = (product: ResolvedProduct) => {
    if (product.code !== activeProductCode) {
      dispatch(setActiveProduct(product));
      dispatch(setProgramScope('all'));
    }
    onClose();
  };

  const renderRow = ({item}: {item: ResolvedProduct}) => {
    const isActive = item.code === activeProductCode;
    return (
      <TouchableOpacity
        style={[styles.row, isActive && styles.rowActive]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}>
        <View style={styles.rowIcon}>
          <ProductIcon
            code={item.code}
            size={scaleHeight(18)}
            color={isActive ? Colors.primaryColor : '#7A7C82'}
          />
        </View>
        <Text
          style={[styles.rowTitle, isActive && styles.rowTitleActive]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {item.name}
        </Text>
        {isActive && (
          <RightCheckmark height={scaleHeight(12)} width={scaleWidth(12)} color={Colors.primaryColor} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Switch Product</Text>

          <FlatList
            data={availableProducts}
            keyExtractor={item => item.code}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(16),
    borderTopRightRadius: scaleWidth(16),
    paddingTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: scaleWidth(40),
    height: scaleHeight(4),
    borderRadius: scaleWidth(2),
    backgroundColor: '#E0E0E0',
    marginBottom: scaleHeight(12),
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(12),
  },
  listContent: {
    paddingBottom: scaleHeight(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(10),
    marginBottom: scaleHeight(8),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  rowActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFD9D9',
  },
  rowIcon: {
    width: scaleWidth(24),
    marginRight: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  rowTitleActive: {
    color: Colors.primaryColor,
  },
});
