import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedCount: number;
  onAction: (action: 'Verify' | 'Reject' | 'On Hold' | 'Approve') => void;
  isAnchorChecker?: boolean;
  isDealerChecker?: boolean;
  isVfAnchorMaker?: boolean;
  /** Party workflow bulk (Approve / Reject) — requires bulk_actions + step grant. */
  canBulkApprove?: boolean;
  canBulkReject?: boolean;
  /** CnT admin bulk (Verify / On Hold / Reject) — upload_verify. */
  canBulkVerify?: boolean;
  canBulkOnHold?: boolean;
  canBulkRejectAdmin?: boolean;
};

const BulkOptionRow: React.FC<{
  cardStyle: object;
  iconName: 'check' | 'xmark' | 'pause';
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
        size={15}
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

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export const BulkActionSheet: React.FC<Props> = ({
  visible,
  onClose,
  selectedCount,
  onAction,
  isAnchorChecker = false,
  isDealerChecker = false,
  isVfAnchorMaker = false,
  canBulkApprove = true,
  canBulkReject = true,
  canBulkVerify = true,
  canBulkOnHold = true,
  canBulkRejectAdmin = true,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const isTwoOptionSheet =
    isAnchorChecker || isDealerChecker || isVfAnchorMaker;
  const bottomPad = Math.max(insets.bottom, scaleHeight(8)) + scaleHeight(8);

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheetContainer,
          {
            paddingBottom: bottomPad,
            maxHeight: SCREEN_HEIGHT * (isTwoOptionSheet ? 0.42 : 0.55),
          },
        ]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>{selectedCount} Invoices Selected</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <FontAwesome6
              name="circle-xmark"
              iconStyle="solid"
              size={22}
              color={Colors.graybase}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Choose a bulk action to apply</Text>

        <ScrollView
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}>
          {isTwoOptionSheet ? (
            <>
              <BulkOptionRow
                cardStyle={styles.verifyCard}
                iconName="check"
                iconColor="#10B981"
                title="Bulk Approve"
                subtitle="Approve selected invoices"
                enabled={canBulkApprove}
                onPress={() => onAction('Approve')}
              />
              <BulkOptionRow
                cardStyle={styles.rejectCard}
                iconName="xmark"
                iconColor="#EF4444"
                title="Bulk Reject"
                subtitle="Reject selected invoices"
                enabled={canBulkReject}
                onPress={() => onAction('Reject')}
              />
            </>
          ) : (
            <>
              <BulkOptionRow
                cardStyle={styles.verifyCard}
                iconName="check"
                iconColor="#10B981"
                title="Bulk Verify"
                subtitle="Mark selected as verified"
                enabled={canBulkVerify}
                onPress={() => onAction('Verify')}
              />
              <BulkOptionRow
                cardStyle={styles.holdCard}
                iconName="pause"
                iconColor="#3B82F6"
                title="Bulk On Hold"
                subtitle="Pause selected invoices"
                enabled={canBulkOnHold}
                onPress={() => onAction('On Hold')}
              />
              <BulkOptionRow
                cardStyle={styles.rejectCard}
                iconName="xmark"
                iconColor="#EF4444"
                title="Bulk Reject"
                subtitle="Reject selected invoices"
                enabled={canBulkRejectAdmin}
                onPress={() => onAction('Reject')}
              />
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(20),
    borderTopRightRadius: scaleWidth(20),
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(10),
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: scaleWidth(36),
    height: scaleHeight(4),
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: scaleHeight(8),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(2),
  },
  title: {
    fontSize: scaleFont(17),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
    flex: 1,
    marginRight: scaleWidth(8),
  },
  subtitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(12),
  },
  optionsScroll: {
    flexGrow: 0,
  },
  optionsContainer: {
    gap: scaleHeight(8),
    paddingBottom: scaleHeight(4),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(12),
  },
  verifyCard: {
    backgroundColor: '#ECFDF5',
  },
  holdCard: {
    backgroundColor: '#EFF6FF',
  },
  rejectCard: {
    backgroundColor: '#FEF2F2',
  },
  iconCircle: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  optionSubtitle: {
    fontSize: scaleFont(11),
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
