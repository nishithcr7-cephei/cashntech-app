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
};

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export const BulkActionSheet: React.FC<Props> = ({
  visible,
  onClose,
  selectedCount,
  onAction,
  isAnchorChecker = false,
  isDealerChecker = false,
  isVfAnchorMaker = false,
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
              <TouchableOpacity
                style={[styles.optionCard, styles.verifyCard]}
                onPress={() => onAction('Approve')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6
                    name="check"
                    iconStyle="solid"
                    size={15}
                    color="#10B981"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Approve</Text>
                  <Text style={styles.optionSubtitle}>
                    Approve selected invoices
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, styles.rejectCard]}
                onPress={() => onAction('Reject')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6
                    name="xmark"
                    iconStyle="solid"
                    size={15}
                    color="#EF4444"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Reject</Text>
                  <Text style={styles.optionSubtitle}>
                    Reject selected invoices
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.optionCard, styles.verifyCard]}
                onPress={() => onAction('Verify')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6
                    name="check"
                    iconStyle="solid"
                    size={15}
                    color="#10B981"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Verify</Text>
                  <Text style={styles.optionSubtitle}>
                    Mark selected as verified
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, styles.holdCard]}
                onPress={() => onAction('On Hold')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6
                    name="pause"
                    iconStyle="solid"
                    size={15}
                    color="#3B82F6"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk On Hold</Text>
                  <Text style={styles.optionSubtitle}>
                    Pause selected invoices
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, styles.rejectCard]}
                onPress={() => onAction('Reject')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6
                    name="xmark"
                    iconStyle="solid"
                    size={15}
                    color="#EF4444"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Reject</Text>
                  <Text style={styles.optionSubtitle}>
                    Reject selected invoices
                  </Text>
                </View>
              </TouchableOpacity>
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
});
