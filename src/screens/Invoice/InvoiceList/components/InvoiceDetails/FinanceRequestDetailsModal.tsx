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
} from 'react-native';
import moment from 'moment';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {DateNTimePicker} from '@components/DateNTimePicker/DateNTimePicker';
import {AttachmentPreviewModal} from '@components/AttachmentPreviewModal/AttachmentPreviewModal';
import {
  AdvanceInterestFormulaModal,
  DisbursementRequestedFormulaModal,
  InvoiceAmountFormulaModal,
  NetDisbursementFormulaModal,
} from '@components/AdvanceInterestFormulaModal';
import {InvoiceAccountingSummary} from '@components/InvoiceAccountingSummary';
import {PersistentScrollView} from '@components/PersistentScrollView/PersistentScrollView';
import {
  fileNameFromAttachmentUrl,
  mapInvoiceAttachmentsWithUrls,
} from '@utils/invoiceAttachments';
import {decryptValue} from '@utils/decrypt';
import {toYYYYMMDD} from '@services/api/invoice.api';
import {
  resolveAdvanceInterestFromPreview,
  resolveInvoiceRoiPercent,
  resolveNetDisbursementAmountFromInvoice,
} from '@utils/invoiceTotals';
import {
  PRODUCT_CODES,
  PRODUCT_DISPLAY_NAMES,
  ProductCode,
} from '@store/product/product.types';
import {getEffectiveProductCode} from '@store/product/product.resolver';

export type FinanceRequestPreview = {
  vendor_name?: string | null;
  anchor_name?: string | null;
  program_name?: string | null;
  invoice_ref_no?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  invoice_due_date?: string | null;
  payment_date?: string | null;
  po_ref_no?: string | null;
  tenor_days?: number | string | null;
  tenor?: number | string | null;
  invoice_amount?: number | string | null;
  eligibility_percent?: number | string | null;
  eligible_loan_amount?: number | string | null;
  requested_loan_amount?: number | string | null;
  net_disbursement_amount?: number | string | null;
  netDisbursementAmount?: number | string | null;
  net_disbursal_amount?: number | string | null;
  credit_to_bank_account?: {
    id?: string | number | null;
    accountNumber?: string | null;
    nameAsPerBank?: string | null;
    bankName?: string | null;
  } | null;
  credit_to?: string | null;
  grn_date?: string | null;
  sub_total?: number | string | null;
  discount_total?: number | string | null;
  tax_total?: number | string | null;
  tds_amount?: number | string | null;
  final_total?: number | string | null;
  upfront_interest_amount?: number | string | null;
  upfront_interest?: number | string | null;
  interest_rate_percent?: number | string | null;
  status?: string | null;
  invoice_status?: string | null;
  invoiceItems?: Array<{
    id?: string | number;
    name?: string | null;
    description?: string | null;
    quantity?: number | string | null;
    unit?: number | string | null;
    price_per_quantity?: number | string | null;
    total?: number | string | null;
    discount_amount?: number | string | null;
    discount_type?: string | null;
    discount_value?: number | string | null;
    taxes?: Array<{
      tax_type?: string | null;
      tax_percentage?: number | string | null;
      tax_amount?: number | string | null;
    }>;
  }>;
  attachment?: unknown;
  attachments?: unknown;
  anchorParticipantMapping?: {
    od_account_no?: string | null;
    company_code_given_by_party?: string | null;
    party?: {entity_name?: string | null};
    interest_parameters?: unknown;
  } | null;
};

export type FinanceRequestSubmitPayload = {
  preferredDisbursementDate: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  submitting?: boolean;
  preview?: FinanceRequestPreview | null;
  productCode?: ProductCode | string | null;
  onSubmit: (payload: FinanceRequestSubmitPayload) => void;
};

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
const WINDOW_HEIGHT = Dimensions.get('window').height;
const MODAL_SCROLL_MAX_HEIGHT = Math.max(
  scaleHeight(480),
  Math.round(WINDOW_HEIGHT * 0.68),
);

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
  return n.toFixed(2);
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

function isDateInPast(displayDate: string): boolean {
  const m = moment(displayDate, DATE_FORMATS, true);
  if (!m.isValid()) return true;
  return m.startOf('day').isBefore(moment().startOf('day'));
}

function validateRequiredFutureOrTodayDate(
  label: string,
  value: string,
): string | null {
  if (!value.trim()) return `${label} is required`;
  const m = moment(value.trim(), DATE_FORMATS, true);
  if (!m.isValid()) return `Enter a valid ${label} (DD-MM-YYYY)`;
  if (isDateInPast(value.trim())) return `${label} cannot be in the past`;
  return null;
}

function DetailRow({
  label,
  value,
  isLast,
  emphasize,
}: {
  label: string;
  value: string;
  isLast?: boolean;
  emphasize?: boolean;
}) {
  return (
    <View style={[styles.tableRow, isLast && styles.tableRowLast]}>
      <View style={styles.tableLabelWrap}>
        <Text
          style={[styles.tableLabel, emphasize && styles.tableLabelEmphasize]}
          numberOfLines={2}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.tableValue, emphasize && styles.tableValueEmphasize]}
        numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export const FinanceRequestDetailsModal: React.FC<Props> = ({
  visible,
  onClose,
  loading = false,
  submitting = false,
  preview,
  productCode,
  onSubmit,
}) => {
  const effectiveCode = getEffectiveProductCode(productCode);
  const isVendorFinance = effectiveCode === PRODUCT_CODES.VENDOR_FINANCE;
  const partyLabel = isVendorFinance ? 'Vendor' : 'Dealer';
  const productDisplayName = PRODUCT_DISPLAY_NAMES[effectiveCode];
  const modalTitle = isVendorFinance
    ? 'Vendor Finance Request'
    : 'Dealer Finance Request';
  const [preferredDisbursementDateInput, setPreferredDisbursementDateInput] =
    useState('');
  const [preferredDateError, setPreferredDateError] = useState<string | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdvanceInterestFormula, setShowAdvanceInterestFormula] =
    useState(false);
  const [showInvoiceAmountFormula, setShowInvoiceAmountFormula] =
    useState(false);
  const [showDisbursementRequestedFormula, setShowDisbursementRequestedFormula] =
    useState(false);
  const [showNetDisbursementFormula, setShowNetDisbursementFormula] =
    useState(false);

  useEffect(() => {
    if (!visible) return;
    setPreferredDateError(null);
    setPreferredDisbursementDateInput('');
    setPreviewUrl(null);
    setShowAdvanceInterestFormula(false);
    setShowInvoiceAmountFormula(false);
    setShowDisbursementRequestedFormula(false);
    setShowNetDisbursementFormula(false);
  }, [visible, preview?.invoice_ref_no]);

  const display = useMemo(() => {
    const p = preview ?? {};
    const apm = p.anchorParticipantMapping ?? {};
    const odRaw = apm.od_account_no ?? '';
    const vendorCodeRaw = apm.company_code_given_by_party ?? '';
    const vendorRaw =
      p.vendor_name ?? apm.party?.entity_name ?? '';
    const anchorRaw = p.anchor_name ?? '';

    const items = (p.invoiceItems ?? []).map((it, idx) => {
      const taxes = Array.isArray(it.taxes) ? it.taxes : [];
      const taxAmount = taxes.reduce(
        (sum, t) => sum + (Number(t.tax_amount) || 0),
        0,
      );
      return {
        id: String(it.id ?? idx),
        name: it.name || it.description || '-',
        quantity: formatAmount(it.quantity),
        unit: dash(it.unit),
        price: formatAmount(it.price_per_quantity),
        discount: formatAmount(it.discount_amount),
        tax: formatAmount(taxAmount),
        total: formatAmount(it.total),
      };
    });

    const attachments = mapInvoiceAttachmentsWithUrls(p);
    const creditRaw =
      p.credit_to_bank_account?.accountNumber ?? p.credit_to ?? '';
    const creditDecrypted = creditRaw
      ? decryptValue(String(creditRaw)) || String(creditRaw)
      : '';

    return {
      invoiceRef: dash(p.invoice_ref_no),
      anchor: dash(decryptValue(anchorRaw) || anchorRaw),
      vendor: dash(decryptValue(vendorRaw) || vendorRaw),
      odAccount: dash(decryptValue(odRaw) || odRaw),
      vendorCode: dash(decryptValue(vendorCodeRaw) || vendorCodeRaw),
      program: dash(p.program_name),
      eligibility:
        p.eligibility_percent != null
          ? `${formatPercent(p.eligibility_percent)}%`
          : '-',
      invoiceDate: formatDateDDMMYYYY(p.invoice_date ?? null),
      invoiceDueDate: formatDateDDMMYYYY(
        p.due_date ?? p.invoice_due_date ?? null,
      ),
      paymentDate: formatDateDDMMYYYY(p.payment_date ?? null),
      grnDate: formatDateDDMMYYYY(p.grn_date ?? null),
      poRefNo: dash(p.po_ref_no),
      tenor:
        p.tenor_days != null || p.tenor != null
          ? String(p.tenor_days ?? p.tenor)
          : '-',
      eligibleLoan: formatAmount(p.eligible_loan_amount),
      requestedLoan: formatAmount(
        p.requested_loan_amount ?? p.eligible_loan_amount,
      ),
      creditAccount: dash(creditDecrypted),
      status: dash(p.status ?? p.invoice_status),
      interestRate:
        p.interest_rate_percent != null
          ? `${formatPercent(p.interest_rate_percent)}%`
          : '-',
      subTotal: formatAmount(p.sub_total),
      discountTotal: formatAmount(p.discount_total),
      taxTotal: formatAmount(p.tax_total),
      tdsAmount: formatAmount(p.tds_amount ?? 0),
      advanceInterest: formatAmount(
        resolveAdvanceInterestFromPreview(p, {isVendorFinance}),
      ),
      total: formatAmount(resolveNetDisbursementAmountFromInvoice(p)),
      formula: {
        basicAmount: Number(p.sub_total) || 0,
        discount: Number(p.discount_total) || 0,
        gstAmount: Number(p.tax_total) || 0,
        tdsAmount: Number(p.tds_amount) || 0,
        advanceInterest: resolveAdvanceInterestFromPreview(p, {
          isVendorFinance,
        }),
        netDisbursementAmount: resolveNetDisbursementAmountFromInvoice(p),
        roiPercent: resolveInvoiceRoiPercent(p),
        tenorDays: p.tenor_days ?? p.tenor,
      },
      items,
      attachments,
    };
  }, [preview, isVendorFinance]);

  const handleSubmit = () => {
    if (loading || submitting || !preview) return;

    const prefErr = validateRequiredFutureOrTodayDate(
      'Preferred Disbursement Date',
      preferredDisbursementDateInput,
    );
    setPreferredDateError(prefErr);
    if (prefErr) return;

    const preferredDisbursementDate = toYYYYMMDD(
      preferredDisbursementDateInput.trim(),
    );
    if (!preferredDisbursementDate) return;

    onSubmit({preferredDisbursementDate});
  };

  const minSelectableDate = moment().startOf('day').toDate();

  return (
    <>
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
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>{modalTitle}</Text>
                    <Text style={styles.modalSubtitle}>
                      {display.invoiceRef} · {productDisplayName}
                    </Text>
                    <View
                      style={[
                        styles.productBadge,
                        isVendorFinance
                          ? styles.productBadgeVf
                          : styles.productBadgeDf,
                      ]}>
                      <Text
                        style={[
                          styles.productBadgeText,
                          isVendorFinance
                            ? styles.productBadgeTextVf
                            : styles.productBadgeTextDf,
                        ]}>
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

                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator
                      size="large"
                      color={Colors.primaryColor}
                    />
                    <Text style={styles.loadingText}>Loading preview...</Text>
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
                        <DetailRow label="Anchor" value={display.anchor} />
                        <DetailRow
                          label={partyLabel}
                          value={display.vendor}
                        />
                        <DetailRow
                          label={
                            isVendorFinance
                              ? 'Loan OD Account Number'
                              : 'OD Account'
                          }
                          value={display.odAccount}
                        />
                        <DetailRow
                          label={`${partyLabel} Code`}
                          value={display.vendorCode}
                        />
                        <DetailRow
                          label="Program name"
                          value={display.program}
                        />
                        <DetailRow
                          label="Eligibility"
                          value={display.eligibility}
                          isLast
                        />
                      </View>

                      <Text style={styles.sectionTitle}>Invoice Details</Text>
                      <View style={styles.detailsTable}>
                        <DetailRow
                          label="Invoice Date"
                          value={display.invoiceDate}
                        />
                        <DetailRow
                          label="Invoice Due Date"
                          value={display.invoiceDueDate}
                        />
                        <DetailRow
                          label="Payment Date"
                          value={display.paymentDate}
                        />
                        <DetailRow label="GRN Date" value={display.grnDate} />
                        <DetailRow
                          label="Po Ref No"
                          value={display.poRefNo}
                        />
                        <DetailRow label="Tenor" value={display.tenor} />
                        <DetailRow
                          label="Eligible loan amount"
                          value={display.eligibleLoan}
                        />
                        <DetailRow
                          label="Requested loan amount"
                          value={display.requestedLoan}
                          isLast
                        />
                      </View>

                      <Text style={styles.sectionTitle}>
                        Disbursement Details
                      </Text>
                      <View style={styles.detailsTable}>
                        <DetailRow
                          label="Credit to account no."
                          value={display.creditAccount}
                        />
                        <DetailRow label="Status" value={display.status} />
                        <DetailRow
                          label="Interest rate (%) (including base rate)"
                          value={display.interestRate}
                          isLast
                        />
                      </View>

                      <Text style={styles.sectionTitle}>Items</Text>
                      {display.items.length === 0 ? (
                        <Text style={styles.emptyHint}>No items found</Text>
                      ) : (
                        display.items.map(item => (
                          <View key={item.id} style={styles.itemCard}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                            <DetailRow label="Qty" value={item.quantity} />
                            <DetailRow label="Unit" value={item.unit} />
                            <DetailRow label="Price" value={item.price} />
                            <DetailRow
                              label="Discount"
                              value={item.discount}
                            />
                            <DetailRow label="Tax" value={item.tax} />
                            <DetailRow
                              label="Total"
                              value={item.total}
                              isLast
                              emphasize
                            />
                          </View>
                        ))
                      )}

                      <Text style={styles.sectionTitle}>Summary</Text>
                      <InvoiceAccountingSummary
                        basicAmount={display.formula.basicAmount}
                        discount={display.formula.discount}
                        gstAmount={display.formula.gstAmount}
                        tdsAmount={display.formula.tdsAmount}
                        advanceInterest={display.formula.advanceInterest}
                        netDisbursementAmount={
                          display.formula.netDisbursementAmount
                        }
                        showAdvanceInterest={isVendorFinance}
                        onInvoiceAmountInfoPress={() =>
                          setShowInvoiceAmountFormula(true)
                        }
                        onDisbursementRequestedInfoPress={() =>
                          setShowDisbursementRequestedFormula(true)
                        }
                        onAdvanceInterestInfoPress={() =>
                          setShowAdvanceInterestFormula(true)
                        }
                        onNetDisbursementInfoPress={() =>
                          setShowNetDisbursementFormula(true)
                        }
                      />

                      <Text style={styles.sectionTitle}>Attachments</Text>
                      {display.attachments.length === 0 ? (
                        <Text style={styles.emptyHint}>No attachments</Text>
                      ) : (
                        display.attachments.map(att => {
                          const fileName =
                            fileNameFromAttachmentUrl(
                              att.attachment_url || att.fullUrl || '',
                            ) || 'Invoice';
                          return (
                            <TouchableOpacity
                              key={String(att.id)}
                              style={styles.attachmentRow}
                              onPress={() =>
                                setPreviewUrl(att.fullUrl || att.attachment_url)
                              }
                              activeOpacity={0.7}>
                              <FontAwesome6
                                name="file"
                                iconStyle="regular"
                                size={16}
                                color={Colors.graybase}
                              />
                              <Text
                                style={styles.attachmentName}
                                numberOfLines={1}>
                                {fileName}
                              </Text>
                              <Text style={styles.viewLink}>View</Text>
                            </TouchableOpacity>
                          );
                        })
                      )}

                      <View style={styles.dateFieldBlock}>
                        <DateNTimePicker
                          label="Preferred Disbursement Date *"
                          value={preferredDisbursementDateInput}
                          onConfirm={date => {
                            const next = moment(date).format('DD-MM-YYYY');
                            setPreferredDisbursementDateInput(next);
                            setPreferredDateError(
                              validateRequiredFutureOrTodayDate(
                                'Preferred Disbursement Date',
                                next,
                              ),
                            );
                          }}
                          placeholder="DD-MM-YYYY"
                          mode="date"
                          datePickerProps={{
                            date: preferredDisbursementDateInput
                              ? moment(
                                  preferredDisbursementDateInput,
                                  DATE_FORMATS,
                                  true,
                                ).toDate()
                              : new Date(),
                            mode: 'date',
                            minimumDate: minSelectableDate,
                          }}
                        />
                        {!!preferredDateError && (
                          <Text style={styles.dateError}>
                            {preferredDateError}
                          </Text>
                        )}
                      </View>
                    </PersistentScrollView>

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
                            <Text style={styles.submitBtnText}>Submit</Text>
                            <FontAwesome6
                              name="check"
                              iconStyle="solid"
                              size={14}
                              color={Colors.white}
                            />
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

      <AttachmentPreviewModal
        visible={!!previewUrl}
        urlOrPath={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
      {isVendorFinance && (
        <AdvanceInterestFormulaModal
          visible={showAdvanceInterestFormula}
          onClose={() => setShowAdvanceInterestFormula(false)}
          amounts={display.formula}
        />
      )}
      <InvoiceAmountFormulaModal
        visible={showInvoiceAmountFormula}
        onClose={() => setShowInvoiceAmountFormula(false)}
        amounts={display.formula}
      />
      <DisbursementRequestedFormulaModal
        visible={showDisbursementRequestedFormula}
        onClose={() => setShowDisbursementRequestedFormula(false)}
        amounts={display.formula}
      />
      <NetDisbursementFormulaModal
        visible={showNetDisbursementFormula}
        onClose={() => setShowNetDisbursementFormula(false)}
        amounts={display.formula}
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
  tableLabelEmphasize: {
    fontFamily: Fonts.GilroySemiBold,
  },
  tableValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flexShrink: 0,
    textAlign: 'right',
  },
  tableValueEmphasize: {
    fontSize: scaleFont(14),
  },
  itemCard: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(10),
  },
  itemTitle: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
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
