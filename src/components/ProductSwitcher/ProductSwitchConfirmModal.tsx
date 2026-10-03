import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Modal, Pressable} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {ResolvedProduct} from '@store/product/product.types';
import {getProductFullDisplayName} from '@store/product/product.resolver';
import {ProductIcon} from './ProductIcon';

type ProductSwitchConfirmModalProps = {
  visible: boolean;
  fromProduct: ResolvedProduct | null;
  toProduct: ResolvedProduct | null;
  /** Screen label to open after switching (e.g. "Invoices"). Omit to land on home. */
  targetLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ProductSwitchConfirmModal: React.FC<ProductSwitchConfirmModalProps> = ({
  visible,
  fromProduct,
  toProduct,
  targetLabel,
  onCancel,
  onConfirm,
}) => {
  if (!toProduct) {
    return null;
  }

  const toName = getProductFullDisplayName(toProduct);
  const fromName = fromProduct ? getProductFullDisplayName(fromProduct) : 'the current product';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View style={styles.iconCircle}>
            <ProductIcon code={toProduct.code} size={scaleHeight(22)} color={Colors.primaryColor} />
          </View>
          <Text style={styles.title}>Switch to {toName}?</Text>
          <Text style={styles.message}>
            {fromName} screens will close
            {targetLabel ? ` and ${targetLabel} will open in ${toName}.` : '.'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.7}
              onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              activeOpacity={0.7}
              onPress={onConfirm}>
              <Text style={styles.confirmText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  card: {
    width: '100%',
    maxWidth: scaleWidth(360),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(14),
    paddingTop: scaleHeight(20),
    paddingHorizontal: scaleWidth(18),
    paddingBottom: scaleHeight(16),
    alignItems: 'center',
  },
  iconCircle: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(24),
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(12),
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    textAlign: 'center',
    marginBottom: scaleHeight(8),
  },
  message: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: '#5B6470',
    textAlign: 'center',
    marginBottom: scaleHeight(18),
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(10),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: scaleWidth(10),
  },
  confirmButton: {
    backgroundColor: Colors.primaryColor,
  },
  cancelText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  confirmText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
