import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedCount: number;
  onAction: (action: 'mail' | 'disburse') => void;
  canMarkAsDisbursed: boolean;
  canSendMail: boolean;
};

export const DisbursementBulkActionSheet: React.FC<Props> = ({
  visible,
  onClose,
  selectedCount,
  onAction,
  canMarkAsDisbursed,
  canSendMail,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{selectedCount} Invoices Selected</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome6
                name="circle-xmark"
                iconStyle="solid"
                size={24}
                color={Colors.graybase}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Choose a bulk action to apply</Text>

          <View style={styles.optionsContainer}>
            {canSendMail && (
              <TouchableOpacity
                style={[styles.optionCard, styles.mailCard]}
                onPress={() => onAction('mail')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6
                    name="envelope"
                    iconStyle="solid"
                    size={16}
                    color={Colors.tertiaryBlue}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Send Bulk Mail</Text>
                  <Text style={styles.optionSubtitle}>
                    Send email to bank for selected invoices
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {canMarkAsDisbursed && (
              <TouchableOpacity
                style={[styles.optionCard, styles.disburseCard]}
                onPress={() => onAction('disburse')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6
                    name="check-double"
                    iconStyle="solid"
                    size={16}
                    color={Colors.primaryColor}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Mark Bulk Disbursed</Text>
                  <Text style={styles.optionSubtitle}>
                    Mark selected invoices as disbursed
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(24),
    borderTopRightRadius: scaleWidth(24),
    paddingHorizontal: scaleWidth(20),
    paddingBottom: Platform.OS === 'ios' ? scaleHeight(40) : scaleHeight(24),
    paddingTop: scaleHeight(12),
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: scaleWidth(40),
    height: scaleHeight(4),
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: scaleHeight(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
  },
  title: {
    fontSize: scaleFont(20),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  subtitle: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(24),
  },
  optionsContainer: {
    gap: scaleHeight(12),
    marginBottom: scaleHeight(8),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(16),
    borderRadius: scaleWidth(16),
    gap: scaleWidth(16),
  },
  mailCard: {
    backgroundColor: '#EFF6FF',
  },
  disburseCard: {
    backgroundColor: '#F0F7FF',
  },
  iconCircle: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(18),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  optionSubtitle: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginTop: scaleHeight(2),
  },
});
