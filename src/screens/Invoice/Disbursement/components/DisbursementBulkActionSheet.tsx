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
  /** Bulk mark disbursed — `disbursement.bulk_actions`. */
  canMarkAsDisbursed: boolean;
  /** Bulk email — `disbursement.send_bulk_mail`. */
  canSendMail: boolean;
};

const BulkOptionRow: React.FC<{
  cardStyle: object;
  iconName: 'envelope' | 'check-double';
  iconColor: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onPress: () => void;
}> = ({cardStyle, iconName, iconColor, title, subtitle, enabled, onPress}) => (
  <TouchableOpacity
    style={[styles.optionCard, cardStyle, !enabled && styles.optionDisabled]}
    onPress={enabled ? onPress : undefined}
    disabled={!enabled}
    activeOpacity={enabled ? 0.7 : 1}>
    <View style={styles.iconCircle}>
      <FontAwesome6
        name={iconName}
        iconStyle="solid"
        size={16}
        color={enabled ? iconColor : Colors.graybase}
      />
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.optionTitle, !enabled && styles.optionTextDisabled]}>
        {title}
      </Text>
      <Text
        style={[styles.optionSubtitle, !enabled && styles.optionTextDisabled]}>
        {subtitle}
      </Text>
    </View>
  </TouchableOpacity>
);

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
            <BulkOptionRow
              cardStyle={styles.mailCard}
              iconName="envelope"
              iconColor={Colors.tertiaryBlue}
              title="Send Bulk Mail"
              subtitle="Send email to bank for selected invoices"
              enabled={canSendMail}
              onPress={() => onAction('mail')}
            />
            <BulkOptionRow
              cardStyle={styles.disburseCard}
              iconName="check-double"
              iconColor={Colors.primaryColor}
              title="Mark Bulk Disbursed"
              subtitle="Mark selected invoices as disbursed"
              enabled={canMarkAsDisbursed}
              onPress={() => onAction('disburse')}
            />
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
  optionDisabled: {
    opacity: 0.45,
  },
  optionTextDisabled: {
    color: Colors.graybase,
  },
});
