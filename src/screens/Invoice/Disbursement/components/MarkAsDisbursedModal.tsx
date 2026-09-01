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
  Keyboard,
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
  computeDisbursedAmountLikeWeb,
  isVfUpfrontChargeType,
  resolveAdvanceInterestFromPreview,
  resolveDisbursementUsanceDaysDisplay,
  resolveInvoiceRoiPercent,
  resolveNetInvoiceAmountFromPreview,
  resolveVfDisbursementModalAmounts,
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
    finalTotal?: number;
    upfrontInterest?: number;
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

function parseFlexibleDate(value?: string | null): moment.Moment | null {
  if (!value?.trim()) return null;
  const strict = moment(value.trim(), DATE_FORMATS, true);
  if (strict.isValid()) return strict.startOf('day');
  const loose = moment(value.trim());
  return loose.isValid() ? loose.startOf('day') : null;
}

/** Usance Days — prefer API value; else Due − Disbursement / tenor − (Disb − GRN). */
function resolveUsanceDays(params: {
  usanceDays?: number | string | null;
  preferredDisbursementDate?: string | null;
  dueDate?: string | null;
  grnDate?: string | null;
  invoiceDate?: string | null;
  tenor?: number | string | null;
}): string {
  const fromApi = Number(params.usanceDays);
  if (Number.isFinite(fromApi) && params.usanceDays != null && params.usanceDays !== '') {
    return String(Math.round(fromApi));
  }

  const disb = parseFlexibleDate(params.preferredDisbursementDate ?? null);
  if (!disb) return '-';

  const due = parseFlexibleDate(params.dueDate ?? null);
  if (due) {
    return String(due.diff(disb, 'days'));
  }

  const tenor = Number(params.tenor);
  if (!Number.isFinite(tenor)) return '-';

  const base =
    parseFlexibleDate(params.grnDate ?? null) ||
    parseFlexibleDate(params.invoiceDate ?? null);
  if (!base) return '-';

  return String(tenor - disb.diff(base, 'days'));
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
  const [amountError, setAmountError] = useState<string | null>(null);
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
    setAmountError(null);
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
    Promise.all([
      invoiceApi.getInvoiceDetails(invoiceId),
      invoiceApi.getBankAccountsForDisbursement(invoiceId).catch(() => null),
    ])
      .then(([invoiceRes, bankRes]) => {
        if (cancelled) return;
        const invoiceData = invoiceRes ?? {};
        const bankData = bankRes?.data ?? bankRes ?? {};
        const apm = invoiceData.anchorParticipantMapping ?? {};

        const data = {
          ...invoiceData,
          vendor_name: apm.party?.entity_name,
          anchor_name: invoiceData.program?.party?.entity_name,
          eligibility_percent:
            apm.eligibility ?? invoiceData.program?.eligibility ?? null,
          interest_charge_type:
            invoiceData.program?.productConfig?.interest_charge_type ?? null,
          interest_rate_percent:
            invoiceData.total_roi_percent ??
            apm.interest_parameters?.total_roi_percent ??
            null,
          transaction_interest_rate:
            bankData.interest_rate ?? bankData.interestRate ?? null,
          credit_to_bank_account:
            bankData.creditToBankAccount ??
            bankData.credit_to_bank_account ??
            invoiceData.creditToBankAccount ??
            null,
        };
        setPreview(data);

        const odRaw = apm.od_account_no ?? '';
        const odDisplay = decryptValue(String(odRaw)) || String(odRaw);
        setDebitFrom(odDisplay);

        const creditAcc =
          data.credit_to_bank_account?.accountNumber ??
          data.credit_to ??
          '';
        const creditName =
          data.credit_to_bank_account?.nameAsPerBank ??
          data.vendor_name ??
          '';
        const decryptedAcc = creditAcc ? decryptValue(String(creditAcc)) : '';
        const accLabel = decryptedAcc || String(creditAcc);
        const creditLabel = creditName
          ? `${accLabel} (${decryptValue(String(creditName)) || creditName})`
          : accLabel;
        setCreditTo(creditLabel);
      })
      .catch((err: any) => {
        if (cancelled) return;
        Toast.show({
          type: 'error',
          text1: 'Failed to load disbursement details',
          text2:
            err?.response?.data?.message ||
            err?.message ||
            'Could not load invoice details',
        });
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, invoiceId]);

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

  const isVendorFinance = effectiveCode === PRODUCT_CODES.VENDOR_FINANCE;
  const isVfUpfront =
    isVendorFinance && isVfUpfrontChargeType(preview?.interest_charge_type);

  useEffect(() => {
    if (disbursementAction !== 'Disbursed' || !preview || !date) {
      return;
    }

    const netInvoice = Number(preview.final_total) || 0;
    if (netInvoice <= 0) {
      return;
    }

    const tenor = Number(preview.tenor ?? preview.tenor_days ?? 0);
    const disb = parseFlexibleDate(date);
    const grn = parseFlexibleDate(
      preview.grn_date ? formatDateDDMMYYYY(preview.grn_date) : null,
    );
    const diffDays =
      disb && grn ? disb.diff(grn, 'days') : 0;
    const usanceDays = Math.max(0, tenor - diffDays);
    const roi = resolveInvoiceRoiPercent(preview);
    const computed = computeDisbursedAmountLikeWeb({
      netInvoice,
      eligibilityPercent:
        preview.eligibility_percent ??
        preview.anchorParticipantMapping?.eligibility ??
        100,
      roiPercent: roi,
      usanceDays,
      tdsAmount: preview.tds_amount ?? 0,
      applyUpfrontInterest: isVfUpfront,
    });

    if (computed.disbursedAmount <= 0) {
      return;
    }

    setDisbursedAmount(formatAmount(computed.disbursedAmount));
    setAmountError(null);
  }, [disbursementAction, preview, date, isVfUpfront]);

  const vfAmounts = useMemo(() => {
    if (!isVfUpfront || !preview) return null;
    return resolveVfDisbursementModalAmounts(preview);
  }, [isVfUpfront, preview]);

  const invoiceAmountCap = useMemo(() => {
    if (!preview) return 0;
    if (vfAmounts) return vfAmounts.netInvoiceAmount;
    return resolveNetInvoiceAmountFromPreview(preview, {isVendorFinance});
  }, [preview, isVendorFinance, vfAmounts]);

  const display = useMemo(() => {
    const p = preview ?? {};
    const apm = p.anchorParticipantMapping ?? {};
    const isVf = isVendorFinance;

    const vendorRaw =
      p.vendor_name ?? apm.party?.entity_name ?? '';
    const anchorRaw =
      p.anchor_name ?? p.program?.party?.entity_name ?? p.party?.entity_name ?? '';
    const odRaw = apm.od_account_no ?? debitFrom ?? '';
    const vendorCodeRaw = apm.company_code_given_by_party ?? '';

    const creditAcc =
      p.credit_to_bank_account?.accountNumber ?? p.credit_to ?? '';
    const creditName =
      p.credit_to_bank_account?.nameAsPerBank ?? vendorRaw ?? '';
    const decryptedAcc = creditAcc ? decryptValue(String(creditAcc)) : '';
    const accLabel = decryptedAcc || String(creditAcc);
    const creditDisplay = accLabel
      ? creditName
        ? `${accLabel} (${decryptValue(String(creditName)) || creditName})`
        : accLabel
      : '-';

    const preferredDisbursementDateRaw = p.preferred_disbursement_date ?? null;
    const dueDateRaw = p.invoice_due_date ?? p.due_date ?? null;
    const grnDateRaw = p.grn_date ?? null;
    const tenorRaw = p.tenor ?? p.tenor_days ?? null;
    const eligibilityRaw =
      p.eligibility_percent ?? apm.eligibility ?? p.program?.eligibility ?? null;

    const advanceInterestValue = vfAmounts
      ? vfAmounts.advanceInterest
      : resolveAdvanceInterestFromPreview(p, {isVendorFinance: isVf});
    const advanceInterestDisplay =
      Number.isFinite(advanceInterestValue) && advanceInterestValue > 0
        ? formatAmount(advanceInterestValue)
        : '-';
    const netInvoiceValue = vfAmounts
      ? vfAmounts.netInvoiceAmount
      : resolveNetInvoiceAmountFromPreview(p, {isVendorFinance: isVf});

    return {
      isVf,
      anchor: dash(decryptValue(anchorRaw) || anchorRaw),
      vendor: dash(decryptValue(vendorRaw) || vendorRaw),
      dealerLabel: isVf ? 'Vendor' : 'Dealer',
      loanOdAccount: dash(decryptValue(String(odRaw)) || odRaw),
      vendorCode: dash(decryptValue(String(vendorCodeRaw)) || vendorCodeRaw),
      creditToAccount: creditDisplay,
      requestDate: formatDateDDMMYYYY(
        p.preferred_disbursement_requested_at ??
          p.grn_date ??
          p.invoice_date ??
          null,
      ),
      dueDate: formatDateDDMMYYYY(dueDateRaw),
      grnDate: formatDateDDMMYYYY(grnDateRaw),
      tenor:
        tenorRaw != null && String(tenorRaw).trim() !== ''
          ? String(Math.round(Number(tenorRaw)) || tenorRaw)
          : '-',
      eligibility:
        eligibilityRaw != null
          ? `${formatPercent(eligibilityRaw)}%`
          : '-',
      advanceInterest: advanceInterestDisplay,
      usanceDays: isVfUpfront
        ? resolveDisbursementUsanceDaysDisplay(
            p.usance_days ?? p.usanceDays ?? null,
            tenorRaw,
          )
        : resolveUsanceDays({
            usanceDays: p.usance_days ?? p.usanceDays ?? null,
            preferredDisbursementDate: preferredDisbursementDateRaw
              ? formatDateDDMMYYYY(preferredDisbursementDateRaw)
              : null,
            dueDate: dueDateRaw ? formatDateDDMMYYYY(dueDateRaw) : null,
            grnDate: grnDateRaw ? formatDateDDMMYYYY(grnDateRaw) : null,
            invoiceDate: p.invoice_date
              ? formatDateDDMMYYYY(p.invoice_date)
              : null,
            tenor: tenorRaw,
          }),
      netInvoiceAmount: formatAmount(
        netInvoiceValue > 0
          ? netInvoiceValue
          : p.final_total ?? p.invoice_amount,
      ),
      requestedDisbursementDate: formatDateDDMMYYYY(
        preferredDisbursementDateRaw,
      ),
      status: dash(p.invoice_status ?? p.status),
    };
  }, [preview, isVendorFinance, isVfUpfront, debitFrom]);

  const handleClose = () => {
    setDisbursementAction('');
    setActionDropdownOpen(false);
    setActionError(null);
    setAmountError(null);
    onClose();
  };

  const validateDisbursedAmount = (rawAmount: string): string | null => {
    const amountNum = Number(rawAmount.replace(/[,\s₹]/g, '').trim());
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return null;
    }
    if (invoiceAmountCap > 0 && amountNum > invoiceAmountCap) {
      return 'Disbursed amount cannot exceed invoice amount';
    }
    return null;
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
      const exceedErr = validateDisbursedAmount(amount);
      if (exceedErr) {
        setAmountError(exceedErr);
        return;
      }
      setAmountError(null);
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

    const submitAmounts = vfAmounts ?? {
      advanceInterest: resolveAdvanceInterestFromPreview(preview, {
        isVendorFinance,
      }),
      netInvoiceAmount: resolveNetInvoiceAmountFromPreview(preview, {
        isVendorFinance,
      }),
    };

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
        finalTotal:
          submitAmounts.netInvoiceAmount > 0
            ? submitAmounts.netInvoiceAmount
            : undefined,
        upfrontInterest: submitAmounts.advanceInterest,
      });
    }
    handleClose();
  };

  const isSubmitDisabled =
    !disbursementAction ||
    !!amountError ||
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
                      <DetailRow label="Anchor" value={display.anchor} />
                      <DetailRow
                        label={display.dealerLabel}
                        value={display.vendor}
                      />
                      <DetailRow
                        label="Loan OD Account Number"
                        value={display.loanOdAccount}
                      />
                      <DetailRow
                        label={`${display.dealerLabel} Code`}
                        value={display.vendorCode}
                      />
                      <DetailRow
                        label="Credit to account no."
                        value={display.creditToAccount}
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
                      <DetailRow label="Due Date" value={display.dueDate} />
                      <DetailRow label="GRN Date" value={display.grnDate} />
                      <DetailRow label="Tenor" value={display.tenor} />
                      <DetailRow
                        label="Eligibility"
                        value={display.eligibility}
                        emphasize
                      />
                      <DetailRow
                        label="Advance Interest"
                        value={display.advanceInterest}
                      />
                      <DetailRow
                        label="Usance Days"
                        value={display.usanceDays}
                      />
                      <DetailRow
                        label="Net Invoice Amount"
                        value={display.netInvoiceAmount}
                        emphasize
                      />
                    </View>

                    <Text style={styles.sectionTitle}>
                      Disbursement & Rates
                    </Text>
                    <View style={styles.detailsBox}>
                      <DetailRow
                        label="Requested Disbursement Date"
                        value={display.requestedDisbursementDate}
                      />
                      <DetailRow
                        label="Status"
                        value={display.status}
                        emphasize
                      />
                    </View>

                    <Text style={styles.sectionTitle}>Disbursement Action</Text>
                    <View style={styles.actionFieldContainer}>
                      <Text style={styles.inputLabel}>Select status</Text>
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
                              style={[
                                styles.input,
                                isVendorFinance && styles.inputLocked,
                              ]}
                              value={disbursedAmount}
                              onChangeText={text => {
                                if (isVendorFinance) return;
                                setDisbursedAmount(text);
                                setAmountError(validateDisbursedAmount(text));
                              }}
                              editable={!isVendorFinance}
                              keyboardType="numeric"
                              placeholder="0.00"
                              placeholderTextColor={Colors.graybase}
                            />
                            {!!amountError && (
                              <Text style={styles.fieldError}>{amountError}</Text>
                            )}
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
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={Keyboard.dismiss}
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
  inputLocked: {
    backgroundColor: '#F4F5F7',
    color: Colors.darkblack,
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
