import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
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

const SCREEN = Dimensions.get('screen');

export const BusyOverlay: React.FC<BusyOverlayProps> = ({
  visible,
  message = 'Please wait…',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated={Platform.OS === 'android'}
      onRequestClose={() => undefined}>
      <View
        style={[
          styles.root,
          {width: SCREEN.width, height: SCREEN.height},
        ]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
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
