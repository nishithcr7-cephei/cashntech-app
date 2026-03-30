import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {useSelector} from 'react-redux';
import {selectPermissionsLoading} from '@store/permissions';

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
  rawAdminStatus?: string;
  rawApprovalStatus?: string;
  rawInvoiceStatus?: string;
  userDepartment?: string;
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
  rawAdminStatus,
  rawApprovalStatus,
  rawInvoiceStatus,
  userDepartment,
}) => {
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canEdit = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const canDelete = useHasPermission(PERMISSIONS.INVOICE_LIST_DELETE);
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canViewHistory = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVAL_HISTORY);
  const canAttachment = useHasPermission(PERMISSIONS.INVOICE_LIST_ATTACHMENT);
  const canRecreate = useHasPermission(PERMISSIONS.INVOICE_LIST_RECREATE);

  const canShowApproveReject = canApprove || canReject;

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
              {/* Edit – disabled for makers, but also check permission */}
              {canEdit && (
                <TouchableOpacity
                  disabled={isAnchorMaker || isDealerMaker || permissionsLoading}
                  onPress={isAnchorMaker || isDealerMaker ? () => {} : () => onMenuAction('edit', openMenuId)}
                  style={[styles.menuItem, (isAnchorMaker || isDealerMaker || permissionsLoading) && styles.menuItemDisabled]}>
                  <FontAwesome6 name="pen-to-square" iconStyle="regular" color="#858594" size={18} />
                  <Text style={[styles.menuText, (isAnchorMaker || isDealerMaker || permissionsLoading) && styles.menuTextDisabled]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              )}

              {/* Recreate Invoice */}
              {canRecreate && (
                <TouchableOpacity
                  disabled={isAnchorMaker || isDealerMaker || permissionsLoading}
                  onPress={isAnchorMaker || isDealerMaker ? () => {} : () => onMenuAction('recreateInvoice', openMenuId)}
                  style={[styles.menuItem, (isAnchorMaker || isDealerMaker || permissionsLoading) && styles.menuItemDisabled]}>
                  <FontAwesome6 name="square-plus" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <Text style={[styles.menuText, (isAnchorMaker || isDealerMaker || permissionsLoading) && styles.menuTextDisabled]}>
                    Recreate Invoice
                  </Text>
                </TouchableOpacity>
              )}

              {/* Approval History */}
              {canViewHistory && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approvalHistory', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="calendar-check" iconStyle="regular" color="#0085FF" size={18} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Approval History</Text>
                </TouchableOpacity>
              )}

              {/* Dealer Maker can approve/reject at the next workflow step */}
              {isDealerMaker && canShowApproveReject && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approveReject', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="check" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Invoice Verification</Text>
                </TouchableOpacity>
              )}

              {/* Delete – disabled for makers */}
              {canDelete && (
                <TouchableOpacity
                  disabled={isAnchorMaker || isDealerMaker || permissionsLoading}
                  onPress={isAnchorMaker || isDealerMaker ? () => {} : () => onMenuAction('delete', openMenuId)}
                  style={[styles.menuItem, (isAnchorMaker || isDealerMaker || permissionsLoading) && styles.menuItemDisabled]}>
                  <FontAwesome6 name="trash-can" iconStyle="regular" color="#FF5252" size={18} />
                  <Text style={[styles.menuText, (isAnchorMaker || isDealerMaker || permissionsLoading) && styles.menuTextDisabled]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {/* Anchor checker: 3-step menu — Verification (Approve/Reject), Checker Approval (History), Attachments */}
          {isAnchorChecker && !isCashnTechUser && (
            <>
              {canShowApproveReject && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approveReject', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="circle-check" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Invoice Verification</Text>
                    <Text style={styles.menuSubText}>Approval / Reject</Text>
                  </View>
                </TouchableOpacity>
              )}
               {canViewHistory && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('checkerApproval', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="calendar-check" iconStyle="regular" color="#0085FF" size={18} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Checker Approval</Text>
                    <Text style={styles.menuSubText}>Approval History</Text>
                  </View>
                </TouchableOpacity>
              )}
              {canAttachment && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('attachment', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="paperclip" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Attachments</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {/* Dealer checker: keep full row actions incl. View details */}
          {isDealerChecker && !isAnchorChecker && !isCashnTechUser && (
            <>
              {canShowApproveReject && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approveReject', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="check" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Invoice Verification</Text>
                </TouchableOpacity>
              )}
               {canViewHistory && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('checkerApproval', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="calendar-check" iconStyle="regular" color="#0085FF" size={18} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Checker Approval</Text>
                </TouchableOpacity>
              )}
            </>
          )}
            {isCashnTechUser && (
              <>
                 {/* Edit – active for CashnTech user */}
                {canEdit && (
                  <TouchableOpacity
                    disabled={permissionsLoading}
                    onPress={() => onMenuAction('edit', openMenuId)}
                    style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                    <FontAwesome6 name="pen-to-square" iconStyle="regular" color="#858594" size={18} />
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Edit</Text>
                  </TouchableOpacity>
                )}

                {/* Invoice Verification - Conditional Visibility for Admin/Compliance department users */}
                {((rawAdminStatus === 'PENDING_VERIFICATION' || rawAdminStatus === 'Pending Verification')) &&
                  ((rawApprovalStatus === 'APPROVAL_COMPLETE' || rawApprovalStatus === 'Completed' || rawApprovalStatus === 'Approval Complete')) &&
                  ((rawInvoiceStatus === 'IN_PROGRESS' || rawInvoiceStatus === 'In Progress')) &&
                  !!userDepartment && canShowApproveReject && (
                    <TouchableOpacity
                      disabled={permissionsLoading}
                      onPress={() => onMenuAction('invoiceVerification', openMenuId)}
                      style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                      <FontAwesome6 name="circle-check" iconStyle="solid" color={Colors.darkblack} size={16} />
                      <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Invoice Verification</Text>
                    </TouchableOpacity>
                  )}

                 {canViewHistory && (
                  <TouchableOpacity
                    disabled={permissionsLoading}
                    onPress={() => onMenuAction('approvalHistory', openMenuId)}
                    style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                    <FontAwesome6 name="calendar-check" iconStyle="regular" color="#0085FF" size={18} />
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Approval History</Text>
                  </TouchableOpacity>
                )}
                {canAttachment && (
                  <TouchableOpacity
                    disabled={permissionsLoading}
                    onPress={() => onMenuAction('attachment', openMenuId)}
                    style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                    <FontAwesome6 name="paperclip" iconStyle="solid" color={Colors.darkblack} size={16} />
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Attachments</Text>
                  </TouchableOpacity>
                )}

                {/* Delete – active for CashnTech user */}
                {canDelete && (
                  <TouchableOpacity
                    disabled={permissionsLoading}
                    onPress={() => onMenuAction('delete', openMenuId)}
                    style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                    <FontAwesome6 name="trash-can" iconStyle="regular" color="#FF5252" size={18} />
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Delete</Text>
                  </TouchableOpacity>
                )}
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
    minWidth: scaleWidth(200),
  },
  menuItemTextBlock: {
    flex: 1,
    flexShrink: 1,
  },
  menuSubText: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyRegular,
    marginTop: scaleHeight(2),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  menuText: {
    fontSize: scaleFont(14),
    color: '#666666',
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
