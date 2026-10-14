import React from 'react';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {PRODUCT_CODES} from '@store/product/product.types';

type ProductIconProps = {
  code: string;
  size: number;
  color: string;
};

/**
 * Product glyphs (FontAwesome6):
 * DF = building-columns, VF = store, PID = file-invoice-dollar,
 * SID = hand-holding-dollar.
 */
export const ProductIcon: React.FC<ProductIconProps> = ({code, size, color}) => {
  let name:
    | 'building-columns'
    | 'store'
    | 'file-invoice-dollar'
    | 'hand-holding-dollar' = 'building-columns';
  if (code === PRODUCT_CODES.VENDOR_FINANCE) {
    name = 'store';
  } else if (code === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING) {
    name = 'file-invoice-dollar';
  } else if (code === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING) {
    name = 'hand-holding-dollar';
  }

  return (
    <FontAwesome6 name={name} iconStyle="solid" size={size} color={color} />
  );
};
