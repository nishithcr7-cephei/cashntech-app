import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import type {
  DueDateImpactFigure,
  DueDateImpactPreviewResponse,
} from '@services/api/invoice.api';

type DueDateImpactModalProps = {
  visible: boolean;
  loading?: boolean;
  data: DueDateImpactPreviewResponse | null;
  onKeepCurrent: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

function formatAmount(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDueDate(value?: string | null): string {
  if (!value) return '-';
  const m = moment(String(value).trim(), ['YYYY-MM-DD', 'DD-MM-YYYY'], true);
  if (m.isValid()) return m.format('DD-MMM-YYYY');
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return moment(d).format('DD-MMM-YYYY');
}

function ImpactCompareRow({
  label,
  current,
  proposed,
  suffix,
}: {
  label: string;
  current?: string | number | null;
  proposed?: string | number | null;
  suffix?: string;
}) {
  const currentStr =
    current != null && String(current).trim() !== ''
      ? `${current}${suffix ?? ''}`
      : '-';
  const proposedStr =
    proposed != null && String(proposed).trim() !== ''
      ? `${proposed}${suffix ?? ''}`
      : '-';
  const changed = currentStr !== proposedStr;

  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareValues}>
        {changed ? (
          <>
            <Text style={styles.compareOld}>{currentStr}</Text>
            <Text style={styles.compareArrow}>→</Text>
            <Text style={styles.compareNew}>{proposedStr}</Text>
          </>
        ) : (
          <Text style={styles.compareStatic}>{proposedStr}</Text>
        )}
      </View>
    </View>
  );
}

function figureDueDate(fig?: DueDateImpactFigure | null): string {
  return formatDueDate(fig?.invoice_due_date);
}

export const DueDateImpactModal: React.FC<DueDateImpactModalProps> = ({
  visible,
  loading = false,
  data,
  onKeepCurrent,
  onConfirm,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const isHoliday = data?.is_holiday === true;
  const current = data?.current ?? null;
  const proposed = data?.proposed;
  const impacts = data?.impacts ?? [];
  const confirmDisabled = isHoliday || loading || !proposed;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.overlay,
            {paddingTop: insets.top, paddingBottom: insets.bottom},
          ]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Due Date Change Impact</Text>
                  <Text style={styles.subtitle}>
                    This is a bank-approved exception. Review the effect before
                    confirming.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.loadingText}>Calculating impact…</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  bounces={false}
                  showsVerticalScrollIndicator>
                  {isHoliday && (
                    <View style={styles.holidayBanner}>
                      <FontAwesome6
                        name="triangle-exclamation"
                        iconStyle="solid"
                        size={scaleWidth(14)}
                        color="#B45309"
                      />
                      <Text style={styles.holidayText}>
                        The selected date falls on a holiday. Please select a
                        different date.
                      </Text>
                    </View>
                  )}

                  <View style={styles.compareBox}>
                    <ImpactCompareRow
                      label="Invoice Due Date"
                      current={figureDueDate(current)}
                      proposed={figureDueDate(proposed)}
                    />
                    <ImpactCompareRow
                      label="Usance Days"
                      current={current?.usance_days}
                      proposed={proposed?.usance_days}
                      suffix=" day(s)"
                    />
                    <ImpactCompareRow
                      label="Advance Interest"
                      current={formatAmount(current?.upfront_interest)}
                      proposed={formatAmount(proposed?.upfront_interest)}
                    />
                    <ImpactCompareRow
                      label="Net Disbursement Amount"
                      current={formatAmount(current?.net_disbursement_amount)}
                      proposed={formatAmount(proposed?.net_disbursement_amount)}
                    />
                    <ImpactCompareRow
                      label="Total Outstanding on Maturity"
                      current={formatAmount(current?.total_outstanding)}
                      proposed={formatAmount(proposed?.total_outstanding)}
                    />
                  </View>

                  {impacts.length > 0 && (
                    <View style={styles.impactsSection}>
                      <Text style={styles.impactsTitle}>
                        What else this affects
                      </Text>
                      {impacts.map((item, idx) => (
                        <View key={`impact-${idx}`} style={styles.impactRow}>
                          <Text style={styles.impactBullet}>•</Text>
                          <Text style={styles.impactText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              )}

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.keepButton]}
                  onPress={onKeepCurrent}
                  disabled={loading}>
                  <Text style={styles.keepButtonText}>Keep Current Due Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.footerButton,
                    styles.confirmButton,
                    confirmDisabled && styles.confirmButtonDisabled,
                  ]}
                  disabled={confirmDisabled}
                  onPress={onConfirm}>
                  <FontAwesome6
                    name="check"
                    iconStyle="solid"
                    size={scaleWidth(13)}
                    color={confirmDisabled ? '#999' : Colors.white}
                  />
                  <Text
                    style={[
                      styles.confirmButtonText,
                      confirmDisabled && styles.confirmButtonTextDisabled,
                    ]}>
                    Confirm New Due Date
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '94%',
    maxHeight: '88%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(18),
    paddingBottom: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  headerText: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  subtitle: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    lineHeight: scaleFont(17),
  },
  closeButton: {
    padding: scaleWidth(4),
  },
  closeButtonText: {
    fontSize: scaleFont(24),
    color: Colors.graybase,
    lineHeight: scaleFont(24),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(40),
  },
  loadingText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  scroll: {
    maxHeight: scaleHeight(420),
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
  },
  holidayBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleWidth(8),
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  holidayText: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: '#92400E',
    lineHeight: scaleFont(17),
  },
  compareBox: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: scaleWidth(8),
    overflow: 'hidden',
  },
  compareRow: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
  },
  compareLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  compareValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scaleWidth(6),
  },
  compareOld: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  compareArrow: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
  },
  compareNew: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: '#15803D',
  },
  compareStatic: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  impactsSection: {
    marginTop: scaleHeight(14),
  },
  impactsTitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(6),
  },
  impactBullet: {
    width: scaleWidth(14),
    fontSize: scaleFont(13),
    color: Colors.graybase,
    lineHeight: scaleFont(18),
  },
  impactText: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    lineHeight: scaleFont(18),
  },
  footer: {
    flexDirection: 'row',
    gap: scaleWidth(10),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(6),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
  },
  keepButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  keepButtonText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  confirmButton: {
    backgroundColor: '#15803D',
  },
  confirmButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  confirmButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
