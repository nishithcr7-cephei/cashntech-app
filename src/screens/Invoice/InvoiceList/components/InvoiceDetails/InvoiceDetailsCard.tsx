import * as React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Dots} from '@assets/Icons';
import type {InvoiceRow} from './types';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {useSelector} from 'react-redux';
import {selectPermissionsLoading} from '@store/permissions';

const STATUS_COLORS = {
  ATTACHMENT_PENDING: { bg: '#FFF4E5', text: '#FF8C00' },
  CREATED: { bg: '#E3F2FD', text: '#1976D2' },
  DISBURSED: { bg: '#E8F5E9', text: '#2E7D32' },
  REJECTED: { bg: '#FFEBEE', text: '#D32F2F' },
  DEFAULT: { bg: '#F7F8FB', text: Colors.darkblack },
};

function getInvoiceStatusStyles(invoiceStatus: string) {
  const s = (invoiceStatus || '').toLowerCase();
  if (s.includes('attachment pending')) return STATUS_COLORS.ATTACHMENT_PENDING;
  if (s.includes('created')) return STATUS_COLORS.CREATED;
  if (s.includes('disbursed')) return STATUS_COLORS.DISBURSED;
  if (s.includes('reject')) return STATUS_COLORS.REJECTED;
  return STATUS_COLORS.DEFAULT;
}

function getApprovalStatusStyles(approvalStatus: string) {
  const s = (approvalStatus || '').toLowerCase();
  if (s.includes('pending')) return STATUS_COLORS.ATTACHMENT_PENDING; // Using Orange for Pending
  if (s.includes('reject')) return STATUS_COLORS.REJECTED;
  if (s.includes('completed') || s.includes('approval complete')) return STATUS_COLORS.DISBURSED; // Using Green for Completed
  return STATUS_COLORS.DEFAULT;
}

function getAdminStatusStyles(adminStatus: string) {
  const s = (adminStatus || '').toLowerCase();
  if (s === 'verify' || s === 'verified' || s === 'submitted') return STATUS_COLORS.DISBURSED;
  if (s === 'hold') return { bg: '#E0E0E0', text: '#6B5B4F' }; // Gray/Brown for Hold
  if (s === 'reject' || s === 'rejected') return STATUS_COLORS.REJECTED;
  return STATUS_COLORS.DEFAULT;
}

type Props = {
  row: InvoiceRow;
  isAnchorMaker: boolean;
  isDealerMaker: boolean;
  isDealerChecker: boolean;
  isAnchorChecker: boolean;
  isCashnTechUser?: boolean;
  storedUserRole?: string;
  isSelected: boolean;
  onMenuToggle: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onInvoiceNoPress?: (invoiceId: string, invoiceNo: string) => void;
  registerMenuRef: (id: string, ref: View | null) => void;
  index: number;
  transparency?: number;
};

export const InvoiceDetailsCard: React.FC<Props> = ({
  row,
  isAnchorMaker,
  isDealerMaker,
  isDealerChecker,
  isAnchorChecker,
  isCashnTechUser = false,
  storedUserRole,
  isSelected,
  onMenuToggle,
  onToggleSelection,
  onInvoiceNoPress,
  registerMenuRef,
  index,
  transparency = 1,
}) => {
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canEdit = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const canDelete = useHasPermission(PERMISSIONS.INVOICE_LIST_DELETE);
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canViewHistory = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVAL_HISTORY);
  const canAttachment = useHasPermission(PERMISSIONS.INVOICE_LIST_ATTACHMENT);
  const canRecreate = useHasPermission(PERMISSIONS.INVOICE_LIST_RECREATE);
  const canPrint = useHasPermission(PERMISSIONS.INVOICE_LIST_PRINT);

  const hasAnyActionPermission = 
    canEdit || canDelete || canApprove || canReject || 
    canViewHistory || canAttachment || canRecreate || canPrint;

  const invoiceStatusLower = (row.invoiceStatus || '').toLowerCase();
  const approvalStatusLower = (row.approvalStatus || '').toLowerCase();
  const adminStatusLower = (row.adminStatus || '').toLowerCase();

  // Role-based Blue Dot Logic (Case-insensitive check)
  const roleCheckStr = `Pending ${storedUserRole || ''}`.trim().toLowerCase();
  const isPendingMyRole = !!storedUserRole && (approvalStatusLower === roleCheckStr || approvalStatusLower.includes(roleCheckStr));
  
  const rawAdminStatusLower = (row.rawAdminStatus || '').toLowerCase();
  const isNotVerified = rawAdminStatusLower !== 'verified' && rawAdminStatusLower !== 'pending_verification' && adminStatusLower !== 'verified' && adminStatusLower !== 'pending verification';
  
  const rawApprovalStatusLower = (row.rawApprovalStatus || '').toLowerCase();
  const isNotCompletedOrRejected = rawApprovalStatusLower !== 'approval_complete' && rawApprovalStatusLower !== 'completed' && !approvalStatusLower.includes('completed') && !approvalStatusLower.includes('rejected');

  const statusLower = (row.rawInvoiceStatus || '').toLowerCase();
  const rawAdminStatusUpper = (row.rawAdminStatus || '').trim().toUpperCase();
  const showPendingBlueDot = rawAdminStatusUpper === 'PENDING_VERIFICATION' || rawAdminStatusUpper === 'PENDING VERIFICATION';
  const showDraftGrayDot = statusLower === 'draft';
  const showActionRequiredRedDot = statusLower === 'rejected' && isAnchorMaker;

  const partyTitle = isDealerMaker || isDealerChecker
    ? row.counterParty || row.dealerName
    : row.dealerName;

  return (
    <View style={[styles.cardWrapper, {opacity: transparency}]}>
      <View style={styles.listCard}>
        {hasAnyActionPermission && (
          <View
            ref={(r: View | null) => registerMenuRef(row.id, r)}
            collapsable={false}
            style={styles.threeDotsButton}>
            <TouchableOpacity
              onPress={() => onMenuToggle(row.id)}
              disabled={permissionsLoading}
              activeOpacity={0.7}
              hitSlop={10}
              style={styles.threeDotsTouchable}>
              <Dots
                width={scaleWidth(20)}
                height={scaleHeight(20)}
                fill={permissionsLoading ? Colors.graybase : Colors.darkblack}
                style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardHeaderArea}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>
              {(row.absoluteIndex ?? index) + 1}
            </Text>
          </View>
          <View style={styles.cardHeaderContainer}>
            {(isDealerChecker || isAnchorChecker || (isCashnTechUser && showPendingBlueDot)) ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.dmCardHeaderRow}
                onPress={() => onToggleSelection(row.id)}>
                <View
                  style={[
                    styles.checkboxBox,
                    isSelected && styles.checkboxBoxSelected,
                  ]}>
                  {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <View style={styles.dmCardHeaderTextWrap}>
                  <View style={styles.dotsContainer}>
                    {showPendingBlueDot && <View style={styles.pendingDotInline} />}
                    {showDraftGrayDot && <View style={[styles.pendingDotInline, {backgroundColor: '#9CA3AF'}]} />}
                    {showActionRequiredRedDot && <View style={styles.actionDotInline} />}
                  </View>
                  {!!partyTitle && (
                    <Text style={styles.cardTitle}>{partyTitle}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.makerHeaderRow}>
                <View style={styles.dotsContainer}>
                  {showPendingBlueDot && <View style={styles.pendingDotStandalone} />}
                  {showDraftGrayDot && <View style={[styles.pendingDotStandalone, {backgroundColor: '#9CA3AF'}]} />}
                  {showActionRequiredRedDot && <View style={styles.actionDotStandalone} />}
                </View>
                {!!partyTitle && (
                  <Text style={[styles.cardTitle, styles.cardTitleSpacing]}>
                    {partyTitle}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoGrid}>
          {isAnchorChecker ? (
            <>
              {/* Anchor-Checker Order: Invoice No → Bank Name → Product Name → Program Name → Counter Party → Invoice Date → Due Date → Upload Date → Invoice Amount → Invoice Status → Approval Status → Admin Status */}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice No</Text>
                {onInvoiceNoPress ? (
                  <TouchableOpacity
                    onPress={() => onInvoiceNoPress(row.id, row.invoiceNo || row.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.infoValue, styles.invoiceNoLink]}>{row.invoiceNo}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>{row.invoiceNo}</Text>
                )}
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>{row.bankName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Product Name</Text>
                <Text style={styles.infoValue}>{row.productName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Program Name</Text>
                <Text style={styles.infoValue}>{row.programName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Counter Party</Text>
                <Text style={styles.infoValue}>{row.counterParty}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{row.invoiceDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{row.dueDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Upload Date</Text>
                <Text style={styles.infoValue}>{row.requestDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getInvoiceStatusStyles(row.invoiceStatus).bg }]}>
                <Text style={styles.infoLabel}>Invoice Status</Text>
                <Text style={[styles.infoValue, { color: getInvoiceStatusStyles(row.invoiceStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.invoiceStatus}
                </Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getApprovalStatusStyles(row.approvalStatus).bg }]}>
                <Text style={styles.infoLabel}>Approval Status</Text>
                <Text style={[styles.infoValue, { color: getApprovalStatusStyles(row.approvalStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.approvalStatus}
                </Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getAdminStatusStyles(row.adminStatus).bg }]}>
                <Text style={styles.infoLabel}>Admin Status</Text>
                <Text style={[styles.infoValue, { color: getAdminStatusStyles(row.adminStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.adminStatus}
                </Text>
              </View>
            </>
          ) : isDealerMaker ? (
            <>
              {/* Dealer Maker Order: Invoice No → Bank Name → Product Name → Program Name → Primary Party → Invoice Date → Due Date → Upload Date → Invoice Amount (₹) → Invoice Status → Approval Status → Admin Status */}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice No</Text>
                {onInvoiceNoPress ? (
                  <TouchableOpacity
                    onPress={() => onInvoiceNoPress(row.id, row.invoiceNo || row.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.infoValue, styles.invoiceNoLink]}>{row.invoiceNo}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>{row.invoiceNo}</Text>
                )}
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>{row.bankName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Product Name</Text>
                <Text style={styles.infoValue}>{row.productName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Program Name</Text>
                <Text style={styles.infoValue}>{row.programName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Primary Party</Text>
                <Text style={styles.infoValue}>{row.primaryParty || '-'}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{row.invoiceDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{row.dueDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Upload Date</Text>
                <Text style={styles.infoValue}>{row.requestDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
                <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getInvoiceStatusStyles(row.invoiceStatus).bg }]}>
                <Text style={styles.infoLabel}>Invoice Status</Text>
                <Text style={[styles.infoValue, { color: getInvoiceStatusStyles(row.invoiceStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.invoiceStatus}
                </Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getApprovalStatusStyles(row.approvalStatus).bg }]}>
                <Text style={styles.infoLabel}>Approval Status</Text>
                <Text style={[styles.infoValue, { color: getApprovalStatusStyles(row.approvalStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.approvalStatus}
                </Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getAdminStatusStyles(row.adminStatus).bg }]}>
                <Text style={styles.infoLabel}>Admin Status</Text>
                <Text style={[styles.infoValue, { color: getAdminStatusStyles(row.adminStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.adminStatus}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Default Order: Invoice No → Loan Ref No → Bank Name → Product Name → Program Name → Counter Party → Invoice Amount → Invoice Date → Upload Date → Due Date → Invoice Status → Approval Status → Admin Status */}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice No</Text>
                {onInvoiceNoPress ? (
                  <TouchableOpacity
                    onPress={() => onInvoiceNoPress(row.id, row.invoiceNo || row.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.infoValue, styles.invoiceNoLink]}>{row.invoiceNo}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>{row.invoiceNo}</Text>
                )}
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Loan Ref No</Text>
                <Text style={styles.infoValue}>{row.loanRefNo || '-'}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>{row.bankName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Product Name</Text>
                <Text style={styles.infoValue}>{row.productName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Program Name</Text>
                <Text style={styles.infoValue}>{row.programName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Counter Party</Text>
                <Text style={styles.infoValue}>{row.counterParty}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Amount</Text>
                <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{row.invoiceDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Upload Date</Text>
                <Text style={styles.infoValue}>{row.requestDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{row.dueDate}</Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getInvoiceStatusStyles(row.invoiceStatus).bg }]}>
                <Text style={styles.infoLabel}>Invoice Status</Text>
                <Text style={[styles.infoValue, { color: getInvoiceStatusStyles(row.invoiceStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.invoiceStatus}
                </Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getApprovalStatusStyles(row.approvalStatus).bg }]}>
                <Text style={styles.infoLabel}>Approval Status</Text>
                <Text style={[styles.infoValue, { color: getApprovalStatusStyles(row.approvalStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.approvalStatus}
                </Text>
              </View>
              <View style={[styles.infoColumn, { backgroundColor: getAdminStatusStyles(row.adminStatus).bg }]}>
                <Text style={styles.infoLabel}>Admin Status</Text>
                <Text style={[styles.infoValue, { color: getAdminStatusStyles(row.adminStatus).text, fontFamily: Fonts.GilroySemiBold }]}>
                  {row.adminStatus}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeaderArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
  },
  cardHeaderContainer: {
    flex: 1,
    paddingRight: scaleWidth(50),
  },
  makerHeaderRow: {
    justifyContent: 'center',
  },
  pendingDotInline: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
    backgroundColor: Colors.tertiaryBlue,
    marginBottom: scaleHeight(6),
  },
  pendingDotStandalone: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    borderRadius: scaleWidth(4),
    backgroundColor: Colors.tertiaryBlue,
    // marginBottom: scaleHeight(6),
  },
  actionDotInline: {
    width: scaleWidth(8),
    height: scaleHeight(8),
    borderRadius: scaleWidth(4),
    backgroundColor: '#EF4444',
  },
  actionDotStandalone: {
    width: scaleWidth(8),
    height: scaleHeight(8),
    borderRadius: scaleWidth(4),
    backgroundColor: '#EF4444',
  },
  cardTitleSpacing: {
    marginBottom: scaleHeight(4),
  },
  dmCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(4),
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    marginBottom: scaleHeight(4),
  },
  dmCardHeaderTextWrap: {
    flex: 1,
    marginLeft: scaleWidth(8),
  },
  checkboxBox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderWidth: 1,
    borderColor: Colors.graybase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: scaleFont(12),
    lineHeight: scaleFont(12),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  adminStatusGrayBrown: {
    color: '#6B5B4F',
    fontFamily: Fonts.GilroySemiBold,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  infoColumn: {
    width: '47%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    padding: scaleWidth(12),
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
  },
  invoiceNoLink: {
    color: Colors.tertiaryColor,
    textDecorationLine: 'underline',
  },
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  threeDotsTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadge: {
    backgroundColor: '#F7F8FB',
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    marginRight: scaleWidth(12),
  },
  indexText: {
    color: Colors.graybase,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
  },
});
