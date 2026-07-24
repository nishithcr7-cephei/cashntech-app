import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {BankBuilding, RightCheckmarkWhite} from '@assets/Icons';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {ProductIcon} from '@components/ProductSwitcher/ProductIcon';
import {
  PRODUCT_CODES,
  ResolvedProduct,
} from '@store/product/product.types';

type ProductSelectionRowProps = {
  product: ResolvedProduct;
  selected: boolean;
  onPress: () => void;
};

const ICON_SIZE = scaleHeight(18);

const renderProductIcon = (code: string) => {
  if (code === PRODUCT_CODES.DEALER_FINANCE) {
    return (
      <BankBuilding
        width={ICON_SIZE}
        height={ICON_SIZE}
        color={Colors.primaryColor}
      />
    );
  }

  if (code === PRODUCT_CODES.VENDOR_FINANCE) {
    return (
      <ProductIcon
        code={code}
        size={ICON_SIZE}
        color={Colors.primaryColor}
      />
    );
  }

  return (
    <FontAwesome6
      name="briefcase"
      iconStyle="solid"
      size={ICON_SIZE}
      color={Colors.primaryColor}
    />
  );
};

export const ProductSelectionRow: React.FC<ProductSelectionRowProps> = ({
  product,
  selected,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.row, selected && styles.rowSelected]}
    activeOpacity={0.7}
    onPress={onPress}>
    <View style={styles.iconCircle}>{renderProductIcon(product.code)}</View>

    <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
      {product.name}
    </Text>

    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected ? (
        <RightCheckmarkWhite
          width={scaleWidth(10)}
          height={scaleHeight(10)}
        />
      ) : null}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scaleHeight(54),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    marginBottom: scaleHeight(8),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: scaleWidth(10),
  },
  rowSelected: {
    backgroundColor: '#FFF8F8',
    borderColor: Colors.primaryColor,
    borderLeftWidth: scaleWidth(3),
    borderLeftColor: Colors.primaryColor,
  },
  iconCircle: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  label: {
    flex: 1,
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginRight: scaleWidth(8),
  },
  radio: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: scaleWidth(11),
    borderWidth: 2,
    borderColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.primaryColor,
  },
});
