import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import moment from 'moment';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {DateNTimePicker} from '@components/DateNTimePicker/DateNTimePicker';
import {AttachmentPreviewModal} from '@components/AttachmentPreviewModal/AttachmentPreviewModal';
import {PersistentScrollView} from '@components/PersistentScrollView/PersistentScrollView';
import {PRODUCT_DISPLAY_NAMES, PRODUCT_CODES} from '@store/product/product.types';
import {getEffectiveProductCode} from '@store/product/product.resolver';
import {
  truncateNoaNoticeSegments,
  type NoaPreviewModel,
} from './noticeOfAssignmentMap';
import {dismissKeyboardOrClose} from '@utils/modalRequestClose';

const NOTICE_COLLAPSE_LEN = 280;

function NoticePreviewText({
  preview,
  expanded,
}: {
  preview: NoaPreviewModel;
  expanded: boolean;
}) {
  const segments =
    !expanded && preview.noticeBody.length > NOTICE_COLLAPSE_LEN
      ? truncateNoaNoticeSegments(preview.noticeSegments, NOTICE_COLLAPSE_LEN)
      : preview.noticeSegments;

  return (
    <Text style={styles.noticeText}>
      {segments.map((seg, idx) =>
        seg.bold ? (
          <Text key={idx} style={styles.noticeBold}>
            {seg.text}
          </Text>
        ) : (
          <Text key={idx}>{seg.text}</Text>
        ),
      )}
    </Text>
  );
}

export type NoticeOfAssignmentSubmitPayload = {
  noticeDate: string;
  remark?: string;
  consentText: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  submitting?: boolean;
  /** When true (or preview.servedConsent set), hide serve controls. */
  readOnly?: boolean;
  preview?: NoaPreviewModel | null;
  productCode?: string | null;
  onSubmit: (payload: NoticeOfAssignmentSubmitPayload) => void;
};

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
const WINDOW_HEIGHT = Dimensions.get('window').height;
const MODAL_SCROLL_MAX_HEIGHT = Math.max(
  scaleHeight(480),
  Math.round(WINDOW_HEIGHT * 0.68),
);

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.tableRow, isLast && styles.tableRowLast]}>
      <View style={styles.tableLabelWrap}>
        <Text style={styles.tableLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <Text style={styles.tableValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function validateNoticeDate(
  value: string,
  invoiceDateRaw?: string,
): string | null {
  if (!value.trim()) return 'Notice Date is required';
  const m = moment(value.trim(), DATE_FORMATS, true);
  if (!m.isValid()) return 'Enter a valid Notice Date (DD-MM-YYYY)';
  const today = moment().startOf('day');
  if (m.startOf('day').isAfter(today)) {
    return 'Notice Date cannot be in the future';
  }
  if (invoiceDateRaw) {
    const inv = moment(String(invoiceDateRaw).trim(), DATE_FORMATS, true);
    const invOk = inv.isValid()
      ? inv
      : moment(new Date(invoiceDateRaw));
    if (invOk.isValid() && m.startOf('day').isBefore(invOk.startOf('day'))) {
      return 'Notice Date cannot be before invoice date';
    }
  }
  return null;
}

export const NoticeOfAssignmentModal: React.FC<Props> = ({
  visible,
  onClose,
  loading = false,
  submitting = false,
  readOnly: readOnlyProp = false,
  preview,
  productCode,
  onSubmit,
}) => {
  const effectiveCode = getEffectiveProductCode(productCode);
  const productDisplayName =
    PRODUCT_DISPLAY_NAMES[effectiveCode] ||
    PRODUCT_DISPLAY_NAMES[PRODUCT_CODES.SALES_INVOICE_DISCOUNTING];

  const isReadOnly = readOnlyProp || !!preview?.servedConsent;

  const [noticeDateInput, setNoticeDateInput] = useState(
    moment().format('DD-MM-YYYY'),
  );
  const [noticeDateError, setNoticeDateError] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [noticeExpanded, setNoticeExpanded] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (preview?.servedConsent) {
      setNoticeDateInput(
        preview.servedConsent.noticeDateDisplay !== '-'
          ? preview.servedConsent.noticeDateDisplay
          : moment().format('DD-MM-YYYY'),
      );
      setRemark(
        preview.servedConsent.remark !== '-'
          ? preview.servedConsent.remark
          : '',
      );
      setConsentAccepted(true);
    } else {
      setNoticeDateInput(moment().format('DD-MM-YYYY'));
      setRemark('');
      setConsentAccepted(false);
    }
    setNoticeDateError(null);
    setPreviewUrl(null);
    setNoticeExpanded(false);
  }, [visible, preview?.invoiceRef, preview?.servedConsent]);

  const minSelectableDate = useMemo(() => {
    if (!preview?.invoiceDateRaw) {
      return undefined;
    }
    const inv = moment(preview.invoiceDateRaw.trim(), DATE_FORMATS, true);
    if (inv.isValid()) return inv.startOf('day').toDate();
    const d = new Date(preview.invoiceDateRaw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [preview?.invoiceDateRaw]);

  const maxSelectableDate = moment().endOf('day').toDate();

  const canSubmit =
    !isReadOnly &&
    !!preview &&
    consentAccepted &&
    !noticeDateError &&
    !!noticeDateInput.trim() &&
    !loading &&
    !submitting;

  const handleSubmit = () => {
    if (isReadOnly || !preview || submitting || loading) return;
    const err = validateNoticeDate(noticeDateInput, preview.invoiceDateRaw);
    setNoticeDateError(err);
    if (err || !consentAccepted) return;
    onSubmit({
      noticeDate: noticeDateInput.trim(),
      remark: remark.trim() || undefined,
      consentText: preview.consentText,
    });
  };

  const noticePreviewText = preview?.noticeBody || '';
  const noticeNeedsToggle = noticePreviewText.length > NOTICE_COLLAPSE_LEN;

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => dismissKeyboardOrClose(onClose)}>
        <TouchableWithoutFeedback
          onPress={() => dismissKeyboardOrClose(onClose)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>
                      Notice of Assignment
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {preview?.invoiceRef || '—'} · {productDisplayName}
                    </Text>
                    <View style={[styles.productBadge, styles.productBadgeSid]}>
                      <Text style={[styles.productBadgeText, styles.productBadgeTextSid]}>
                        {productDisplayName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={submitting}
                    style={styles.closeButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                {loading || !preview ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator
                      size="large"
                      color={Colors.primaryColor}
                    />
                    <Text style={styles.loadingText}>Loading notice…</Text>
                  </View>
                ) : (
                  <>
                    <PersistentScrollView
                      style={styles.scroll}
                      contentContainerStyle={styles.scrollContent}
                      keyboardShouldPersistTaps="handled"
                      bounces>
                      <Text style={styles.sectionTitle}>Party Details</Text>
                      <View style={styles.detailsTable}>
                        <DetailRow
                          label="Assignor (Anchor)"
                          value={preview.assignorName}
                        />
                        <DetailRow
                          label="Assignee (Bank)"
                          value={preview.assigneeBankName}
                        />
                        <DetailRow label="Program" value={preview.programName} />
                        <DetailRow label="Debtor" value={preview.debtorName} />
                        <DetailRow
                          label="Debtor Code"
                          value={preview.debtorCode}
                          isLast
                        />
                      </View>

                      <Text style={styles.sectionTitle}>Assigned Invoice</Text>
                      <View style={styles.detailsTable}>
                        <DetailRow
                          label="Invoice / unique ref. no."
                          value={preview.invoiceRef}
                        />
                        <DetailRow
                          label="Invoice date"
                          value={preview.invoiceDateDisplay}
                        />
                        <DetailRow label="PO ref. no." value={preview.poRef} />
                        <DetailRow
                          label="Invoice due date"
                          value={preview.dueDateDisplay}
                        />
                        <DetailRow label="Tenor" value={preview.tenorLabel} />
                        <DetailRow
                          label="Assigned amount"
                          value={preview.assignedAmountDisplay}
                          isLast
                        />
                      </View>

                      <Text style={styles.sectionTitle}>
                        Payment Instruction
                      </Text>
                      <View style={styles.detailsTable}>
                        <DetailRow
                          label="Escrow account no."
                          value={preview.escrowAccount}
                        />
                        <DetailRow label="Bank" value={preview.paymentBank} />
                        <DetailRow
                          label="Amount payable"
                          value={preview.assignedAmountDisplay}
                        />
                        <DetailRow
                          label="Payable on or before"
                          value={preview.dueDateDisplay}
                          isLast
                        />
                      </View>

                      <Text style={styles.sectionTitle}>Notice Preview</Text>
                      <View style={styles.noticeBox}>
                        <NoticePreviewText
                          preview={preview}
                          expanded={noticeExpanded}
                        />
                        {noticeNeedsToggle && (
                          <TouchableOpacity
                            onPress={() => setNoticeExpanded(v => !v)}
                            hitSlop={8}>
                            <Text style={styles.readMore}>
                              {noticeExpanded ? 'Show less' : 'Read more'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={styles.sectionTitle}>Annexure</Text>
                      {preview.attachments.length === 0 ? (
                        <Text style={styles.emptyHint}>No attachments</Text>
                      ) : (
                        preview.attachments.map(att => (
                          <TouchableOpacity
                            key={att.id}
                            style={styles.attachmentRow}
                            onPress={() => setPreviewUrl(att.url)}
                            activeOpacity={0.7}
                            disabled={!att.url}>
                            <FontAwesome6
                              name="file"
                              iconStyle="regular"
                              size={16}
                              color={Colors.graybase}
                            />
                            <Text
                              style={styles.attachmentName}
                              numberOfLines={1}>
                              {att.fileName}
                            </Text>
                            <Text style={styles.viewLink}>View</Text>
                          </TouchableOpacity>
                        ))
                      )}

                      {isReadOnly && preview.servedConsent ? (
                        <>
                          {/* Web parity: same Notice Date / Remark / consent, read-only */}
                          <View style={styles.dateFieldBlock}>
                            <Text style={styles.remarkLabel}>Notice Date</Text>
                            <View
                              style={[
                                styles.remarkInput,
                                styles.readOnlyField,
                              ]}>
                              <Text style={styles.readOnlyFieldText}>
                                {preview.servedConsent.noticeDateDisplay}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.remarkLabel}>
                            Remark (Optional)
                          </Text>
                          <View
                            style={[styles.remarkInput, styles.readOnlyField]}>
                            <Text style={styles.readOnlyFieldText}>
                              {preview.servedConsent.remark !== '-'
                                ? preview.servedConsent.remark
                                : '—'}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={styles.dateFieldBlock}>
                            <DateNTimePicker
                              label="Notice Date *"
                              value={noticeDateInput}
                              onConfirm={date => {
                                const next = moment(date).format('DD-MM-YYYY');
                                setNoticeDateInput(next);
                                setNoticeDateError(
                                  validateNoticeDate(
                                    next,
                                    preview.invoiceDateRaw,
                                  ),
                                );
                              }}
                              placeholder="DD-MM-YYYY"
                              mode="date"
                              datePickerProps={{
                                date: noticeDateInput
                                  ? moment(
                                      noticeDateInput,
                                      DATE_FORMATS,
                                      true,
                                    ).toDate()
                                  : new Date(),
                                mode: 'date',
                                minimumDate: minSelectableDate,
                                maximumDate: maxSelectableDate,
                              }}
                            />
                            {!!noticeDateError && (
                              <Text style={styles.dateError}>
                                {noticeDateError}
                              </Text>
                            )}
                          </View>

                          <Text style={styles.remarkLabel}>
                            Remark (Optional)
                          </Text>
                          <TextInput
                            style={styles.remarkInput}
                            value={remark}
                            onChangeText={setRemark}
                            placeholder="Add a remark"
                            placeholderTextColor={Colors.graybase}
                            editable={!submitting}
                            multiline
                            maxLength={500}
                            blurOnSubmit
                          />
                        </>
                      )}
                    </PersistentScrollView>

                    <TouchableOpacity
                      style={styles.checkboxDock}
                      onPress={() => {
                        if (!isReadOnly) {
                          setConsentAccepted(v => !v);
                        }
                      }}
                      activeOpacity={isReadOnly ? 1 : 0.7}
                      disabled={isReadOnly || submitting}>
                      <View
                        style={[
                          styles.checkbox,
                          (isReadOnly || consentAccepted) &&
                            styles.checkboxChecked,
                        ]}>
                        {isReadOnly || consentAccepted ? (
                          <Text style={styles.checkMark}>✓</Text>
                        ) : null}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        {isReadOnly &&
                        preview.servedConsent?.consentText &&
                        preview.servedConsent.consentText !== '-'
                          ? preview.servedConsent.consentText
                          : preview.consentText}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                      {isReadOnly ? (
                        <TouchableOpacity
                          style={styles.submitBtn}
                          onPress={onClose}
                          activeOpacity={0.85}>
                          <Text style={styles.submitBtnText}>Close</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.cancelBtn,
                              submitting && styles.btnDisabled,
                            ]}
                            onPress={onClose}
                            disabled={submitting}
                            activeOpacity={0.8}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.submitBtn,
                              !canSubmit && styles.btnDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            activeOpacity={0.85}>
                            {submitting ? (
                              <ActivityIndicator
                                size="small"
                                color={Colors.white}
                              />
                            ) : (
                              <>
                                <Text style={styles.submitBtnText}>
                                  Serve Notice
                                </Text>
                                <FontAwesome6
                                  name="check"
                                  iconStyle="solid"
                                  size={14}
                                  color={Colors.white}
                                />
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <AttachmentPreviewModal
        visible={!!previewUrl}
        urlOrPath={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '94%',
    maxHeight: '92%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  modalHeaderText: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  modalTitle: {
    fontSize: scaleFont(17),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  modalSubtitle: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  productBadge: {
    alignSelf: 'flex-start',
    marginTop: scaleHeight(8),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(4),
  },
  productBadgeSid: {
    backgroundColor: '#E8F5E9',
  },
  productBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
  productBadgeTextSid: {
    color: '#2E7D32',
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
    maxHeight: MODAL_SCROLL_MAX_HEIGHT,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(8),
    paddingBottom: scaleHeight(12),
  },
  sectionTitle: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(8),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  detailsTable: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(4),
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: scaleHeight(7),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    gap: scaleWidth(8),
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scaleWidth(6),
    marginRight: scaleWidth(4),
  },
  tableLabel: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flexShrink: 1,
  },
  tableValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flexShrink: 0,
    textAlign: 'right',
    maxWidth: '52%',
  },
  noticeBox: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(4),
  },
  noticeText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    lineHeight: scaleFont(20),
  },
  noticeBold: {
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  readMore: {
    marginTop: scaleHeight(8),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  emptyHint: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(8),
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
  },
  attachmentName: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  viewLink: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  dateFieldBlock: {
    marginTop: scaleHeight(10),
  },
  dateError: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.red,
  },
  remarkLabel: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(6),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  remarkInput: {
    minHeight: scaleHeight(72),
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    textAlignVertical: 'top',
  },
  readOnlyField: {
    backgroundColor: '#F2F4F7',
    minHeight: scaleHeight(44),
    justifyContent: 'center',
  },
  readOnlyFieldText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.graybase,
  },
  checkboxDock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleWidth(10),
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(4),
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  checkbox: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: scaleWidth(4),
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(2),
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkMark: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    lineHeight: scaleFont(19),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(10),
    paddingBottom: scaleHeight(14),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  cancelBtn: {
    flex: 1,
    height: scaleHeight(44),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  submitBtn: {
    flex: 1,
    height: scaleHeight(44),
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  submitBtnText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  loadingRow: {
    minHeight: scaleHeight(180),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(36),
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
});
