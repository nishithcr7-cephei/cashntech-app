import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {DateNTimePicker} from '@components/index';
import {invoiceApi} from '@services/api/invoice.api';
import Toast from 'react-native-toast-message';
import {decryptValue} from '@utils/decrypt';
import {
  PRODUCT_CODES,
  PRODUCT_DISPLAY_NAMES,
  type ProductCode,
} from '@store/product/product.types';
import {getEffectiveProductCode} from '@store/product/product.resolver';
import {
  resolveAdvanceInterestFromPreview,
  resolveDefaultDisbursalAmount,
} from '@utils/invoiceTotals';

type MarkAsDisbursedModalProps = {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string;
  invoiceNo?: string;
  invoiceAmount?: string;
  productCode?: string | null;
  onSubmit?: (data: {
    debitFrom: string;
    creditTo: string;
    disbursedAmount: string;
    status: string;
    date: string;
    utrNo: string;
    remark: string;
    transactionNo: string;
    rejectionReason?: string;
    holdCategory?: string;
    expectedReleaseDate?: string;
  }) => void | Promise<void>;
};

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;

const actionOptions = ['Disbursed', 'Hold', 'Reject'] as const;
type DisbursementAction = (typeof actionOptions)[number];

function dash(value?: string | number | null): string {
  if (value == null) return '-';
  const s = String(value).trim();
  return s ? s : '-';
}

function formatAmount(value?: string | number | null): string {
  if (value == null || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value?: string | number | null): string {
  if (value == null || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function formatDateDDMMYYYY(value?: string | null): string {
  if (!value) return '-';
  const m = moment(String(value).trim(), DATE_FORMATS, true);
  if (m.isValid()) return m.format('DD-MM-YYYY');
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return moment(d).format('DD-MM-YYYY');
  } catch {
    return String(value);
  }
}

function resolveProductCode(
  productCode?: string | null,
  previewProductName?: string | null,
): ProductCode {
  const fromProp = getEffectiveProductCode(productCode ?? null);
  if (productCode) return fromProp;
  const name = (previewProductName || '').toLowerCase();
  if (name.includes('vendor')) return PRODUCT_CODES.VENDOR_FINANCE;
  if (name.includes('dealer')) return PRODUCT_CODES.DEALER_FINANCE;
  return fromProp;
}

function DetailRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, emphasize && styles.detailValueEmphasize]}
        numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export const MarkAsDisbursedModal: React.FC<MarkAsDisbursedModalProps> = ({
  visible,
  onClose,
  invoiceId,
  invoiceNo,
  invoiceAmount,
  productCode,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const [disbursementAction, setDisbursementAction] =
    useState<DisbursementAction | ''>('');
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [date, setDate] = useState('');
  const [utrNo, setUtrNo] = useState('');
  const [transactionNo, setTransactionNo] = useState('');
  const [remark, setRemark] = useState('');

  const [debitFrom, setDebitFrom] = useState('');
  const [creditTo, setCreditTo] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDisbursementAction('');
    setActionDropdownOpen(false);
    setActionError(null);
    setDisbursedAmount('');
    setDate('');
    setUtrNo('');
    setTransactionNo('');
    setRemark('');
    setPreview(null);
    setDebitFrom('');
    setCreditTo('');
  }, [visible, invoiceId]);

  useEffect(() => {
    if (!visible || !invoiceId) return;
    let cancelled = false;
    setPreviewLoading(true);
    invoiceApi
      .getFinanceRequestPreview(invoiceId)
      .then((res: any) => {
        if (cancelled) return;
        const data = res?.data ?? res?.result ?? res ?? {};
        setPreview(data);

        const apm = data?.anchorParticipantMapping ?? {};
        const odRaw = apm.od_account_no ?? '';
        const odDisplay = decryptValue(String(odRaw)) || String(odRaw);
        setDebitFrom(odDisplay);

        const creditAcc =
          data?.credit_to_bank_account?.accountNumber ??
          data?.credit_to ??
          '';
        const creditName =
          data?.credit_to_bank_account?.nameAsPerBank ??
          data?.anchor_name ??
          '';
        const decryptedAcc = creditAcc ? decryptValue(String(creditAcc)) : '';
        const accLabel = decryptedAcc || String(creditAcc);
        const creditLabel = creditName
          ? `${accLabel} (${decryptValue(String(creditName)) || creditName})`
          : accLabel;
        setCreditTo(creditLabel);

        const defaultAmt =
          resolveDefaultDisbursalAmount(data) ||
          Number(invoiceAmount?.replace(/[,\s₹/-]/g, '') || '') ||
          0;
        const amtNum = Number(defaultAmt);
        setDisbursedAmount(
          !Number.isNaN(amtNum) && amtNum > 0
            ? String(amtNum)
            : invoiceAmount?.replace(/[,\s₹/-]/g, '') || '0',
        );
      })
      .catch((err: any) => {
        if (cancelled) return;
        Toast.show({
          type: 'error',
          text1: 'Failed to load disbursement details',
          text2:
            err?.response?.data?.message ||
            err?.message ||
            'Could not load invoice preview',
        });
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, invoiceId, invoiceAmount]);

  useEffect(() => {
    if (disbursementAction === 'Disbursed') {
      setDate(moment().format('DD-MM-YYYY'));
    } else {
      setUtrNo('');
      setTransactionNo('');
      setDate('');
    }
  }, [disbursementAction]);

  const todayStart = moment().startOf('day').toDate();
  const todayEnd = moment().endOf('day').toDate();
  const todayDisplay = moment().format('DD-MM-YYYY');

  const effectiveCode = resolveProductCode(
    productCode,
    preview?.program?.productConfig?.product?.name ??
      preview?.product?.name ??
      null,
  );
  const productDisplayName = PRODUCT_DISPLAY_NAMES[effectiveCode];
  const invoiceLabel = invoiceNo || preview?.invoice_ref_no || invoiceId || 'N/A';
  const modalSubtitle = `${invoiceLabel} · ${productDisplayName}`;

  const display = useMemo(() => {
    const p = preview ?? {};
    const vendorRaw = p.vendor_name ?? p.anchorParticipantMapping?.party?.entity_name ?? '';
    const anchorRaw = p.anchor_name ?? p.program?.party?.entity_name ?? '';
    const creditAcc =
      p.credit_to_bank_account?.accountNumber ?? p.credit_to ?? '';
    const creditName =
      p.credit_to_bank_account?.nameAsPerBank ?? anchorRaw ?? '';
    const decryptedAcc = creditAcc ? decryptValue(String(creditAcc)) : '';
    const accLabel = decryptedAcc || String(creditAcc);
    const creditDisplay = accLabel
      ? creditName
        ? `${accLabel} (${decryptValue(String(creditName)) || creditName})`
        : accLabel
      : '-';

    return {
      primaryParty: dash(decryptValue(vendorRaw) || vendorRaw),
      counterParty: dash(decryptValue(anchorRaw) || anchorRaw),
      requestDate: formatDateDDMMYYYY(
        p.preferred_disbursement_requested_at ??
          p.request_date ??
          p.invoice_date ??
          null,
      ),
      grnDate: formatDateDDMMYYYY(p.grn_date ?? null),
      dueDate: formatDateDDMMYYYY(p.due_date ?? p.invoice_due_date ?? null),
      eligibleLoanAmount: formatAmount(p.eligible_loan_amount),
      eligibility:
        p.eligibility_percent != null
          ? `${formatPercent(p.eligibility_percent)}%`
          : '-',
      creditToAccount: creditDisplay,
      requestedDisbursementDate: formatDateDDMMYYYY(
        p.preferred_disbursement_date ?? null,
      ),
      advanceInterest: formatAmount(resolveAdvanceInterestFromPreview(p)),
      status: dash(p.status ?? p.invoice_status),
    };
  }, [preview]);

  const handleClose = () => {
    setDisbursementAction('');
    setActionDropdownOpen(false);
    setActionError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!disbursementAction) {
      setActionError('Please select a disbursement action');
      return;
    }
    setActionError(null);

    const amount = (disbursedAmount || '').replace(/[,\s₹]/g, '').trim();
    if (disbursementAction === 'Disbursed') {
      if (!debitFrom) {
        Toast.show({type: 'error', text1: 'Debit account is required'});
        return;
      }
      if (!amount) {
        Toast.show({type: 'error', text1: 'Disburse amount is required'});
        return;
      }
      if (!date) {
        Toast.show({type: 'error', text1: 'Disbursement date is required'});
        return;
      }
      if (date !== todayDisplay) {
        Toast.show({
          type: 'error',
          text1: 'Disbursement date must be today',
        });
        return;
      }
      if (!utrNo.trim()) {
        Toast.show({type: 'error', text1: 'UTR No is required'});
        return;
      }
      if (!transactionNo.trim()) {
        Toast.show({type: 'error', text1: 'Transaction No is required'});
        return;
      }
    }

    if (disbursementAction === 'Reject' && !remark.trim()) {
      Toast.show({type: 'error', text1: 'Remark is required for rejection'});
      return;
    }

    if (onSubmit) {
      await onSubmit({
        debitFrom,
        creditTo,
        disbursedAmount: disbursedAmount.trim(),
        status: disbursementAction,
        date: disbursementAction === 'Disbursed' ? todayDisplay : '',
        utrNo: disbursementAction === 'Disbursed' ? utrNo.trim() : '',
        remark: remark.trim(),
        transactionNo: disbursementAction === 'Disbursed' ? transactionNo.trim() : '',
        rejectionReason: disbursementAction === 'Reject' ? remark.trim() : '',
      });
    }
    handleClose();
  };

  const isSubmitDisabled =
    !disbursementAction ||
    (disbursementAction === 'Disbursed' &&
      (!date || !utrNo.trim() || !transactionNo.trim() || !disbursedAmount));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          style={[
            styles.overlay,
            {paddingTop: insets.top, paddingBottom: insets.bottom},
          ]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>Disbursement Details</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={2}>
                    {modalSubtitle}
                  </Text>
                  <View
                    style={[
                      styles.productBadge,
                      effectiveCode === PRODUCT_CODES.VENDOR_FINANCE
                        ? styles.productBadgeVf
                        : styles.productBadgeDf,
                    ]}>
                    <Text
                      style={[
                        styles.productBadgeText,
                        effectiveCode === PRODUCT_CODES.VENDOR_FINANCE
                          ? styles.productBadgeTextVf
                          : styles.productBadgeTextDf,
                      ]}>
                      {productDisplayName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {previewLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.loadingText}>
                    Loading disbursement details...
                  </Text>
                </View>
              ) : (
                <>
                  <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled>
                    <Text style={styles.sectionTitle}>Party Details</Text>
                    <View style={styles.detailsBox}>
                      <DetailRow
                        label="Primary Party"
                        value={display.primaryParty}
                      />
                      <DetailRow
                        label="Counter Party"
                        value={display.counterParty}
                        emphasize
                      />
                    </View>

                    <Text style={styles.sectionTitle}>
                      Invoice & Eligibility
                    </Text>
                    <View style={styles.detailsBox}>
                      <DetailRow
                        label="Request Date"
                        value={display.requestDate}
                      />
                      <DetailRow label="GRN Date" value={display.grnDate} />
                      <DetailRow label="Due Date" value={display.dueDate} />
                      <DetailRow
                        label="Eligible Loan Amount"
                        value={display.eligibleLoanAmount}
                      />
                      <DetailRow
                        label="Eligibility"
                        value={display.eligibility}
                        emphasize
                      />
                    </View>

                    <Text style={styles.sectionTitle}>
                      Disbursement & Rates
                    </Text>
                    <View style={styles.detailsBox}>
                      <DetailRow
                        label="Credit to account no."
                        value={display.creditToAccount}
                      />
                      <DetailRow
                        label="Requested Disbursement Date"
                        value={display.requestedDisbursementDate}
                      />
                      <DetailRow
                        label="Advance Interest"
                        value={display.advanceInterest}
                      />
                      <DetailRow
                        label="Status"
                        value={display.status}
                        emphasize
                      />
                    </View>

                    <View style={styles.actionFieldContainer}>
                      <Text style={styles.inputLabel}>Disbursement Action</Text>
                      <TouchableOpacity
                        style={styles.actionDropdown}
                        activeOpacity={0.8}
                        onPress={() => setActionDropdownOpen(prev => !prev)}>
                        <Text
                          style={[
                            styles.actionDropdownText,
                            !disbursementAction && styles.actionPlaceholder,
                          ]}>
                          {disbursementAction || 'Select status'}
                        </Text>
                        <Text style={styles.actionDropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      {!!actionError && (
                        <Text style={styles.fieldError}>{actionError}</Text>
                      )}
                      {actionDropdownOpen && (
                        <View style={styles.actionOptions}>
                          {actionOptions.map(option => (
                            <TouchableOpacity
                              key={option}
                              style={styles.actionOption}
                              activeOpacity={0.8}
                              onPress={() => {
                                setDisbursementAction(option);
                                setActionDropdownOpen(false);
                                setActionError(null);
                              }}>
                              <Text style={styles.actionOptionText}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {disbursementAction === 'Disbursed' && (
                      <>
                        <Text style={styles.sectionTitle}>
                          Disbursement Entry
                        </Text>
                        <View style={styles.detailsBox}>
                          <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>
                              Disburse Amount *
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={disbursedAmount}
                              onChangeText={setDisbursedAmount}
                              keyboardType="numeric"
                              placeholder="0.00"
                              placeholderTextColor={Colors.graybase}
                            />
                          </View>
                          <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>
                              Disbursement Date *
                            </Text>
                            <DateNTimePicker
                              label=""
                              mode="date"
                              value={date || todayDisplay}
                              datePickerProps={{
                                minimumDate: todayStart,
                                maximumDate: todayEnd,
                                date: todayStart,
                              }}
                              onConfirm={() => {
                                setDate(todayDisplay);
                              }}
                              placeholder="DD-MM-YYYY"
                              containerStyle={styles.datePickerContainer}
                            />
                          </View>
                          <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>UTR No *</Text>
                            <TextInput
                              style={styles.input}
                              value={utrNo}
                              onChangeText={setUtrNo}
                              placeholder="Bank Ref No"
                              placeholderTextColor={Colors.graybase}
                            />
                          </View>
                          <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>
                              Transaction No *
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={transactionNo}
                              onChangeText={setTransactionNo}
                              placeholder="Internal Ref No"
                              placeholderTextColor={Colors.graybase}
                            />
                          </View>
                        </View>
                      </>
                    )}

                    <View style={styles.remarkContainer}>
                      <Text style={styles.inputLabel}>Remark</Text>
                      <TextInput
                        style={styles.remarkInput}
                        value={remark}
                        onChangeText={setRemark}
                        placeholder="Remark"
                        placeholderTextColor={Colors.graybase}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </ScrollView>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={handleClose}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.submitButton,
                        isSubmitDisabled && styles.submitButtonDisabled,
                      ]}
                      disabled={isSubmitDisabled}
                      onPress={handleSubmit}>
                      <Text style={styles.submitButtonText}>Submit</Text>
                      <FontAwesome6
                        name="check"
                        iconStyle="solid"
                        size={scaleWidth(14)}
                        color={Colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '94%',
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  modalHeaderText: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  modalTitle: {
    fontSize: scaleFont(16),
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
  productBadgeVf: {
    backgroundColor: '#E8F4FD',
  },
  productBadgeDf: {
    backgroundColor: '#FFF3E0',
  },
  productBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
  productBadgeTextVf: {
    color: '#1565C0',
  },
  productBadgeTextDf: {
    color: '#E65100',
  },
  closeButton: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(24),
    color: Colors.darkblack,
    fontWeight: '300',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleWidth(8),
    paddingVertical: scaleHeight(40),
  },
  loadingText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  scroll: {
    maxHeight: scaleHeight(480),
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(8),
  },
  sectionTitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
    marginTop: scaleHeight(4),
  },
  detailsBox: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    marginBottom: scaleHeight(10),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: scaleHeight(6),
    gap: scaleWidth(12),
  },
  detailLabel: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  detailValue: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    textAlign: 'right',
  },
  detailValueEmphasize: {
    fontFamily: Fonts.GilroySemiBold,
  },
  inputRow: {
    marginBottom: scaleHeight(10),
  },
  inputLabel: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(6),
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    backgroundColor: Colors.white,
    minHeight: scaleHeight(40),
  },
  datePickerContainer: {
    marginBottom: 0,
    marginTop: 0,
  },
  actionFieldContainer: {
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(8),
  },
  actionDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D0D4DD',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    backgroundColor: Colors.white,
  },
  actionDropdownText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  actionPlaceholder: {
    color: Colors.graybase,
  },
  actionDropdownIcon: {
    fontSize: scaleFont(10),
    color: Colors.graybase,
  },
  actionOptions: {
    marginTop: scaleHeight(4),
    borderWidth: 1,
    borderColor: '#D0D4DD',
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  actionOption: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
  },
  actionOptionText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  fieldError: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.red,
  },
  remarkContainer: {
    marginBottom: scaleHeight(8),
  },
  remarkInput: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    minHeight: scaleHeight(72),
    backgroundColor: '#F7F8FB',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(16),
    paddingTop: scaleHeight(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
  },
  actionButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scaleWidth(6),
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D0D4DD',
  },
  submitButton: {
    backgroundColor: Colors.green,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.graybase,
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
