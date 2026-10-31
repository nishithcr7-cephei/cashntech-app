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
import {
  invoiceApi,
  type DisbursementFinancingPreview,
  type DueDateImpactFigure,
  type DueDateImpactPreviewResponse,
} from '@services/api/invoice.api';
import {DueDateImpactModal} from './DueDateImpactModal';
import Toast from 'react-native-toast-message';
import {decryptValue} from '@utils/decrypt';
import {
  PRODUCT_CODES,
  PRODUCT_DISPLAY_NAMES,
  type ProductCode,
} from '@store/product/product.types';
import {
  getEffectiveProductCode,
  getPartyLabels,
  usesVendorPartyLayout,
} from '@store/product/product.resolver';
import {
  isVfUpfrontChargeType,
  resolveAdvanceInterestFromPreview,
  resolveDisbursementUsanceDaysDisplay,
  resolveNetInvoiceAmountFromPreview,
} from '@utils/invoiceTotals';
import {computeUsanceDays} from '@utils/usanceDays';
import {dismissKeyboardOrClose} from '@utils/modalRequestClose';
import {INVOICE_SUMMARY_LABELS} from '@constants/invoiceSummaryLabels';

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
    usanceDays?: number;
    /** YYYY-MM-DD when bank due-date override is confirmed */
    invoiceDueDate?: string;
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

function toApiDateFromDisplay(ddMmYyyy: string): string {
  const m = moment(ddMmYyyy.trim(), DATE_FORMATS, true);
  if (m.isValid()) return m.format('YYYY-MM-DD');
  const parts = ddMmYyyy.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return ddMmYyyy;
}

function parseAmountNumber(raw?: string | null): number {
  const n = Number(String(raw ?? '').replace(/[,\s₹]/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function displayDueDateFromPreview(p: any): string {
  const raw = p?.invoice_due_date ?? p?.due_date ?? null;
  const formatted = formatDateDDMMYYYY(raw);
  return formatted === '-' ? '' : formatted;
}

function resolveProductCode(
  productCode?: string | null,
  previewProductName?: string | null,
): ProductCode {
  const fromProp = getEffectiveProductCode(productCode ?? null);
  if (productCode) return fromProp;
  const name = (previewProductName || '').toLowerCase();
  if (name.includes('purchase invoice discounting')) {
    return PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING;
  }
  if (name.includes('sales invoice discounting')) {
    return PRODUCT_CODES.SALES_INVOICE_DISCOUNTING;
  }
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

  const [computedDueDate, setComputedDueDate] = useState('');
  const [dueDateOverride, setDueDateOverride] = useState<string | null>(null);
  const [confirmedImpact, setConfirmedImpact] =
    useState<DueDateImpactFigure | null>(null);
  const [impactModalVisible, setImpactModalVisible] = useState(false);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactData, setImpactData] =
    useState<DueDateImpactPreviewResponse | null>(null);
  const [pendingOverrideDate, setPendingOverrideDate] = useState('');
  const [financingPreview, setFinancingPreview] =
    useState<DisbursementFinancingPreview | null>(null);
  const [financingPreviewLoading, setFinancingPreviewLoading] = useState(false);
  const [financingPreviewError, setFinancingPreviewError] = useState<
    string | null
  >(null);

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
    setComputedDueDate('');
    setDueDateOverride(null);
    setConfirmedImpact(null);
    setImpactModalVisible(false);
    setImpactLoading(false);
    setImpactData(null);
    setPendingOverrideDate('');
    setFinancingPreview(null);
    setFinancingPreviewLoading(false);
    setFinancingPreviewError(null);
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

        const initialDueRaw = invoiceData.invoice_due_date ?? invoiceData.due_date ?? null;
        const initialDueDisplay = formatDateDDMMYYYY(initialDueRaw);
        if (initialDueDisplay !== '-') {
          setComputedDueDate(initialDueDisplay);
        }

        // DF/VF: participant OD; PID (APM null): program loan OD — same as display.loanOdAccount
        const programLoan =
          invoiceData.program?.basic_parameters?.loan_account_no ??
          invoiceData.counter_party_od_account ??
          '';
        const odRaw = apm.od_account_no || programLoan || '';
        const odDisplay = odRaw
          ? decryptValue(String(odRaw)) || String(odRaw)
          : '';
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
  const isSid =
    effectiveCode === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING;
  const vendorPartyLabels = usesVendorPartyLayout(effectiveCode);
  /** Prefer server is_upfront (VF + SID); fall back to VF|SID + Upfront charge. */
  const isUpfrontInterest =
    financingPreview?.is_upfront ??
    ((isVendorFinance || isSid) &&
      isVfUpfrontChargeType(preview?.interest_charge_type));
  const amountLocked = !!financingPreview || isUpfrontInterest;

  const canModifyDueDate = preview?.can_modify_due_date === true;
  const effectiveDueDateDisplay =
    dueDateOverride ?? (computedDueDate || displayDueDateFromPreview(preview));
  const hasDueDateException =
    !!dueDateOverride &&
    !!computedDueDate &&
    dueDateOverride !== computedDueDate;

  const minOverrideDate = useMemo(() => {
    const disb = moment(date || todayDisplay, DATE_FORMATS, true);
    if (disb.isValid()) {
      return disb.clone().add(1, 'day').startOf('day').toDate();
    }
    return moment().add(1, 'day').startOf('day').toDate();
  }, [date, todayDisplay]);

  const fetchDueDateImpact = async (pickedDisplay: string) => {
    if (!invoiceId || !pickedDisplay) return;
    setImpactLoading(true);
    setImpactModalVisible(true);
    setPendingOverrideDate(pickedDisplay);
    setImpactData(null);
    try {
      const disbursementApiDate = toApiDateFromDisplay(date || todayDisplay);
      const amountNum = parseAmountNumber(disbursedAmount);
      const response = await invoiceApi.previewDueDateImpact(invoiceId, {
        invoice_due_date: toApiDateFromDisplay(pickedDisplay),
        disbursement_date: disbursementApiDate,
        ...(amountNum > 0 ? {disbursed_amount: amountNum} : {}),
      });
      if (response?.allowed === false) {
        Toast.show({
          type: 'error',
          text1: response.reason || 'Due date override is not available',
        });
        setImpactModalVisible(false);
        return;
      }
      setImpactData(response);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to preview due date impact',
      });
      setImpactModalVisible(false);
    } finally {
      setImpactLoading(false);
    }
  };

  const handleDueDateOverrideConfirm = (picked: Date) => {
    const pickedDisplay = moment(picked).format('DD-MM-YYYY');
    const baseline = computedDueDate || displayDueDateFromPreview(preview);
    if (baseline && pickedDisplay === baseline) {
      setDueDateOverride(null);
      setConfirmedImpact(null);
      return;
    }
    void fetchDueDateImpact(pickedDisplay);
  };

  const handleKeepCurrentDueDate = () => {
    setImpactModalVisible(false);
    setImpactData(null);
    setPendingOverrideDate('');
  };

  const handleConfirmNewDueDate = () => {
    if (!pendingOverrideDate || impactData?.is_holiday) return;
    setDueDateOverride(pendingOverrideDate);
    setConfirmedImpact(impactData?.proposed ?? null);
    // Amounts refresh from POST /invoice/disbursement/preview with the override.
    setImpactModalVisible(false);
    setImpactData(null);
  };

  const handleResetDueDateOverride = () => {
    setDueDateOverride(null);
    setConfirmedImpact(null);
    setPendingOverrideDate('');
  };

  /** Server financing figures for Disbursed + date (optional due override). */
  useEffect(() => {
    if (!visible || !invoiceId) {
      return;
    }
    if (disbursementAction !== 'Disbursed' || !date) {
      setFinancingPreview(null);
      setFinancingPreviewError(null);
      setFinancingPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setFinancingPreviewLoading(true);
      setFinancingPreviewError(null);
      const body: {
        disbursement_date: string;
        invoice_due_date?: string;
      } = {
        disbursement_date: toApiDateFromDisplay(date),
      };
      if (dueDateOverride) {
        body.invoice_due_date = toApiDateFromDisplay(dueDateOverride);
      }
      invoiceApi
        .previewSingleDisbursementFinancing(invoiceId, body)
        .then(data => {
          if (cancelled) return;
          setFinancingPreview(data);
          setFinancingPreviewError(null);
          const net = Number(data.max_disbursable_amount ?? data.net_disbursement_amount);
          if (Number.isFinite(net) && net > 0) {
            setDisbursedAmount(formatAmount(net));
            setAmountError(null);
          }
        })
        .catch((err: any) => {
          if (cancelled) return;
          setFinancingPreview(null);
          setFinancingPreviewError(
            err?.response?.data?.message ||
              err?.message ||
              'Failed to load financing preview',
          );
        })
        .finally(() => {
          if (!cancelled) setFinancingPreviewLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, invoiceId, disbursementAction, date, dueDateOverride]);

  const invoiceAmountCap = useMemo(() => {
    if (financingPreview) {
      return Number(financingPreview.max_disbursable_amount) || 0;
    }
    if (confirmedImpact?.net_disbursement_amount != null) {
      return Number(confirmedImpact.net_disbursement_amount) || 0;
    }
    if (!preview) return 0;
    return resolveNetInvoiceAmountFromPreview(preview, {isVendorFinance});
  }, [financingPreview, confirmedImpact, preview, isVendorFinance]);

  const display = useMemo(() => {
    const p = preview ?? {};
    const apm = p.anchorParticipantMapping ?? {};
    const pvd = p.programVendorDetails ?? {};
    const isVf = isVendorFinance;
    const programLoan =
      p.program?.basic_parameters?.loan_account_no ??
      p.counter_party_od_account ??
      '';

    const vendorRaw = vendorPartyLabels
      ? p.vendor_name ?? pvd.vendor_name ?? p.counter_party_name ?? apm.party?.entity_name ?? ''
      : p.vendor_name ?? apm.party?.entity_name ?? '';
    const anchorRaw =
      p.anchor_name ?? p.program?.party?.entity_name ?? p.party?.entity_name ?? '';
    const odRaw = vendorPartyLabels && !isVf
      ? programLoan || apm.od_account_no || debitFrom || ''
      : apm.od_account_no ?? debitFrom ?? '';
    const vendorCodeRaw = vendorPartyLabels && !isVf
      ? pvd.vendor_code ?? p.counter_party_code ?? apm.company_code_given_by_party ?? ''
      : apm.company_code_given_by_party ?? '';

    const creditAcc =
      p.credit_to_bank_account?.accountNumber ??
      p.creditToBankAccount?.accountNumber ??
      p.credit_to ??
      '';
    const creditName =
      p.credit_to_bank_account?.nameAsPerBank ??
      p.creditToBankAccount?.nameAsPerBank ??
      vendorRaw ??
      '';
    const decryptedAcc = creditAcc ? decryptValue(String(creditAcc)) : '';
    const accLabel = decryptedAcc || String(creditAcc);
    const creditDisplay = accLabel
      ? creditName
        ? `${accLabel} (${decryptValue(String(creditName)) || creditName})`
        : accLabel
      : '-';

    const preferredDisbursementDateRaw = p.preferred_disbursement_date ?? null;
    const dueDateRaw =
      dueDateOverride ??
      computedDueDate ??
      p.invoice_due_date ??
      p.due_date ??
      null;
    const grnDateRaw = p.grn_date ?? null;
    const tenorRaw = p.tenor ?? p.tenor_days ?? null;
    const disbursementDateForUsance =
      disbursementAction === 'Disbursed' && date
        ? date
        : preferredDisbursementDateRaw
          ? formatDateDDMMYYYY(preferredDisbursementDateRaw)
          : todayDisplay;
    const eligibilityRaw =
      p.eligibility_percent ?? apm.eligibility ?? p.program?.eligibility ?? null;

    const advanceInterestValue =
      financingPreview != null
        ? Number(financingPreview.upfront_interest)
        : confirmedImpact?.upfront_interest != null
          ? Number(confirmedImpact.upfront_interest)
          : resolveAdvanceInterestFromPreview(p, {isVendorFinance: isVf});
    const advanceInterestDisplay =
      Number.isFinite(advanceInterestValue) && advanceInterestValue > 0
        ? formatAmount(advanceInterestValue)
        : '-';
    const financedValue =
      financingPreview != null
        ? Number(financingPreview.financed_amount)
        : Number(p.financedAmount ?? p.financed_amount ?? 0);
    const netDisbursementValue =
      financingPreview != null
        ? Number(financingPreview.net_disbursement_amount)
        : confirmedImpact?.net_disbursement_amount != null
          ? Number(confirmedImpact.net_disbursement_amount)
          : resolveNetInvoiceAmountFromPreview(p, {isVendorFinance: isVf});

    return {
      isVf,
      anchor: dash(decryptValue(anchorRaw) || anchorRaw),
      vendor: dash(decryptValue(vendorRaw) || vendorRaw),
      dealerLabel: getPartyLabels(effectiveCode).singular,
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
      financedAmount:
        Number.isFinite(financedValue) && financedValue > 0
          ? formatAmount(financedValue)
          : '-',
      usanceDays:
        financingPreview != null
          ? String(financingPreview.usance_days)
          : confirmedImpact?.usance_days != null
            ? String(confirmedImpact.usance_days)
            : resolveDisbursementUsanceDaysDisplay(
                p.usance_days ?? p.usanceDays ?? null,
                dueDateRaw,
                disbursementDateForUsance,
                tenorRaw,
              ),
      netInvoiceAmount: formatAmount(
        netDisbursementValue > 0
          ? netDisbursementValue
          : p.final_total ?? p.invoice_amount,
      ),
      requestedDisbursementDate: formatDateDDMMYYYY(
        preferredDisbursementDateRaw,
      ),
      status: dash(p.invoice_status ?? p.status),
    };
  }, [
    preview,
    effectiveCode,
    isVendorFinance,
    vendorPartyLabels,
    debitFrom,
    financingPreview,
    date,
    disbursementAction,
    todayDisplay,
    dueDateOverride,
    computedDueDate,
    confirmedImpact,
  ]);

  const handleClose = () => {
    setDisbursementAction('');
    setActionDropdownOpen(false);
    setActionError(null);
    setAmountError(null);
    onClose();
  };

  const handleRequestClose = () => {
    dismissKeyboardOrClose(handleClose);
  };

  const handleOverlayPress = () => {
    // Backdrop: dismiss keyboard only — do not close the form accidentally.
    Keyboard.dismiss();
  };

  const validateDisbursedAmount = (rawAmount: string): string | null => {
    const amountNum = Number(rawAmount.replace(/[,\s₹]/g, '').trim());
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return null;
    }
    if (invoiceAmountCap > 0 && amountNum > invoiceAmountCap) {
      return financingPreview
        ? 'Disbursed amount cannot exceed max disbursable'
        : 'Disbursed amount cannot exceed invoice amount';
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

    const dueRaw =
      effectiveDueDateDisplay ||
      preview?.invoice_due_date ||
      preview?.due_date ||
      null;
    const disbForUsance =
      disbursementAction === 'Disbursed' ? todayDisplay : '';
    const computedUsance =
      financingPreview?.usance_days ??
      confirmedImpact?.usance_days ??
      computeUsanceDays({
        dueDate: dueRaw,
        disbursementDate: disbForUsance,
      }) ??
      undefined;

    const submitUpfrontInterest =
      financingPreview != null
        ? Number(financingPreview.upfront_interest)
        : confirmedImpact?.upfront_interest != null
          ? Number(confirmedImpact.upfront_interest)
          : resolveAdvanceInterestFromPreview(preview, {isVendorFinance});

    const submitNet =
      financingPreview != null
        ? Number(financingPreview.net_disbursement_amount)
        : resolveNetInvoiceAmountFromPreview(preview, {isVendorFinance});

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
        finalTotal: submitNet > 0 ? submitNet : undefined,
        upfrontInterest: submitUpfrontInterest,
        usanceDays:
          disbursementAction === 'Disbursed' ? computedUsance : undefined,
        invoiceDueDate:
          disbursementAction === 'Disbursed' && hasDueDateException
            ? toApiDateFromDisplay(dueDateOverride!)
            : undefined,
      });
    }
    handleClose();
  };

  const isSubmitDisabled =
    !disbursementAction ||
    !!amountError ||
    (disbursementAction === 'Disbursed' &&
      (!!financingPreviewError ||
        financingPreviewLoading ||
        !date ||
        !utrNo.trim() ||
        !transactionNo.trim() ||
        !disbursedAmount ||
        !debitFrom.trim()));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleRequestClose}>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
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
                      effectiveCode === PRODUCT_CODES.DEALER_FINANCE
                        ? styles.productBadgeDf
                        : styles.productBadgeVf,
                    ]}>
                    <Text
                      style={[
                        styles.productBadgeText,
                        effectiveCode === PRODUCT_CODES.DEALER_FINANCE
                          ? styles.productBadgeTextDf
                          : styles.productBadgeTextVf,
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
                        label={
                          effectiveCode === PRODUCT_CODES.SALES_INVOICE_DISCOUNTING
                            ? 'Escrow Account No.'
                            : 'Loan OD Account Number'
                        }
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
                        label={INVOICE_SUMMARY_LABELS.financedAmount}
                        value={display.financedAmount}
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
                        label={INVOICE_SUMMARY_LABELS.netDisbursementAmount}
                        value={display.netInvoiceAmount}
                        emphasize
                      />
                      {financingPreviewLoading ? (
                        <Text style={styles.financingHint}>
                          Updating financing figures…
                        </Text>
                      ) : null}
                      {financingPreviewError ? (
                        <Text style={styles.fieldError}>
                          {financingPreviewError}
                        </Text>
                      ) : null}
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
                                amountLocked && styles.inputLocked,
                              ]}
                              value={disbursedAmount}
                              onChangeText={text => {
                                if (amountLocked) return;
                                setDisbursedAmount(text);
                                setAmountError(validateDisbursedAmount(text));
                              }}
                              editable={!amountLocked}
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
                          {canModifyDueDate && (
                            <View style={styles.inputRow}>
                              <View style={styles.overrideHeaderRow}>
                                <Text style={styles.inputLabel}>
                                  Due Date Override (bank exception)
                                </Text>
                                {hasDueDateException && (
                                  <TouchableOpacity
                                    onPress={handleResetDueDateOverride}
                                    hitSlop={{
                                      top: 8,
                                      bottom: 8,
                                      left: 8,
                                      right: 8,
                                    }}>
                                    <Text style={styles.resetLink}>
                                      Reset to computed date
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                              <DateNTimePicker
                                label=""
                                mode="date"
                                value={
                                  effectiveDueDateDisplay ||
                                  computedDueDate ||
                                  todayDisplay
                                }
                                datePickerProps={{
                                  minimumDate: minOverrideDate,
                                }}
                                onConfirm={handleDueDateOverrideConfirm}
                                placeholder="DD-MM-YYYY"
                                containerStyle={styles.datePickerContainer}
                              />
                              {hasDueDateException && (
                                <Text style={styles.overrideWarning}>
                                  Bank exception applied — differs from the
                                  program-computed date.
                                </Text>
                              )}
                            </View>
                          )}
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

      <DueDateImpactModal
        visible={impactModalVisible}
        loading={impactLoading}
        data={impactData}
        onKeepCurrent={handleKeepCurrentDueDate}
        onConfirm={handleConfirmNewDueDate}
        onClose={handleKeepCurrentDueDate}
      />
      {/* Toast inside Modal so validation/errors are visible above the sheet */}
      <Toast topOffset={60} />
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
  overrideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleWidth(8),
  },
  resetLink: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: '#1565C0',
  },
  overrideWarning: {
    marginTop: scaleHeight(6),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: '#C2410C',
    lineHeight: scaleFont(15),
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
  financingHint: {
    marginTop: scaleHeight(6),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
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
