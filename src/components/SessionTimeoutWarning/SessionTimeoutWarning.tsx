import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type SessionTimeoutWarningProps = {
  visible: boolean;
  secondsLeft: number;
  onContinue: () => void;
  onLogout: () => void;
};

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  visible,
  secondsLeft,
  onContinue,
  onLogout,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onContinue}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Session about to expire</Text>
        <Text style={styles.message}>
          You have been inactive for a while. For your security you will be
          logged out in{' '}
          <Text style={styles.countdown}>{secondsLeft}s</Text>.
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out now">
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Log out
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue session">
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

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
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(20),
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkGray,
    marginBottom: scaleHeight(8),
  },
  message: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    lineHeight: scaleFont(20),
  },
  countdown: {
    fontFamily: Fonts.GilroyBold,
    color: Colors.primaryColor,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: scaleHeight(20),
    gap: scaleWidth(10),
  },
  button: {
    paddingHorizontal: scaleWidth(18),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
    minWidth: scaleWidth(96),
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primaryColor,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.graybase,
    backgroundColor: Colors.white,
  },
  buttonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  primaryButtonText: {
    color: Colors.white,
  },
  secondaryButtonText: {
    color: Colors.darkblack,
  },
});
