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
import {userSelector} from '@store/user';

/**
 * Visibility and Actionability Logic for "Manage Attachment"
 * VISIBLE: Super Users OR Anchor Makers (with status restrictions)
 * HIDDEN: Dealers, Checkers, and finalized statuses for Anchor Makers
 */
export const shouldShowAttachmentOption = (
  invoiceStatus: string,
  user: any,
  canAttachment: boolean,
) => {
  const pg = user?.permission_group?.[0];
  const bRole = pg?.business_role;
  const fRole = pg?.functional_role;

  const s = invoiceStatus?.toLowerCase() || '';
  const isAllowedStatus = ['created', 'rejected', 'attachment pending'].includes(s);

  // 1. Super User (Internal CashnTech): All roles null - must be in allowed status
  const isSuperUser = bRole === null && fRole === null;
  if (isSuperUser && canAttachment && isAllowedStatus) return true;

  // 2. Regular Anchor Maker
  const isAnchorMaker = bRole === 'Anchor' && fRole === 'Maker';
  const isAnchorChecker = bRole === 'Anchor' && fRole === 'Checker';

  // Anchor Maker must be in a specific status to view/edit attachments
  if (isAnchorMaker && canAttachment && isAllowedStatus) {
    return true;
  }

  // Anchor Checker must also be in a specific status to view attachments for review
  if (isAnchorChecker && canAttachment && isAllowedStatus) {
    return true;
  }

  return false;
};

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
  approvalLogsCount?: number;
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
  approvalLogsCount = 0,
}) => {
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canEdit = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const canDelete = useHasPermission(PERMISSIONS.INVOICE_LIST_DELETE);
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canViewHistory = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVAL_HISTORY);
  const canAttachment = useHasPermission(PERMISSIONS.INVOICE_LIST_ATTACHMENT);
  const canRecreate = useHasPermission(PERMISSIONS.INVOICE_LIST_RECREATE);

  const userInfo = useSelector(userSelector.getUserInfo);

  const showAttachmentOption = shouldShowAttachmentOption(
    rawInvoiceStatus || '',
    userInfo,
    canAttachment,
  );

  const isInvoiceInEditableState = (
    status?: string,
    approvalStatus?: string,
    adminStatus?: string,
    logsCount: number = 0,
  ) => {
    const s = status || '';
    const approvalS = (approvalStatus || '').toLowerCase();
    const adminS = (adminStatus || '').toLowerCase();

    // 1. 'Rejected' & 'Draft' — ALWAYS editable regardless of logs count
    //    (mirrors backend: invoice_status === 'Rejected' || 'Draft' bypasses logs check)
    const isRejectedOrDraft = ['Rejected', 'REJECTED_BY_CHECKER', 'Draft'].includes(s);
    if (isRejectedOrDraft) return true;

    // 2. 'Created', 'Pending', 'Attachment Pending' — editable ONLY if no workflow
    //    action has been taken yet (logs <= 1), mirroring backend rule:
    //    approvalLogs.length > 1 → throw UnauthorizedException
    const isEarlyStatus = ['Pending', 'Created', 'Attachment Pending'].includes(s);
    const hasNoWorkflowAction = logsCount <= 1;

    // 3. HIDDEN: Terminal approval/admin statuses where editing is always forbidden
    const isForbiddenByApproval = ['approved', 'disbursed', 'cancelled', 'completed', 'approval complete'].some(
      term => approvalS.includes(term),
    );
    const isForbiddenByAdmin = adminS === 'verified';

    return isEarlyStatus && hasNoWorkflowAction && !isForbiddenByApproval && !isForbiddenByAdmin;
  };

  const isInvoiceInActionableState = (invoiceStatus?: string, adminStatus?: string) => {
    const iStatus = invoiceStatus?.toLowerCase() || '';
    const aStatus = adminStatus?.toLowerCase() || '';

    // Block if in Draft or missing attachments
    const isDraftState = ['draft', 'pending attachment', 'attachment pending'].includes(iStatus);
    // Block if in a terminal state
    const isTerminalState = ['verified', 'rejected'].includes(aStatus);

    return !isDraftState && !isTerminalState;
  };

  const isInvoiceDeletableState = (logsCount: number = 0) => {
    // Backend allows delete if no action taken beyond creation (logs <= 1)
    return logsCount <= 1;
  };

  const isEditable = canEdit 
    && (isAnchorMaker || isDealerMaker || isCashnTechUser) 
    && isInvoiceInEditableState(
      rawInvoiceStatus,
      rawApprovalStatus,
      rawAdminStatus,
      approvalLogsCount,
    );

  const isDeletable = canDelete && isInvoiceDeletableState(approvalLogsCount);

  const isActionable = isInvoiceInActionableState(rawInvoiceStatus, rawAdminStatus);
  const canShowApproveReject = (canApprove || canReject) && isActionable;

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
          {/* Maker actions: Anchor/Dealer Makers OR CashnTech Users with edit permission can edit (Checkers excluded) */}
          {(isAnchorMaker || isDealerMaker || (isCashnTechUser && canEdit)) && !isAnchorChecker && !isDealerChecker && (
            <>
              {/* Edit – ONLY visible if isEditable */}
              {isEditable && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('edit', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="pen-to-square" iconStyle="regular" color="#858594" size={18} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>
                    Edit
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

              {/* Attachments – Conditional Visibility */}
              {showAttachmentOption && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('attachment', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="paperclip" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Attachments</Text>
                </TouchableOpacity>
              )}

              {/* Delete – ONLY visible if isDeletable */}
              {isDeletable && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('delete', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="trash-can" iconStyle="regular" color="#FF5252" size={18} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>
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

              {showAttachmentOption && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('attachment', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="paperclip" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Attachments</Text>
                    <Text style={styles.menuSubText}>View Supporting Docs</Text>
                  </View>
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
            </>
          )}
            {isCashnTechUser && (
              <>
                {/* Edit – ONLY visible if isEditable (including permission and status) */}
                {isEditable && (
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

                {showAttachmentOption && (
                  <TouchableOpacity
                    disabled={permissionsLoading}
                    onPress={() => onMenuAction('attachment', openMenuId)}
                    style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                    <FontAwesome6 name="paperclip" iconStyle="solid" color={Colors.darkblack} size={16} />
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Attachments</Text>
                  </TouchableOpacity>
                )}

                {/* Delete – ONLY visible if isDeletable */}
                {isDeletable && (
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
