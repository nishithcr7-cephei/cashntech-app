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
import {canShowCashnTechInvoiceVerification, canShowFinanceRequest, canShowInvoiceListDelete, canShowInvoiceListEdit, canShowWorkflowApproveReject} from '@utils/invoiceListActionable';

/**
 * Visibility and Actionability Logic for "Manage Attachment"
 * VISIBLE: Super Users OR Anchor Makers (with status restrictions)
 * HIDDEN: Dealers (Maker), and finalized statuses
 */
export const shouldShowAttachmentOption = (
  invoiceStatus: string,
  adminStatus: string | undefined,
  user: any,
  canAttachment: boolean,
) => {
  const pg = user?.permission_group?.[0];
  const bRole = pg?.business_role;
  const fRole = pg?.functional_role;

  const s = invoiceStatus?.toLowerCase() || '';
  const adminS = adminStatus?.toLowerCase() || '';
  const isAllowedStatus = ['created', 'rejected', 'attachment pending'].includes(s);

  // 1. Super User (Internal CashnTech): All roles null - must be in allowed status
  const isSuperUser = bRole === null && fRole === null;
  if (isSuperUser && canAttachment && isAllowedStatus) return true;

  // 2. Regular Anchor / counterparty (Dealer + Vendor) roles
  const isAnchorMaker = bRole === 'Anchor' && fRole === 'Maker';
  const isAnchorChecker = bRole === 'Anchor' && fRole === 'Checker';
  const isCounterpartyChecker =
    (bRole === 'Dealer' || bRole === 'Vendor') && fRole === 'Checker';

  // Anchor Maker must be in a specific status to view/edit attachments
  if (isAnchorMaker && canAttachment && isAllowedStatus) {
    return true;
  }

  // Anchor Checker must also be in a specific status to view attachments for review
  if (isAnchorChecker && canAttachment && isAllowedStatus) {
    return true;
  }

  // Dealer/Vendor Checker can view attachments for review, except when invoice is
  // rejected or admin verification has reached a terminal status.
  const isRejectedStatus = s.includes('reject');
  const isAdminTerminalStatus = ['verified', 'rejected'].includes(adminS);
  if (isCounterpartyChecker && canAttachment && !isRejectedStatus && !isAdminTerminalStatus) {
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
  isAnchorAllAccess?: boolean;
  isDealerAllAccess?: boolean;
  isCashnTechUser?: boolean;
  rawAdminStatus?: string;
  rawApprovalStatus?: string;
  rawInvoiceStatus?: string;
  /** List-retained actionable flag — preferred over approval_status parsing */
  listActionable?: boolean;
  /** List-retained deletable flag — mirrors backend deleteInvoice authorization */
  listDeletable?: boolean;
  /** Current workflow step action type from list API */
  currentStepActionType?: string | null;
  userDepartment?: string;
  approvalLogsCount?: number;
  /** Backend updateInvoice editable when sequence_no <= 2 (or Draft/Rejected) */
  currentStepSequenceNo?: number | null;
  /** Program method — Pull/VF upload is counterparty maker; Push is anchor maker */
  programMethod?: string | null;
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
  isAnchorAllAccess = false,
  isDealerAllAccess = false,
  isCashnTechUser = false,
  rawAdminStatus,
  rawApprovalStatus,
  rawInvoiceStatus,
  listActionable,
  listDeletable,
  currentStepActionType,
  userDepartment: _userDepartment,
  approvalLogsCount: _approvalLogsCount = 0,
  currentStepSequenceNo = null,
  programMethod = null,
}) => {
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canEdit = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const canDelete = useHasPermission(PERMISSIONS.INVOICE_LIST_DELETE);
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canViewHistory = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVAL_HISTORY);
  const canAttachment = useHasPermission(PERMISSIONS.INVOICE_LIST_ATTACHMENT);
  const canVerify = useHasPermission(PERMISSIONS.INVOICE_LIST_ADMIN_VERIFICATION);
  const canFinanceRequest = useHasPermission(PERMISSIONS.INVOICE_LIST_FINANCE_REQUEST);

  const userInfo = useSelector(userSelector.getUserInfo);

  const showAttachmentOption = shouldShowAttachmentOption(
    rawInvoiceStatus || '',
    rawAdminStatus,
    userInfo,
    canAttachment,
  );

  const isEditable = canShowInvoiceListEdit(
    {
      rawInvoiceStatus,
      rawAdminStatus,
      rawApprovalStatus,
      currentStepSequenceNo,
    },
    canEdit,
    {
      programMethod,
      isAnchorMaker,
      isDealerMaker,
      isCashnTechUser,
      isAnchorAllAccess,
      isDealerAllAccess,
    },
  );

  const isDeletable = canShowInvoiceListDelete(
    {rawInvoiceStatus},
    canDelete,
    listDeletable,
  );

  const roleLabel = (
    userInfo?.permission_group?.[0]?.business_role ||
    userInfo?.permission_group?.[0]?.functional_role ||
    ''
  ).trim();

  const actionRow = {
    actionable: listActionable,
    rawApprovalStatus,
    rawAdminStatus,
    rawInvoiceStatus,
    currentStepActionType,
  };

  const canShowApproveReject =
    !isCashnTechUser &&
    canShowWorkflowApproveReject(
      actionRow,
      canApprove || canReject,
      {
        isCashnTechUser,
        isAnchorAllAccess,
        isDealerAllAccess,
        roleLabel,
      },
    );

  const showCashnTechVerification = canShowCashnTechInvoiceVerification(
    actionRow,
    canVerify || canApprove || canReject,
  );

  const showFinanceRequest = canShowFinanceRequest(
    actionRow,
    canFinanceRequest,
    {isCashnTechUser},
  );

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
          {((isAnchorMaker || isDealerMaker) && (!isAnchorChecker && !isDealerChecker || isAnchorAllAccess || isDealerAllAccess)) && (
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
                  <FontAwesome6 name="calendar-check" iconStyle="regular" color="#7C3AED" size={18} />
                  <Text style={[styles.menuText, styles.menuTextHistory, permissionsLoading && styles.menuTextDisabled]}>Approval History</Text>
                </TouchableOpacity>
              )}

              {/* Anchor/Dealer/Vendor Maker: approve when list actionable (VF AM step + DF/VF maker steps) */}
              {(isAnchorMaker || isDealerMaker) && canShowApproveReject && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approveReject', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="check" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Invoice Verification</Text>
                    <Text style={styles.menuSubText}>Approval / Reject</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* VF: Vendor Maker raises Finance Request after AC; DF Dealer Maker same when workflow requires it */}
              {(isAnchorMaker || isDealerMaker) && showFinanceRequest && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('financeRequest', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="file-invoice-dollar" iconStyle="solid" color="#0085FF" size={16} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, styles.menuTextAction, permissionsLoading && styles.menuTextDisabled]}>
                      Finance Request
                    </Text>
                    <Text style={styles.menuSubText}>Raise disbursement request</Text>
                  </View>
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
          {isAnchorChecker && !isAnchorAllAccess && !isCashnTechUser && (
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

              {showAttachmentOption && !isAnchorAllAccess && (
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
              {canViewHistory && !isAnchorAllAccess && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approvalHistory', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="calendar-check" iconStyle="regular" color="#7C3AED" size={18} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, styles.menuTextHistory, permissionsLoading && styles.menuTextDisabled]}>Approval History</Text>
                    <Text style={styles.menuSubText}>Track Verification</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Delete – visible if isDeletable */}
              {isDeletable && !isAnchorAllAccess && (
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
          {/* Dealer checker: Invoice Verification, Approval History, Attachments */}
          {isDealerChecker && !isDealerAllAccess && !isAnchorChecker && !isCashnTechUser && (
            <>
              {canShowApproveReject && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approveReject', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="check" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Invoice Verification</Text>
                    <Text style={styles.menuSubText}>Approval / Reject</Text>
                  </View>
                </TouchableOpacity>
              )}

              {canViewHistory && !isDealerAllAccess && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approvalHistory', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="calendar-check" iconStyle="regular" color="#7C3AED" size={18} />
                  <Text style={[styles.menuText, styles.menuTextHistory, permissionsLoading && styles.menuTextDisabled]}>Approval History</Text>
                </TouchableOpacity>
              )}

              {showAttachmentOption && !isDealerAllAccess && (
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

              {/* Delete – visible if isDeletable */}
              {isDeletable && !isDealerAllAccess && (
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
          {isCashnTechUser && (
            <>
              {/* Order: Approval History → Invoice Verification → Attachment → Delete */}
              {canViewHistory && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('approvalHistory', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="calendar-check" iconStyle="regular" color="#7C3AED" size={18} />
                  <Text style={[styles.menuText, styles.menuTextHistory, permissionsLoading && styles.menuTextDisabled]}>
                    Approval History
                  </Text>
                </TouchableOpacity>
              )}

              {/* Invoice Verification — admin turn (actionable / pending verification) */}
              {showCashnTechVerification && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('invoiceVerification', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="circle-check" iconStyle="solid" color="#0085FF" size={16} />
                  <View style={styles.menuItemTextBlock}>
                    <Text style={[styles.menuText, styles.menuTextAction, permissionsLoading && styles.menuTextDisabled]}>
                      Invoice Verification
                    </Text>
                    <Text style={styles.menuSubText}>Approval / Reject</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Attachments — Shown for all admin statuses.
                  CashnTech is a super-user role; bypass role/status gating in shouldShowAttachmentOption. */}
              {canAttachment && (
                <TouchableOpacity
                  disabled={permissionsLoading}
                  onPress={() => onMenuAction('attachment', openMenuId)}
                  style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}>
                  <FontAwesome6 name="paperclip" iconStyle="solid" color={Colors.darkblack} size={16} />
                  <Text style={[styles.menuText, permissionsLoading && styles.menuTextDisabled]}>Attachments</Text>
                </TouchableOpacity>
              )}

              {/* Delete — Shown for all admin statuses */}
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
  menuTextAction: {
    color: '#0085FF',
  },
  menuTextHistory: {
    color: '#7C3AED',
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
