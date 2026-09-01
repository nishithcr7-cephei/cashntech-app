import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
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
  if (!visible) return null;

  return (
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
            <FontAwesome6 name="circle-xmark" iconStyle="solid" size={24} color={Colors.graybase} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Choose a bulk action to apply</Text>

        <View style={styles.optionsContainer}>
          {(isAnchorChecker || isDealerChecker || isVfAnchorMaker) ? (
            <>
              <TouchableOpacity
                style={[styles.optionCard, styles.verifyCard]}
                onPress={() => onAction('Approve')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6 name="check" iconStyle="solid" size={16} color="#10B981" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Approve</Text>
                  <Text style={styles.optionSubtitle}>Approve selected invoices</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, styles.rejectCard]}
                onPress={() => onAction('Reject')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6 name="xmark" iconStyle="solid" size={16} color="#EF4444" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Reject</Text>
                  <Text style={styles.optionSubtitle}>Reject selected invoices</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.optionCard, styles.verifyCard]}
                onPress={() => onAction('Verify')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6 name="check" iconStyle="solid" size={16} color="#10B981" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Verify</Text>
                  <Text style={styles.optionSubtitle}>Mark selected as verified</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, styles.holdCard]}
                onPress={() => onAction('On Hold')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6 name="pause" iconStyle="solid" size={16} color="#3B82F6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk On Hold</Text>
                  <Text style={styles.optionSubtitle}>Pause selected invoices</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, styles.rejectCard]}
                onPress={() => onAction('Reject')}>
                <View style={styles.iconCircle}>
                  <FontAwesome6 name="xmark" iconStyle="solid" size={16} color="#EF4444" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Bulk Reject</Text>
                  <Text style={styles.optionSubtitle}>Reject selected invoices</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
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
