import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

type MenuAnchor = {x: number; y: number; width: number; height: number} | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  openMenuId: string | null;
  menuAnchor: MenuAnchor;
  getMenuPosition: (anchor: MenuAnchor) => ViewStyle;
  onMenuAction: (action: string, invoiceId: string) => void;
  isAnchorMaker: boolean;
  isAnchorChecker: boolean;
  isDealerMaker: boolean;
  isDealerChecker: boolean;
};

export const InvoiceActionMenuModal: React.FC<Props> = ({
  visible,
  onClose,
  openMenuId,
  menuAnchor,
  getMenuPosition,
  onMenuAction,
  isAnchorMaker,
  isAnchorChecker,
  isDealerMaker,
  isDealerChecker,
}) => {
  if (!openMenuId) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.menu, getMenuPosition(menuAnchor)]}
          onPress={() => {}}>
          {(isAnchorMaker || isDealerMaker) && (
            <>
              <TouchableOpacity
                onPress={() => onMenuAction('edit', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="pencil" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('checkerApproval', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="calendar-check" iconStyle="solid" color="#3B82F6" size={16} />
                <Text style={styles.menuText}>Checker Approval</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('recreateInvoice', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="square-plus" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Recreate Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('attachment', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="paperclip" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Attachment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('print', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="print" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('delete', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="trash" iconStyle="solid" color={Colors.red} size={16} />
                <Text style={[styles.menuText, styles.deleteMenuText]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
          {(isAnchorChecker || isDealerChecker) && (
            <>
              <TouchableOpacity
                onPress={() => onMenuAction('approveReject', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="check" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Approve / Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('checkerApproval', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="calendar-check" iconStyle="solid" color="#3B82F6" size={16} />
                <Text style={styles.menuText}>Checker Approval</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: scaleWidth(180),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  menuText: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  deleteMenuText: {
    color: Colors.red,
  },
});
