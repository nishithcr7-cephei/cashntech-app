import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type BusyOverlayProps = {
  visible: boolean;
  message?: string;
};

export const BusyOverlay: React.FC<BusyOverlayProps> = ({
  visible,
  message = 'Please wait…',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}>
      <View style={styles.backdrop} pointerEvents="auto">
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(24),
  },
  card: {
    minWidth: scaleWidth(200),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(24),
    paddingHorizontal: scaleWidth(20),
    alignItems: 'center',
  },
  message: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    textAlign: 'center',
  },
});
