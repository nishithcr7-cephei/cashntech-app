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
  isCashnTechUser?: boolean;
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
  isCashnTechUser = false,
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
          {/* Maker actions: makers see disabled Edit/Recreate/Delete + active Approval History */}
          {(isAnchorMaker || isDealerMaker) && !isCashnTechUser && (
            <>
              {/* Edit – disabled for makers */}
              <TouchableOpacity
                disabled={isAnchorMaker || isDealerMaker}
                onPress={isAnchorMaker || isDealerMaker ? () => {} : () => onMenuAction('edit', openMenuId)}
                style={[styles.menuItem, (isAnchorMaker || isDealerMaker) && styles.menuItemDisabled]}>
                <FontAwesome6 name="pencil" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={[styles.menuText, (isAnchorMaker || isDealerMaker) && styles.menuTextDisabled]}>
                  Edit
                </Text>
              </TouchableOpacity>

              {/* Recreate Invoice – disabled for makers */}
              <TouchableOpacity
                disabled={isAnchorMaker || isDealerMaker}
                onPress={isAnchorMaker || isDealerMaker ? () => {} : () => onMenuAction('recreateInvoice', openMenuId)}
                style={[styles.menuItem, (isAnchorMaker || isDealerMaker) && styles.menuItemDisabled]}>
                <FontAwesome6 name="square-plus" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={[styles.menuText, (isAnchorMaker || isDealerMaker) && styles.menuTextDisabled]}>
                  Recreate Invoice
                </Text>
              </TouchableOpacity>

              {/* Approval History – always active for all makers */}
              <TouchableOpacity
                onPress={() => onMenuAction('approvalHistory', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="clock-rotate-left" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Approval History</Text>
              </TouchableOpacity>

              {/* View Invoice Details */}
              <TouchableOpacity
                onPress={() => onMenuAction('viewDetails', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="file-lines" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>View Invoice Details</Text>
              </TouchableOpacity>

              {/* Dealer Maker can approve/reject at the next workflow step */}
              {isDealerMaker && (
                <TouchableOpacity
                  onPress={() => onMenuAction('approveReject', openMenuId)}
                  style={styles.menuItem}>
                  <FontAwesome6 name="check" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <Text style={styles.menuText}>Invoice Verification</Text>
                </TouchableOpacity>
              )}

              {/* Delete – disabled for makers */}
              <TouchableOpacity
                disabled={isAnchorMaker || isDealerMaker}
                onPress={isAnchorMaker || isDealerMaker ? () => {} : () => onMenuAction('delete', openMenuId)}
                style={[styles.menuItem, (isAnchorMaker || isDealerMaker) && styles.menuItemDisabled]}>
                <FontAwesome6 name="trash" iconStyle="solid" color={Colors.red} size={16} />
                <Text style={[styles.menuText, styles.deleteMenuText, (isAnchorMaker || isDealerMaker) && styles.menuTextDisabled]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          )}
          {(isAnchorChecker || isDealerChecker) && !isCashnTechUser && (
            <>
              {/* View Invoice Details */}
              <TouchableOpacity
                onPress={() => onMenuAction('viewDetails', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="file-lines" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>View Invoice Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('approveReject', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="check" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Invoice Verification</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('checkerApproval', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="calendar-check" iconStyle="solid" color="#3B82F6" size={16} />
                <Text style={styles.menuText}>Checker Approval</Text>
              </TouchableOpacity>
            </>
          )}
          {isCashnTechUser && (
            <>
              {/* View Invoice Details */}
              <TouchableOpacity
                onPress={() => onMenuAction('viewDetails', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="file-lines" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>View Invoice Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('invoiceVerification', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="circle-check" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Invoice Verification</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMenuAction('approvalHistory', openMenuId)}
                style={styles.menuItem}>
                <FontAwesome6 name="clock-rotate-left" iconStyle="solid" color={Colors.darkblack} size={16} />
                <Text style={styles.menuText}>Approval History</Text>
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
  menuItemDisabled: {
    opacity: 0.35,
  },
  menuTextDisabled: {
    color: '#A0A0A0',
  },
});
