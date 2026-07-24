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

export type FinanceRequestPreview = {
  vendor_name?: string | null;
  anchor_name?: string | null;
  program_name?: string | null;
  invoice_ref_no?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  tenor_days?: number | string | null;
  invoice_amount?: number | string | null;
  eligibility_percent?: number | string | null;
  eligible_loan_amount?: number | string | null;
  requested_loan_amount?: number | string | null;
  credit_to_bank_account?: {
    id?: string | number | null;
    accountNumber?: string | null;
    nameAsPerBank?: string | null;
    bankName?: string | null;
    branch?: string | null;
    ifscCode?: string | null;
    accountType?: string | null;
  } | null;
  request_date?: string | null;
  requested_disbursement_date?: string | null;
  disbursement_date?: string | null;
  loan_date?: string | null;
  interest_rate_percent?: number | string | null;
  anchor_bearing_percent?: number | string | null;
  vendor_bearing_percent?: number | string | null;
  interest_charge_type?: string | null;
  upfront_interest_amount?: number | string | null;
  net_disbursal_amount?: number | string | null;
  status?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  submitting?: boolean;
  preview?: FinanceRequestPreview | null;
  onSubmit: () => void;
};

function dash(value?: string | number | null): string {
  if (value == null) return '-';
  const s = String(value).trim();
  return s ? s : '-';
}

function formatAmount(value?: string | number | null): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'string') {
    const cleaned = value.replace(/₹/g, '').replace(/\/-?\s*$/, '').replace(/,/g, '').trim();
    if (!cleaned) return '-';
    const n = Number(cleaned);
    if (Number.isNaN(n)) return value.trim();
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (Number.isNaN(Number(value))) return '-';
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value?: string | number | null): string {
  if (value == null || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(2);
}

function formatDateDDMMYYYY(value?: string | null): string {
  if (!value) return '-';
  const raw = String(value).trim();
  if (!raw) return '-';
  // Already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw.replace(/\//g, '-');
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return raw;
  }
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentProps<typeof FontAwesome6>['name'];
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon ? (
          <View style={styles.iconCircle}>
            <FontAwesome6
              name={icon}
              iconStyle="solid"
              size={11}
              color={Colors.graybase}
            />
          </View>
        ) : null}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({title}: {title: string}) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export const FinanceRequestDetailsModal: React.FC<Props> = ({
  visible,
  onClose,
  loading = false,
  submitting = false,
  preview,
  onSubmit,
}) => {
  const display = useMemo(() => {
    const p = preview ?? {};
    const interestRate = formatPercent(p.interest_rate_percent);
    const anchorBearing = formatPercent(p.anchor_bearing_percent);
    const vendorBearing = formatPercent(p.vendor_bearing_percent);
    const interestLine =
      interestRate === '-' && anchorBearing === '-' && vendorBearing === '-'
        ? '-'
        : `${interestRate === '-' ? '0.00' : interestRate}% (Anchor Bearing: ${
            anchorBearing === '-' ? '0.00' : anchorBearing
          }% + Vendor Bearing: ${vendorBearing === '-' ? '0.00' : vendorBearing}%)`;

    const requestedDisbursementDate =
      p.requested_disbursement_date ||
      p.disbursement_date ||
      p.invoice_date ||
      null;

    return {
      invoiceRef: dash(p.invoice_ref_no),
      netDisbursal: formatAmount(p.net_disbursal_amount),
      anchor: dash(p.anchor_name),
      vendor: dash(p.vendor_name),
      program: dash(p.program_name),
      eligible: formatAmount(p.eligible_loan_amount),
      eligibility: formatPercent(p.eligibility_percent),
      requested: formatAmount(p.requested_loan_amount),
      creditAccount: dash(p.credit_to_bank_account?.accountNumber),
      requestDate: formatDateDDMMYYYY(p.request_date ?? null),
      requestedDisbursementDate: formatDateDDMMYYYY(requestedDisbursementDate),
      loanDate: formatDateDDMMYYYY(p.loan_date ?? null),
      status: dash(p.status),
      interestLine,
    };
  }, [preview]);

  const handleSubmit = () => {
    if (loading || submitting || !preview) return;
    onSubmit();
  };

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
                <Text style={styles.modalTitle}>Finance Request Details</Text>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={submitting}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="large" color={Colors.primaryColor} />
                  <Text style={styles.loadingText}>Loading preview...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.highlightBar}>
                    <View style={styles.highlightCol}>
                      <Text style={styles.highlightLabel}>Invoice number</Text>
                      <Text style={styles.highlightInvoice} numberOfLines={2}>
                        {display.invoiceRef}
                      </Text>
                    </View>
                    <View style={[styles.highlightCol, styles.highlightColRight]}>
                      <Text style={styles.highlightLabel}>Net disbursal amount</Text>
                      <Text style={styles.highlightAmount} numberOfLines={1}>
                        {display.netDisbursal}
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator
                    bounces={false}>
                    <SectionTitle title="Parties" />
                    <DetailRow label="Anchor" value={display.anchor} icon="building" />
                    <DetailRow label="Vendor" value={display.vendor} icon="building" />

                    <SectionTitle title="Invoice & Eligibility" />
                    <DetailRow
                      label="Invoice / unique ref. no."
                      value={display.invoiceRef}
                      icon="file-invoice"
                    />
                    <DetailRow label="Program name" value={display.program} icon="file-invoice" />
                    <DetailRow
                      label="Eligible drawdown amount"
                      value={display.eligible}
                      icon="money-bill-1"
                    />
                    <DetailRow
                      label="Eligibility"
                      value={display.eligibility === '-' ? '-' : display.eligibility}
                      icon="percent"
                    />
                    <DetailRow
                      label="Requested drawdown amount"
                      value={display.requested}
                      icon="money-bill-1"
                    />

                    <SectionTitle title="Disbursement" />
                    <DetailRow
                      label="Credit to account no."
                      value={display.creditAccount}
                      icon="credit-card"
                    />
                    <DetailRow
                      label="Request date"
                      value={display.requestDate}
                      icon="calendar"
                    />
                    <DetailRow
                      label="Requested disbursement date"
                      value={display.requestedDisbursementDate}
                      icon="calendar"
                    />
                    <DetailRow label="Loan date" value={display.loanDate} icon="calendar" />
                    <DetailRow label="Status" value={display.status} icon="circle-info" />
                    <DetailRow
                      label="Interest rate (%) (including base rate)"
                      value={display.interestLine}
                      icon="percent"
                    />
                  </ScrollView>

                  <View style={styles.footer}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, submitting && styles.btnDisabled]}
                      onPress={onClose}
                      disabled={submitting}
                      activeOpacity={0.8}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        (submitting || !preview) && styles.btnDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={submitting || !preview}
                      activeOpacity={0.85}>
                      {submitting ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <FontAwesome6
                            name="check"
                            iconStyle="solid"
                            size={14}
                            color={Colors.white}
                          />
                          <Text style={styles.submitBtnText}>Submit</Text>
                        </>
                      )}
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
    width: '92%',
    maxHeight: '90%',
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
    fontSize: scaleFont(17),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flex: 1,
    paddingRight: scaleWidth(8),
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
  highlightBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: scaleWidth(12),
    marginHorizontal: scaleWidth(16),
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(4),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    backgroundColor: '#F3F6FB',
    borderRadius: scaleWidth(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E7F0',
  },
  highlightCol: {
    flex: 1,
  },
  highlightColRight: {
    alignItems: 'flex-end',
  },
  highlightLabel: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  highlightInvoice: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  highlightAmount: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    textAlign: 'right',
  },
  scroll: {
    maxHeight: scaleHeight(420),
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(8),
    paddingBottom: scaleHeight(12),
  },
  sectionTitle: {
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(6),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
    gap: scaleWidth(10),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1.1,
    gap: scaleWidth(8),
  },
  iconCircle: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: scaleWidth(11),
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(1),
  },
  rowLabel: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    paddingTop: scaleHeight(2),
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
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
