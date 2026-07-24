import React, {useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
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

function TimelineStepRow({
  step,
  isLast,
}: {
  step: WorkflowStep;
  isLast: boolean;
}) {
  const isRejected = step.status === 'rejected';
  const isPending = step.status === 'pending';
  const roleUser =
    step.roleLabel && step.userName
      ? `${step.roleLabel} (${step.userName})`
      : step.roleLabel || step.userName || '-';

  return (
    <View style={styles.stepRow}>
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
      <View style={[styles.stepContent, isLast && styles.stepContentLast]}>
        <Text style={styles.stepAction} numberOfLines={2}>
          {step.action || '-'}
        </Text>
        <Text style={styles.stepRoleUser} numberOfLines={2}>
          {roleUser}
        </Text>
        <Text style={styles.stepTimestamp}>{step.timestamp || '-'}</Text>
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
  const activeStepsLabel = useMemo(() => {
    const n = steps.length;
    return `${n} active step${n === 1 ? '' : 's'}`;
  }, [steps.length]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Invoice Tracking</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
                bounces={false}>
                <View style={styles.summaryBlock}>
                  <Text style={styles.invoiceNoText} numberOfLines={1}>
                    {displayOrDash(invoiceNo)}
                  </Text>
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
                    <Text style={styles.workflowTitle}>Workflow progress</Text>
                    <Text style={styles.workflowSubtitle} numberOfLines={2}>
                      {displayOrDash(programName)}
                    </Text>
                  </View>
                  <View style={styles.stepsBadge}>
                    <Text style={styles.stepsBadgeText}>{activeStepsLabel}</Text>
                  </View>
                </View>

                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="large" color={Colors.primaryColor} />
                    <Text style={styles.loadingText}>Loading approval history...</Text>
                  </View>
                ) : steps.length === 0 ? (
                  <View style={styles.emptyRow}>
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
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const DOT_SIZE = scaleWidth(22);
const RAIL_WIDTH = scaleWidth(22);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    maxHeight: '88%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  closeButton: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(26),
    color: Colors.graybase,
    fontWeight: '300',
    lineHeight: scaleFont(28),
  },
  scroll: {
    maxHeight: scaleHeight(520),
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(20),
  },
  summaryBlock: {
    marginBottom: scaleHeight(16),
  },
  invoiceNoText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  amountText: {
    fontSize: scaleFont(28),
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
    marginBottom: scaleHeight(14),
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
    backgroundColor: '#F9FAFB',
  },
  stepsBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  timeline: {
    paddingLeft: scaleWidth(2),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
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
    backgroundColor: Colors.green,
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
    minHeight: scaleHeight(18),
    marginVertical: scaleHeight(2),
  },
  railLineCompleted: {
    backgroundColor: Colors.green,
  },
  railLineRejected: {
    backgroundColor: '#E67E22',
  },
  stepContent: {
    flex: 1,
    paddingLeft: scaleWidth(12),
    paddingBottom: scaleHeight(18),
  },
  stepContentLast: {
    paddingBottom: scaleHeight(4),
  },
  stepAction: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  stepRoleUser: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  stepTimestamp: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
  },
  emptyRow: {
    minHeight: scaleHeight(100),
    paddingVertical: scaleHeight(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  loadingRow: {
    paddingVertical: scaleHeight(36),
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
