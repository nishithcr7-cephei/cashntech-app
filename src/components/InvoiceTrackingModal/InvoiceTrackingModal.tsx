import React, {useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export type WorkflowStepStatus = 'completed' | 'rejected' | 'pending';

export type WorkflowStep = {
  id: string;
  action: string;
  roleLabel: string;
  userName: string;
  timestamp: string;
  status: WorkflowStepStatus;
  remark?: string;
  rejectionReason?: string;
};

export type InvoiceTrackingModalProps = {
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  invoiceNo?: string;
  invoiceAmount?: string;
  counterParty?: string;
  primaryParty?: string;
  raisedOn?: string;
  dueOn?: string;
  programName?: string;
  steps?: WorkflowStep[];
};

const AVATAR_COLORS = ['#2563EB', '#EA580C', '#7C3AED', '#0891B2', '#BE185D'];

function formatDisplayAmount(amount?: string): string {
  if (!amount || amount === '-') {
    return '₹0.00';
  }
  const cleaned = String(amount)
    .replace(/\/-?\s*$/, '')
    .replace(/^₹\s*/, '')
    .trim();
  return cleaned ? `₹${cleaned}` : '₹0.00';
}

function displayOrDash(value?: string): string {
  const v = (value || '').trim();
  return !v || v === '-' ? '-' : v;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function avatarColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MetaCell({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function UserAvatar({name}: {name: string}) {
  const initials = getInitials(name);
  const bg = avatarColorForName(name);
  return (
    <View style={[styles.avatar, {backgroundColor: bg}]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function RoleBadge({label}: {label: string}) {
  if (!label.trim()) return null;
  return (
    <Text style={styles.roleUnderName} numberOfLines={2}>
      {label}
    </Text>
  );
}

function RemarkBox({
  remark,
  userName,
  isRejection,
}: {
  remark: string;
  userName: string;
  isRejection?: boolean;
}) {
  const trimmed = remark.trim();
  if (!trimmed) return null;
  const firstName = userName.trim().split(/\s+/)[0] || userName;
  return (
    <View style={[styles.remarkBox, isRejection && styles.remarkBoxRejected]}>
      <View style={styles.remarkHeader}>
        <FontAwesome6
          name={isRejection ? 'circle-xmark' : 'comment'}
          iconStyle="solid"
          size={scaleWidth(13)}
          color={isRejection ? '#C2410C' : Colors.graybase}
        />
        <Text style={styles.remarkTitle}>
          {isRejection ? 'Rejection Reason' : `Remark By ${firstName}`}
        </Text>
      </View>
      <Text style={styles.remarkText}>{trimmed}</Text>
    </View>
  );
}

function TimelineStepRow({
  step,
  isLast,
}: {
  step: WorkflowStep;
  isLast: boolean;
}) {
  const isRejected = step.status === 'rejected';
  const isPending = step.status === 'pending';

  return (
    <View style={styles.stepRow}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText} numberOfLines={1}>
          {step.timestamp || '-'}
        </Text>
      </View>

      <View style={styles.railCol}>
        <View
          style={[
            styles.stepDot,
            isRejected && styles.stepDotRejected,
            isPending && styles.stepDotPending,
            !isRejected && !isPending && styles.stepDotCompleted,
          ]}>
          {!isPending && (
            <FontAwesome6
              name={isRejected ? 'xmark' : 'check'}
              iconStyle="solid"
              size={10}
              color={Colors.white}
            />
          )}
        </View>
        {!isLast && (
          <View
            style={[
              styles.railLine,
              isRejected ? styles.railLineRejected : styles.railLineCompleted,
            ]}
          />
        )}
      </View>

      <View style={[styles.stepCard, isLast && styles.stepCardLast]}>
        <View style={styles.stepCardHeader}>
          <View style={styles.stepTitleBlock}>
            <Text style={styles.stepAction} numberOfLines={2}>
              {step.action || '-'}
            </Text>
          </View>
          <View style={styles.userBlock}>
            <UserAvatar name={step.userName} />
            <Text style={styles.userName} numberOfLines={2}>
              {step.userName || '-'}
            </Text>
            <RoleBadge label={step.roleLabel} />
          </View>
        </View>

        {step.remark ? (
          <RemarkBox remark={step.remark} userName={step.userName} />
        ) : null}

        {step.rejectionReason ? (
          <RemarkBox
            remark={step.rejectionReason}
            userName={step.userName}
            isRejection
          />
        ) : null}
      </View>
    </View>
  );
}

export const InvoiceTrackingModal: React.FC<InvoiceTrackingModalProps> = ({
  visible,
  onClose,
  loading = false,
  invoiceNo,
  invoiceAmount,
  counterParty,
  primaryParty,
  raisedOn,
  dueOn,
  programName,
  steps = [],
}) => {
  const stepsCountLabel = useMemo(() => {
    const n = steps.length;
    return `${n} step${n === 1 ? '' : 's'}`;
  }, [steps.length]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalHeader}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.modalTitle}>Approval History</Text>
            {!!invoiceNo?.trim() && (
              <Text style={styles.invoiceNoSub} numberOfLines={1}>
                {invoiceNo}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <FontAwesome6
              name="xmark"
              iconStyle="solid"
              size={scaleWidth(18)}
              color={Colors.darkblack}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator>
          <View style={styles.summaryCard}>
            <Text style={styles.amountText}>
              {formatDisplayAmount(invoiceAmount)}
            </Text>
            <View style={styles.metaGrid}>
              <MetaCell
                label="Counter Party"
                value={displayOrDash(counterParty)}
              />
              <MetaCell
                label="Primary Party"
                value={displayOrDash(primaryParty)}
              />
              <MetaCell label="Raised On" value={displayOrDash(raisedOn)} />
              <MetaCell label="Due On" value={displayOrDash(dueOn)} />
            </View>
          </View>

          <View style={styles.workflowHeader}>
            <View style={styles.workflowHeaderLeft}>
              <Text style={styles.workflowTitle}>Approval Timeline</Text>
              {!!programName?.trim() && programName !== '-' && (
                <Text style={styles.workflowSubtitle} numberOfLines={2}>
                  {programName}
                </Text>
              )}
            </View>
            <View style={styles.stepsBadge}>
              <Text style={styles.stepsBadgeText}>{stepsCountLabel}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>Loading approval history...</Text>
            </View>
          ) : steps.length === 0 ? (
            <View style={styles.emptyRow}>
              <FontAwesome6
                name="clock-rotate-left"
                iconStyle="solid"
                size={scaleWidth(32)}
                color={Colors.graybase}
              />
              <Text style={styles.emptyText}>No approval history</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {steps.map((step, index) => (
                <TimelineStepRow
                  key={step.id}
                  step={step}
                  isLast={index === steps.length - 1}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const DOT_SIZE = scaleWidth(22);
const TIME_COL_WIDTH = scaleWidth(96);
const RAIL_WIDTH = scaleWidth(24);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    backgroundColor: Colors.white,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  invoiceNoSub: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  closeButton: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleWidth(18),
    backgroundColor: '#F3F4F6',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(14),
    paddingBottom: scaleHeight(28),
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(10),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(14),
    marginBottom: scaleHeight(16),
  },
  amountText: {
    fontSize: scaleFont(26),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(14),
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: scaleHeight(12),
  },
  metaCell: {
    width: '50%',
    paddingRight: scaleWidth(8),
  },
  metaLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(2),
  },
  metaValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  workflowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(12),
    gap: scaleWidth(8),
  },
  workflowHeaderLeft: {
    flex: 1,
    flexShrink: 1,
  },
  workflowTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  workflowSubtitle: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
  },
  stepsBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D5DD',
    borderRadius: scaleWidth(14),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    backgroundColor: Colors.white,
  },
  stepsBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  timeline: {
    paddingTop: scaleHeight(4),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeCol: {
    width: TIME_COL_WIDTH,
    paddingTop: scaleHeight(4),
    paddingRight: scaleWidth(2),
    flexShrink: 0,
  },
  timeText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    lineHeight: scaleFont(13),
  },
  railCol: {
    width: RAIL_WIDTH,
    alignItems: 'center',
  },
  stepDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#6B7280',
  },
  stepDotRejected: {
    backgroundColor: '#E67E22',
  },
  stepDotPending: {
    backgroundColor: '#D0D5DD',
  },
  railLine: {
    flex: 1,
    width: scaleWidth(2),
    minHeight: scaleHeight(24),
    marginVertical: scaleHeight(4),
  },
  railLineCompleted: {
    backgroundColor: '#D1D5DB',
  },
  railLineRejected: {
    backgroundColor: '#FDBA74',
  },
  stepCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(10),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    marginBottom: scaleHeight(14),
    marginLeft: scaleWidth(6),
  },
  stepCardLast: {
    marginBottom: scaleHeight(4),
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: scaleWidth(8),
  },
  stepTitleBlock: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    paddingRight: scaleWidth(8),
  },
  stepAction: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  roleUnderName: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    textAlign: 'right',
  },
  userBlock: {
    alignItems: 'flex-end',
    maxWidth: scaleWidth(118),
    flexShrink: 0,
  },
  avatar: {
    width: scaleWidth(34),
    height: scaleWidth(34),
    borderRadius: scaleWidth(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(4),
  },
  avatarText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  userName: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    textAlign: 'right',
  },
  remarkBox: {
    marginTop: scaleHeight(10),
    backgroundColor: '#F9FAFB',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
  },
  remarkBoxRejected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  remarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    marginBottom: scaleHeight(4),
  },
  remarkTitle: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.graybase,
  },
  remarkText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.darkblack,
    lineHeight: scaleFont(18),
  },
  emptyRow: {
    minHeight: scaleHeight(160),
    paddingVertical: scaleHeight(36),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleHeight(10),
  },
  emptyText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  loadingRow: {
    paddingVertical: scaleHeight(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
