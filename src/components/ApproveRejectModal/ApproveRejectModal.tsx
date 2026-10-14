import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import moment from 'moment';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {
  PRODUCT_CODES,
  PRODUCT_DISPLAY_NAMES,
  ProductCode,
} from '@store/product/product.types';
import {
  getEffectiveProductCode,
  getPartyLabels,
  isSid as isSidProduct,
  isStandaloneProduct,
} from '@store/product/product.resolver';
import {AttachmentPreviewModal} from '@components/AttachmentPreviewModal/AttachmentPreviewModal';
import {
  AdvanceInterestFormulaModal,
  DisbursementRequestedFormulaModal,
  InvoiceAmountFormulaModal,
  NetDisbursementFormulaModal,
} from '@components/AdvanceInterestFormulaModal';
import {InvoiceAccountingSummary} from '@components/InvoiceAccountingSummary';
import {DateNTimePicker} from '@components/DateNTimePicker/DateNTimePicker';
import {calculateInvoiceDueDate} from '@utils/invoiceDueDate';
import {resolveNetDisbursementAmountFromInvoice} from '@utils/invoiceTotals';
import {InvoiceStatusBadges} from '@components/InvoiceStatusBadges';
import {PersistentScrollView} from '@components/PersistentScrollView/PersistentScrollView';
import {fileNameFromAttachmentUrl} from '@utils/invoiceAttachments';
import {unitCodeToLabel} from '@utils/unitNormalizer';
import {toYYYYMMDD} from '@services/api/invoice.api';

export type ApproveRejectInvoiceItem = {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  discountAmount: number;
  discountPercent?: number;
  taxAmount: number;
  taxLabel?: string;
  total: number;
};

export type ApproveRejectAttachment = {
  id: number;
  attachment_url: string;
  fullUrl: string;
};

export type ApproveRejectInvoiceDetails = {
  /** Legacy simple layout fields */
  subTotal?: string;
  withholdingTaxesPercent?: string;
  withholdingAmount?: string;
  finalPayableAmount?: string;
  finalDueDate?: string;
  /** Shared party / invoice fields */
  dealerName?: string;
  anchorName?: string;
  invoiceDate?: string;
  invoiceDueDate?: string;
  invoiceAmount?: string;
  creditAccountNumber?: string;
  /** Rich approval layout */
  partyCode?: string;
  odAccountNumber?: string;
  creditTo?: string;
  grnDate?: string;
  paymentDate?: string;
  poRefNo?: string;
  tenorDays?: string;
  subTotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  advanceInterest?: number;
  tdsAmount?: number;
  totalAmount?: number;
  netDisbursementAmount?: number;
  roiPercent?: number;
  items?: ApproveRejectInvoiceItem[];
  attachments?: ApproveRejectAttachment[];
  invoiceStatus?: string;
  approvalStatus?: string;
  adminStatus?: string;
};

type ApproveRejectModalProps = {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string | null;
  invoiceNo?: string | null;
  /** Use 'anchor_checker' for approval layout; 'cashntech_verification' for CashnTech Verify/Reject */
  variant?: 'default' | 'anchor_checker' | 'cashntech_verification';
  invoiceDetails?: ApproveRejectInvoiceDetails;
  /** Show loading in details table (e.g. when fetching invoice details) */
  detailsLoading?: boolean;
  /** Active product — drives Vendor vs Dealer labels. Defaults to DF. */
  productCode?: ProductCode | null;
  /**
   * VF only: allow editing GRN Date (Goods Received Date).
   * Pass true for Anchor Maker; vendors/checkers must not update GRN.
   */
  allowGrnDateEdit?: boolean;
  /** Program basic_parameters.due_date_calculated_from (e.g. GRN Date). */
  dueDateCalculatedFrom?: string;
  onApprove?: (invoiceId: string, remarks?: string, grnDate?: string) => void;
  onReject?: (invoiceId: string, remarks?: string, grnDate?: string) => void;
  /** CashnTech admin verification — On Hold */
  onHold?: (invoiceId: string, remarks?: string) => void;
  /** When false, parent closes the modal after the API finishes. */
  autoCloseOnAction?: boolean;
};

const GRN_DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;

function parseMomentDate(raw?: string | null): moment.Moment | null {
  if (!raw?.trim()) return null;
  const parsed = moment(raw.trim(), GRN_DATE_FORMATS, true);
  return parsed.isValid() ? parsed.startOf('day') : null;
}

function parseGrnDisplay(raw?: string | null): string {
  if (!raw?.trim()) return '';
  const m = moment(raw.trim(), GRN_DATE_FORMATS, true);
  return m.isValid() ? m.format('DD-MM-YYYY') : raw.trim();
}

/** Earliest selectable GRN: invoice date (GRN must be on or after invoice date). */
function getGrnMinimumDate(invoiceDateRaw?: string | null): Date {
  const invoiceDate = parseMomentDate(invoiceDateRaw);
  if (invoiceDate) {
    return invoiceDate.toDate();
  }
  return moment().startOf('day').toDate();
}

/** Latest selectable GRN: current date, capped by invoice due date when earlier. */
function getGrnMaximumDate(
  invoiceDateRaw?: string | null,
  tenorDaysRaw?: string | number | null,
  invoiceDueDateRaw?: string | null,
): Date {
  const today = moment().startOf('day');
  let max = today.clone();

  const dueDate = parseMomentDate(invoiceDueDateRaw);
  if (dueDate?.isBefore(max, 'day')) {
    max = dueDate;
  } else if (!dueDate) {
    const invoiceDate = parseMomentDate(invoiceDateRaw);
    const tenorDays = Number(tenorDaysRaw);
    if (invoiceDate && Number.isFinite(tenorDays) && tenorDays > 0) {
      const computedDue = invoiceDate.clone().add(tenorDays, 'days');
      if (computedDue.isBefore(max, 'day')) {
        max = computedDue;
      }
    }
  }

  return max.toDate();
}

/** Picker bounds: clamp min when invoice date is after the effective max (future invoice). */
function getGrnPickerBounds(
  invoiceDateRaw?: string | null,
  tenorDaysRaw?: string | number | null,
  invoiceDueDateRaw?: string | null,
): {minimumDate: Date; maximumDate: Date} {
  const minimumDate = getGrnMinimumDate(invoiceDateRaw);
  const maximumDate = getGrnMaximumDate(
    invoiceDateRaw,
    tenorDaysRaw,
    invoiceDueDateRaw,
  );
  if (minimumDate.getTime() > maximumDate.getTime()) {
    return {minimumDate: maximumDate, maximumDate};
  }
  return {minimumDate, maximumDate};
}

/** Returns error message if GRN is invalid; otherwise null. */
function getGrnDateValidationError(
  grnDisplay: string,
  invoiceDateRaw?: string | null,
  tenorDaysRaw?: string | number | null,
  invoiceDueDateRaw?: string | null,
): string | null {
  const parsed = moment(grnDisplay.trim(), GRN_DATE_FORMATS, true);
  if (!parsed.isValid()) {
    return 'Enter a valid GRN date (DD-MM-YYYY)';
  }
  const grn = parsed.startOf('day');

  const invoiceDate = parseMomentDate(invoiceDateRaw);
  if (invoiceDate && grn.isBefore(invoiceDate, 'day')) {
    return `GRN date cannot be before invoice date (${invoiceDate.format('DD-MM-YYYY')})`;
  }

  const max = moment(
    getGrnMaximumDate(invoiceDateRaw, tenorDaysRaw, invoiceDueDateRaw),
  ).startOf('day');
  if (grn.isAfter(max, 'day')) {
    const today = moment().startOf('day');
    if (max.isSame(today, 'day')) {
      return 'GRN date cannot be after current date';
    }
    return `GRN date cannot be after invoice due date (${max.format('DD-MM-YYYY')})`;
  }
  return null;
}

const dash = (val?: string | number | null) => {
  if (val === undefined || val === null) return '-';
  const s = String(val).trim();
  return s !== '' ? s : '-';
};

const fmtAmount = (n?: number | null) => {
  if (n == null || Number.isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const fmtPercent = (n?: number | null) => {
  if (n == null || Number.isNaN(Number(n))) return '';
  return Number(n).toFixed(2);
};

export const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({
  visible,
  onClose,
  invoiceId,
  invoiceNo,
  variant = 'default',
  invoiceDetails,
  detailsLoading = false,
  productCode,
  allowGrnDateEdit = false,
  dueDateCalculatedFrom,
  onApprove,
  onReject,
  onHold,
  autoCloseOnAction = true,
}) => {
  const insets = useSafeAreaInsets();
  const [remarks, setRemarks] = useState('');
  const [grnDateInput, setGrnDateInput] = useState('');
  const [grnDateError, setGrnDateError] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    'Verified' | 'Hold' | 'Reject' | null
  >(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showAdvanceInterestFormula, setShowAdvanceInterestFormula] =
    useState(false);
  const [showInvoiceAmountFormula, setShowInvoiceAmountFormula] =
    useState(false);
  const [showDisbursementRequestedFormula, setShowDisbursementRequestedFormula] =
    useState(false);
  const [showNetDisbursementFormula, setShowNetDisbursementFormula] =
    useState(false);

  const effectiveCode = getEffectiveProductCode(productCode);
  const isVendorFinance = effectiveCode === PRODUCT_CODES.VENDOR_FINANCE;
  const isSid = isSidProduct(effectiveCode);
  const partyLabel = getPartyLabels(effectiveCode).singular;
  const productDisplayName = PRODUCT_DISPLAY_NAMES[effectiveCode];

  const isCashnTechVerification = variant === 'cashntech_verification';
  const odAccountLabel = isSid
    ? 'Escrow Account No.'
    : isCashnTechVerification || isVendorFinance || isStandaloneProduct(effectiveCode)
      ? 'Loan OD Account Number'
      : 'OD Account';
  /** VF Anchor Maker: editable GRN picker before Remark. */
  const showVfGrnDatePicker =
    isVendorFinance && !isCashnTechVerification && allowGrnDateEdit;
  /** VF Anchor Maker / Anchor Checker: GRN in Invoice Details (checker sees maker-entered date). */
  const showVfGrnDateInDetails =
    isVendorFinance &&
    !isCashnTechVerification &&
    (allowGrnDateEdit || variant === 'anchor_checker');

  const invoiceLabel = invoiceNo || invoiceId || 'N/A';
  const modalTitle = isCashnTechVerification
    ? `${partyLabel} Invoice Verification`
    : `${partyLabel} Invoice Approval`;
  const modalSubtitle = `${invoiceLabel} · ${productDisplayName}`;

  const details = invoiceDetails || {};
  const vfGrnDateDisplay = dash(
    parseGrnDisplay(grnDateInput || details.grnDate),
  );
  const storedDueDateRaw = details.invoiceDueDate || details.finalDueDate;
  const grnPickerBounds = getGrnPickerBounds(
    details.invoiceDate,
    details.tenorDays,
    storedDueDateRaw,
  );

  const displayInvoiceDueDate = useMemo(() => {
    const fallback = storedDueDateRaw || '';
    const grnForCalc = showVfGrnDatePicker
      ? grnDateInput.trim()
      : parseGrnDisplay(details.grnDate);
    return (
      calculateInvoiceDueDate({
        dueDateCalculatedFrom,
        invoiceDate: details.invoiceDate,
        grnDate: grnForCalc,
        tenorDays: details.tenorDays,
        fallbackDueDate: fallback,
      }) || fallback
    );
  }, [
    storedDueDateRaw,
    showVfGrnDatePicker,
    grnDateInput,
    details.grnDate,
    details.invoiceDate,
    details.tenorDays,
    dueDateCalculatedFrom,
  ]);

  useEffect(() => {
    if (!visible) return;
    setRemarks('');
    setGrnDateError(null);
    setGrnDateInput(parseGrnDisplay(invoiceDetails?.grnDate));
    setStatusDropdownOpen(false);
    setSelectedStatus(null);
    setStatusError(null);
    setPreviewUrl(null);
  }, [visible, invoiceId, invoiceDetails?.grnDate]);

  const resolveGrnForApi = (): string | undefined => {
    if (!showVfGrnDatePicker || !grnDateInput.trim()) return undefined;
    return toYYYYMMDD(grnDateInput.trim()) || undefined;
  };

  const validateVfGrnForApprove = (): boolean => {
    if (!showVfGrnDatePicker) return true;
    if (!grnDateInput.trim()) {
      setGrnDateError('GRN date is required');
      return false;
    }
    const error = getGrnDateValidationError(
      grnDateInput.trim(),
      details.invoiceDate,
      details.tenorDays,
      storedDueDateRaw,
    );
    if (error) {
      setGrnDateError(error);
      return false;
    }
    setGrnDateError(null);
    return true;
  };

  const handleClose = () => {
    setRemarks('');
    setGrnDateInput('');
    setGrnDateError(null);
    setStatusDropdownOpen(false);
    setSelectedStatus(null);
    setStatusError(null);
    setPreviewUrl(null);
    onClose();
  };

  const handleApprove = () => {
    if (!validateVfGrnForApprove()) return;
    if (invoiceId && onApprove) {
      onApprove(invoiceId, remarks.trim() || undefined, resolveGrnForApi());
    }
    if (autoCloseOnAction) {
      handleClose();
    }
  };

  const handleReject = () => {
    let grn: string | undefined;
    if (showVfGrnDatePicker && grnDateInput.trim()) {
      const error = getGrnDateValidationError(
        grnDateInput.trim(),
        details.invoiceDate,
        details.tenorDays,
        storedDueDateRaw,
      );
      if (!error) {
        grn = resolveGrnForApi();
      }
    }
    if (invoiceId && onReject) {
      onReject(invoiceId, remarks.trim() || undefined, grn);
    }
    if (autoCloseOnAction) {
      handleClose();
    }
  };

  const handleCashnTechSubmit = () => {
    if (!selectedStatus) {
      setStatusError('Please select a status');
      return;
    }
    setStatusError(null);
    if (!invoiceId) return;
    const remark = remarks.trim() || undefined;
    if (selectedStatus === 'Verified') {
      onApprove?.(invoiceId, remark);
    } else if (selectedStatus === 'Reject') {
      onReject?.(invoiceId, remark);
    } else if (selectedStatus === 'Hold') {
      onHold?.(invoiceId, remark);
    }
    if (autoCloseOnAction) {
      handleClose();
    }
  };

  const openAttachment = (fullUrl: string) => {
    if (!fullUrl) return;
    setPreviewUrl(fullUrl);
  };

  const primaryButtonLabel = isCashnTechVerification ? 'Submit' : 'Approve';
  const secondaryButtonLabel = 'Reject';

  const items = details.items || [];
  const attachments = details.attachments || [];
  const showAdvanceInterest = isVendorFinance;

  const creditToValue =
    details.creditTo || details.creditAccountNumber || undefined;

  return (
    <>
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}>
      <View
        style={[
          styles.overlay,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContainer, styles.modalContainerRich]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {modalTitle}
                  </Text>
                  {!!modalSubtitle && (
                    <Text style={styles.modalSubtitle} numberOfLines={2}>
                      {modalSubtitle}
                    </Text>
                  )}
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
                  <InvoiceStatusBadges
                    invoiceStatus={details.invoiceStatus}
                    approvalStatus={details.approvalStatus}
                    adminStatus={details.adminStatus}
                    mode="live"
                    style={styles.statusBadges}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {detailsLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.loadingText}>Loading invoice details...</Text>
                </View>
              ) : (
                <>
                  <PersistentScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={false}
                    bounces
                    overScrollMode="always">
                    <Text style={styles.sectionTitle}>Party Details</Text>
                    <View style={styles.detailsTable}>
                      <DetailRow label="Anchor" value={dash(details.anchorName)} />
                      <DetailRow
                        label={isCashnTechVerification ? partyLabel : `${partyLabel} Name`}
                        value={dash(details.dealerName)}
                      />
                      <DetailRow
                        label={odAccountLabel}
                        value={dash(details.odAccountNumber)}
                      />
                      <DetailRow
                        label={`${partyLabel} Code`}
                        value={dash(details.partyCode)}
                      />
                      <DetailRow
                        label="Credit To"
                        value={dash(creditToValue)}
                        isLast
                      />
                    </View>

                    <Text style={styles.sectionTitle}>Invoice Details</Text>
                    <View style={styles.detailsTable}>
                      <DetailRow
                        label="Invoice Date"
                        value={dash(details.invoiceDate)}
                      />
                      {showVfGrnDateInDetails && (
                        <DetailRow label="GRN Date" value={vfGrnDateDisplay} />
                      )}
                      <DetailRow
                        label="Invoice Due Date"
                        value={dash(displayInvoiceDueDate)}
                      />
                      <DetailRow
                        label={isCashnTechVerification ? 'Po Ref No' : 'PO Ref'}
                        value={dash(details.poRefNo)}
                      />
                      <DetailRow
                        label="Payment Date"
                        value={dash(details.paymentDate)}
                      />
                      <DetailRow
                        label="Tenor"
                        value={
                          details.tenorDays
                            ? isCashnTechVerification
                              ? dash(details.tenorDays)
                              : `${dash(details.tenorDays)} days`
                            : '-'
                        }
                        isLast
                      />
                    </View>

                    <Text style={styles.sectionTitle}>Items</Text>
                    {items.length === 0 ? (
                      <Text style={styles.emptyHint}>No items found</Text>
                    ) : (
                      items.map(item => {
                        const discountValue =
                          (item.discountPercent ?? 0) > 0
                            ? `${fmtAmount(item.discountAmount)} (${fmtPercent(item.discountPercent)}%)`
                            : fmtAmount(item.discountAmount);
                        const taxValue =
                          item.taxAmount > 0
                            ? item.taxLabel
                              ? `${fmtAmount(item.taxAmount)} ${item.taxLabel}`
                              : fmtAmount(item.taxAmount)
                            : '-';
                        const itemTitle = item.description
                          ? `${item.itemName || '-'} (${item.description})`
                          : item.itemName || '-';

                        return (
                          <View key={item.id} style={styles.itemCard}>
                            <Text style={styles.itemCardTitle}>{itemTitle}</Text>
                            <DetailRow label="Qty" value={fmtAmount(item.quantity)} />
                            <DetailRow label="Unit" value={dash(unitCodeToLabel(item.unit))} />
                            <DetailRow label="Price" value={fmtAmount(item.price)} />
                            <DetailRow label="Discount" value={discountValue} />
                            <DetailRow label="Tax" value={taxValue} />
                            <DetailRow
                              label="Total"
                              value={fmtAmount(item.total)}
                              isLast
                              emphasize
                            />
                          </View>
                        );
                      })
                    )}

                    <Text style={styles.sectionTitle}>Summary</Text>
                    <InvoiceAccountingSummary
                      basicAmount={details.subTotalAmount ?? 0}
                      discount={details.discountAmount ?? 0}
                      gstAmount={details.taxAmount ?? 0}
                      tdsAmount={details.tdsAmount ?? 0}
                      advanceInterest={details.advanceInterest ?? 0}
                      netDisbursementAmount={
                        details.netDisbursementAmount ??
                        resolveNetDisbursementAmountFromInvoice({
                          net_disbursal_amount: undefined,
                          final_total: details.totalAmount,
                          upfront_interest: details.advanceInterest,
                          sub_total: details.subTotalAmount,
                          discount_total: details.discountAmount,
                          tax_total: details.taxAmount,
                          tds_amount: details.tdsAmount,
                        })
                      }
                      showAdvanceInterest={showAdvanceInterest}
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

                    <Text style={styles.sectionTitle}>
                      Attachments
                      {attachments.length > 0 ? ` · ${attachments.length}` : ''}
                    </Text>
                    {attachments.length === 0 ? (
                      <Text style={styles.emptyHint}>No attachments</Text>
                    ) : (
                      attachments.map((att, idx) => {
                        const fileName =
                          fileNameFromAttachmentUrl(
                            att.attachment_url || att.fullUrl || '',
                          ) || `Attachment ${idx + 1}`;
                        const ext =
                          fileName.split('.').pop()?.toUpperCase() || 'FILE';
                        const isPdf = ext === 'PDF';
                        return (
                          <TouchableOpacity
                            key={att.id}
                            style={styles.attachmentCard}
                            onPress={() =>
                              openAttachment(att.fullUrl || att.attachment_url)
                            }
                            activeOpacity={0.7}>
                            <View
                              style={[
                                styles.attachmentIcon,
                                isPdf && styles.attachmentIconPdf,
                              ]}>
                              <Text style={styles.attachmentIconText}>
                                {isPdf ? 'PDF' : ext.slice(0, 3)}
                              </Text>
                            </View>
                            <View style={styles.attachmentInfo}>
                              <Text
                                style={styles.attachmentName}
                                numberOfLines={1}>
                                {fileName}
                              </Text>
                              <Text style={styles.attachmentMeta}>
                                Tap to view
                              </Text>
                            </View>
                            <View style={styles.viewButton}>
                              <FontAwesome6
                                name="eye"
                                iconStyle="regular"
                                size={scaleWidth(14)}
                                color={Colors.primaryColor}
                              />
                              <Text style={styles.viewButtonText}>View</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}

                    {showVfGrnDatePicker && (
                      <View style={styles.grnDateContainer}>
                        <DateNTimePicker
                          label="GRN Date *"
                          value={grnDateInput}
                          onConfirm={date => {
                            const next = moment(date).format('DD-MM-YYYY');
                            setGrnDateInput(next);
                            setGrnDateError(
                              getGrnDateValidationError(
                                next,
                                details.invoiceDate,
                                details.tenorDays,
                                storedDueDateRaw,
                              ),
                            );
                          }}
                          placeholder="DD-MM-YYYY"
                          mode="date"
                          datePickerProps={{
                            date: grnDateInput
                              ? moment(
                                  grnDateInput,
                                  GRN_DATE_FORMATS,
                                  true,
                                ).toDate()
                              : grnPickerBounds.maximumDate,
                            mode: 'date',
                            minimumDate: grnPickerBounds.minimumDate,
                            maximumDate: grnPickerBounds.maximumDate,
                          }}
                          containerStyle={styles.grnDatePicker}
                        />
                        {!!grnDateError && (
                          <Text style={styles.grnDateError}>{grnDateError}</Text>
                        )}
                      </View>
                    )}

                    {isCashnTechVerification && (
                      <View style={styles.statusContainer}>
                        <Text style={styles.statusLabel}>Status</Text>
                        <TouchableOpacity
                          style={styles.statusDropdown}
                          activeOpacity={0.8}
                          onPress={() => setStatusDropdownOpen(prev => !prev)}>
                          <Text
                            style={[
                              styles.statusDropdownText,
                              !selectedStatus && styles.statusPlaceholderText,
                            ]}>
                            {selectedStatus ?? 'Select status'}
                          </Text>
                          <Text style={styles.statusDropdownIcon}>▼</Text>
                        </TouchableOpacity>
                        {!!statusError && (
                          <Text style={styles.grnDateError}>{statusError}</Text>
                        )}
                        {statusDropdownOpen && (
                          <View style={styles.statusOptions}>
                            {(['Verified', 'Hold', 'Reject'] as const).map(
                              option => (
                                <TouchableOpacity
                                  key={option}
                                  style={styles.statusOption}
                                  activeOpacity={0.8}
                                  onPress={() => {
                                    setSelectedStatus(option);
                                    setStatusDropdownOpen(false);
                                    setStatusError(null);
                                  }}>
                                  <Text style={styles.statusOptionText}>
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ),
                            )}
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.remarksContainer}>
                      <Text style={styles.remarksLabel}>
                        {isCashnTechVerification ? 'Remark' : 'Remark :'}
                      </Text>
                      <TextInput
                        style={styles.remarksInput}
                        placeholder={
                          isCashnTechVerification
                            ? 'Enter remark'
                            : 'Enter remarks...'
                        }
                        placeholderTextColor={Colors.graybase}
                        value={remarks}
                        onChangeText={setRemarks}
                        multiline
                        numberOfLines={3}
                        scrollEnabled={false}
                        textAlignVertical="top"
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={Keyboard.dismiss}
                      />
                    </View>
                  </PersistentScrollView>

                  <View style={styles.buttonContainerRich}>
                    {isCashnTechVerification ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={handleClose}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={handleCashnTechSubmit}>
                          <FontAwesome6
                            name="check"
                            iconStyle="solid"
                            size={scaleWidth(14)}
                            color={Colors.white}
                          />
                          <Text style={styles.approveButtonText}>
                            {primaryButtonLabel}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={handleReject}>
                          <Text style={styles.rejectButtonText}>
                            {secondaryButtonLabel}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={handleApprove}>
                          <Text style={styles.approveButtonText}>
                            {primaryButtonLabel}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </>
              )}
        </View>
      </View>
    </Modal>
    <AttachmentPreviewModal
      visible={!!previewUrl}
      urlOrPath={previewUrl}
      onClose={() => setPreviewUrl(null)}
    />
    <AdvanceInterestFormulaModal
      visible={showAdvanceInterestFormula}
      onClose={() => setShowAdvanceInterestFormula(false)}
      amounts={{
        basicAmount: details.subTotalAmount ?? 0,
        discount: details.discountAmount ?? 0,
        gstAmount: details.taxAmount ?? 0,
        tdsAmount: details.tdsAmount ?? 0,
        advanceInterest: details.advanceInterest ?? 0,
        roiPercent: details.roiPercent,
        tenorDays: details.tenorDays,
      }}
    />
    <InvoiceAmountFormulaModal
      visible={showInvoiceAmountFormula}
      onClose={() => setShowInvoiceAmountFormula(false)}
      amounts={{
        basicAmount: details.subTotalAmount ?? 0,
        discount: details.discountAmount ?? 0,
        gstAmount: details.taxAmount ?? 0,
      }}
    />
    <DisbursementRequestedFormulaModal
      visible={showDisbursementRequestedFormula}
      onClose={() => setShowDisbursementRequestedFormula(false)}
      amounts={{
        basicAmount: details.subTotalAmount ?? 0,
        discount: details.discountAmount ?? 0,
        gstAmount: details.taxAmount ?? 0,
        tdsAmount: details.tdsAmount ?? 0,
      }}
    />
    <NetDisbursementFormulaModal
      visible={showNetDisbursementFormula}
      onClose={() => setShowNetDisbursementFormula(false)}
      amounts={{
        basicAmount: details.subTotalAmount ?? 0,
        discount: details.discountAmount ?? 0,
        gstAmount: details.taxAmount ?? 0,
        tdsAmount: details.tdsAmount ?? 0,
        advanceInterest: details.advanceInterest ?? 0,
      }}
    />
    </>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  isLast?: boolean;
  emphasize?: boolean;
}> = ({label, value, isLast, emphasize}) => (
  <View style={[styles.tableRow, isLast && styles.tableRowLast]}>
    <View style={styles.tableLabelWrap}>
      <Text
        style={[styles.tableLabel, emphasize && styles.tableLabelEmphasize]}
        numberOfLines={2}>
        {label}
      </Text>
    </View>
    <Text style={[styles.tableValue, emphasize && styles.tableValueEmphasize]}>
      {value}
    </Text>
  </View>
);

const WINDOW_HEIGHT = Dimensions.get('window').height;
/** Tall scroll area — ~68% screen, same feel as original full-size approval modal. */
const MODAL_SCROLL_MAX_HEIGHT = Math.max(
  scaleHeight(480),
  Math.round(WINDOW_HEIGHT * 0.68),
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    overflow: 'hidden',
    maxHeight: '90%',
    zIndex: 1,
  },
  modalContainerRich: {
    width: '94%',
    maxHeight: '90%',
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
  statusBadges: {
    marginTop: scaleHeight(8),
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
  modalContent: {
    padding: scaleWidth(16),
  },
  scroll: {
    maxHeight: MODAL_SCROLL_MAX_HEIGHT,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(12),
  },
  sectionTitle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
    marginTop: scaleHeight(4),
  },
  confirmationText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(16),
    lineHeight: scaleHeight(20),
  },
  invoiceNoBold: {
    fontFamily: Fonts.GilroySemiBold,
    fontWeight: '600',
  },
  detailsTable: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(14),
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
  emptyHint: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginBottom: scaleHeight(14),
  },
  itemCard: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(10),
  },
  itemCardTitle: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(10),
    marginBottom: scaleHeight(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
  },
  attachmentIcon: {
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(6),
    backgroundColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(10),
  },
  attachmentIconPdf: {
    backgroundColor: '#FFEBEE',
  },
  attachmentIconText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  attachmentInfo: {
    flex: 1,
    marginRight: scaleWidth(8),
  },
  attachmentName: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  attachmentMeta: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    marginTop: scaleHeight(2),
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
  },
  viewButtonText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  statusContainer: {
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(8),
  },
  statusLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D0D4DD',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    backgroundColor: '#F7F8FB',
  },
  statusDropdownText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  statusPlaceholderText: {
    color: Colors.graybase,
  },
  statusDropdownIcon: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
  },
  statusOptions: {
    marginTop: scaleHeight(4),
    borderWidth: 1,
    borderColor: '#D0D4DD',
    borderRadius: scaleWidth(8),
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  statusOption: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
  },
  statusOptionText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
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
  grnDateContainer: {
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(4),
  },
  grnDatePicker: {
    marginBottom: 0,
  },
  grnDateError: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.red,
  },
  grnDateReadOnlyContainer: {
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(4),
  },
  grnDateReadOnlyLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(6),
  },
  grnDateReadOnlyValue: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(12),
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  remarksContainer: {
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(8),
  },
  remarksLabel: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(8),
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    minHeight: scaleHeight(48),
    backgroundColor: '#F7F8FB',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  buttonContainerRich: {
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
  },
  approveButton: {
    backgroundColor: Colors.green,
    flexDirection: 'row',
    gap: scaleWidth(6),
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D0D4DD',
  },
  rejectButton: {
    backgroundColor: '#9E9E9E',
  },
  approveButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  rejectButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
