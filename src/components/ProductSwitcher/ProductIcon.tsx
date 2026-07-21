import React from 'react';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {PRODUCT_CODES} from '@store/product/product.types';

type ProductIconProps = {
  code: string;
  size: number;
  color: string;
};

/**
 * Single source of truth for product glyphs (Tabler building-bank / building-store
 * equivalents from the app's FontAwesome6 set):
 * Dealer Finance = building-columns (bank), Vendor Finance = store (storefront).
 */
export const ProductIcon: React.FC<ProductIconProps> = ({code, size, color}) => (
  <FontAwesome6
    name={code === PRODUCT_CODES.VENDOR_FINANCE ? 'store' : 'building-columns'}
    iconStyle="solid"
    size={size}
    color={color}
  />
);
