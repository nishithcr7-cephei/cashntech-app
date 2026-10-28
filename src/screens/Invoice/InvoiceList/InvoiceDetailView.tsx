import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {selectProgramSelection} from '@store/programSelection/programSelection.selector';
import {selectInvoiceList} from '@store/invoice/inv.selector';
import {
  selectIsSidActive,
  selectIsVendorFinanceActive,
} from '@store/product/product.selectors';
import {AppBar, Container, UploadModal} from '@components/index';
import {
  AdvanceInterestFormulaModal,
  DisbursementRequestedFormulaModal,
  InvoiceAmountFormulaModal,
  NetDisbursementFormulaModal,
} from '@components/AdvanceInterestFormulaModal';
import {InvoiceAccountingSummary} from '@components/InvoiceAccountingSummary';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {Download, LeftChevron} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {invoiceApi} from '@services/api/invoice.api';
import {formatStatus} from './components/InvoiceDetails/types';
import {decryptValue} from '@utils/decrypt';
import {formatApiInvoiceDate} from '@utils/invoiceDateFormat';
import {unitCodeToLabel} from '@utils/unitNormalizer';
import {mapInvoiceAttachmentsWithUrls, openInvoiceAttachment} from '@utils/invoiceAttachments';
import {
  resolveDisbursementUsanceDaysDisplay,
  resolveInvoiceRoiPercent,
  resolveNetDisbursementAmountFromInvoice,
} from '@utils/invoiceTotals';
import {DocumentPickerResponse} from '@react-native-documents/picker';

const fmtAmount = (n: number) =>
  n.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const fmtPercent = (n: number) => Number(n).toFixed(2);
const displayOrDash = (val?: string | number | null) => {
  if (val === undefined || val === null) return '-';
  const s = String(val).trim();
  return s !== '' ? s : '-';
};

const displayEarlyPaymentDiscount = (val?: string | number | null) => {
  const raw = String(val ?? '').trim();
  if (!raw || raw === '0') return '-';
  return raw.includes('%') ? raw : `${raw}%`;
};

type AttachmentItem = {id: number; attachment_url: string; fullUrl: string};

type InvoiceItemRow = {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxLabel: string;
  total: number;
};

type InvoiceDetailData = {
  invoiceRefNo: string;
  dealerName: string;
  dealerCode: string;
  odAccountNumber: string;
  anchorName: string;
  remark: string;
  poRefNo: string;
  tenorDays: string;
  invoiceDate: string;
  invoiceDueDate: string;
  paymentDate: string;
  grnDate: string;
  disbursementDate: string;
  usanceDays: string;
  creditTo: string;
  workflowMethod: string;
  currency: string;
  earlyPaymentDiscount: string;
  subTotal: number;
  items: InvoiceItemRow[];
  discount: {percent: number; amount: number};
  tax: {percent: number; amount: number};
  tdsAmount: number;
  advanceInterest: number;
  showAdvanceInterest: boolean;
  isVendorFinance: boolean;
  /** PID or SID — counterparty comes from programVendorDetails. */
  isPid: boolean;
  isSid: boolean;
  roiPercent: number;
  total: number;
  attachments: AttachmentItem[];
  invoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;
};

const defaultInvoiceData: InvoiceDetailData = {
  invoiceRefNo: '',
  dealerName: '',
  dealerCode: '',
  odAccountNumber: '',
  anchorName: '',
  remark: '',
  poRefNo: '',
  tenorDays: '',
  invoiceDate: '',
  invoiceDueDate: '',
  paymentDate: '',
  grnDate: '',
  disbursementDate: '',
  usanceDays: '',
  creditTo: '',
  workflowMethod: '',
  currency: 'INR',
  earlyPaymentDiscount: '',
  subTotal: 0,
  items: [],
  discount: {percent: 0, amount: 0},
  tax: {percent: 0, amount: 0},
  tdsAmount: 0,
  advanceInterest: 0,
  showAdvanceInterest: false,
  isVendorFinance: false,
  isPid: false,
  isSid: false,
  roiPercent: 0,
  total: 0,
  attachments: [],
  invoiceStatus: '',
  approvalStatus: '',
  adminStatus: '',
};

const STATUS_COLORS = {
  ATTACHMENT_PENDING: {backgroundColor: '#FFF4E5', color: '#FF8C00'},
  CREATED: {backgroundColor: '#E3F2FD', color: '#1976D2'},
  DISBURSED: {backgroundColor: '#E8F5E9', color: '#2E7D32'},
  REJECTED: {backgroundColor: '#FFEBEE', color: '#D32F2F'},
  DEFAULT: {backgroundColor: '#F7F8FB', color: Colors.darkblack},
};

function getInvoiceStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('attachment pending')) return STATUS_COLORS.ATTACHMENT_PENDING;
  if (s.includes('created')) return STATUS_COLORS.CREATED;
  if (s.includes('disbursed')) return STATUS_COLORS.DISBURSED;
  if (s.includes('reject')) return STATUS_COLORS.REJECTED;
  return STATUS_COLORS.DEFAULT;
}

function getApprovalStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('pending')) return STATUS_COLORS.ATTACHMENT_PENDING;
  if (s.includes('reject')) return STATUS_COLORS.REJECTED;
  if (s.includes('completed') || s.includes('approval complete')) return STATUS_COLORS.DISBURSED;
  return STATUS_COLORS.DEFAULT;
}

function getAdminStatusStyles(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'verify' || s === 'verified' || s === 'submitted') return STATUS_COLORS.DISBURSED;
  if (s === 'hold') return {backgroundColor: '#E0E0E0', color: '#6B5B4F'};
  if (s === 'reject' || s === 'rejected') return STATUS_COLORS.REJECTED;
  return STATUS_COLORS.DEFAULT;
}

/** Label-left / value-right row — matches ApproveRejectModal pattern. */
const DetailRow: React.FC<{
  label: string;
  value: string;
  isLast?: boolean;
  emphasize?: boolean;
}> = ({label, value, isLast, emphasize}) => (
  <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
    <View style={styles.detailRowLabelWrap}>
      <Text
        style={[styles.detailRowLabel, emphasize && styles.detailRowLabelEmphasize]}
        numberOfLines={2}>
        {label}
      </Text>
    </View>
    <Text
      style={[styles.detailRowValue, emphasize && styles.detailRowValueEmphasize]}
      selectable>
      {value}
    </Text>
  </View>
);

export const InvoiceDetailView: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const programSelection = useSelector(selectProgramSelection);
  const isVendorFinanceActive = useSelector(selectIsVendorFinanceActive);
  const isSidActive = useSelector(selectIsSidActive);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCheckerRole = isAnchorChecker || isDealerChecker;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceDetailData>(defaultInvoiceData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanceInterestFormula, setShowAdvanceInterestFormula] =
    useState(false);
  const [showInvoiceAmountFormula, setShowInvoiceAmountFormula] =
    useState(false);
  const [showDisbursementRequestedFormula, setShowDisbursementRequestedFormula] =
    useState(false);
  const [showNetDisbursementFormula, setShowNetDisbursementFormula] =
    useState(false);

  const rawInvoiceId = route?.params?.invoiceId || '';
  const invoiceNo = route?.params?.invoiceNo || '';
  const returnRoute = route?.params?.returnRoute as string | undefined;
  const returnProgramId =
    (route?.params?.programId as string | undefined) ||
    programSelection?.programId ||
    undefined;
  const fromInvoiceDashboard = route?.params?.fromInvoiceDashboard === true;
  const listInvoiceStatus = route?.params?.listInvoiceStatus as string | undefined;
  const listApprovalStatus = route?.params?.listApprovalStatus as string | undefined;
  const listAdminStatus = route?.params?.listAdminStatus as string | undefined;
  const invoiceListRaw = useSelector(selectInvoiceList) as Array<any>;

  const listRowForInvoice = useMemo(() => {
    const trimmed = String(rawInvoiceId || '').trim();
    return (invoiceListRaw || []).find(
      inv =>
        String(inv?.id || '').trim() === trimmed ||
        String(inv?.invoice_ref_no || '').trim() === String(invoiceNo || '').trim(),
    );
  }, [invoiceListRaw, rawInvoiceId, invoiceNo]);

  const invoiceId = useMemo(() => {
    const trimmed = String(rawInvoiceId || '').trim();
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Normal path: id is already UUID
    if (uuidLike.test(trimmed)) return trimmed;

    // Fallback: some flows can pass invoice number in invoiceId route param.
    const byRefNo = (invoiceListRaw || []).find(
      inv =>
        String(inv?.invoice_ref_no || '').trim() === trimmed ||
        String(inv?.invoice_ref_no || '').trim() === String(invoiceNo || '').trim(),
    );

    if (byRefNo?.id) return String(byRefNo.id);

    return trimmed;
  }, [rawInvoiceId, invoiceNo, invoiceListRaw]);

  const goBackToList = useCallback(() => {
    // Drawer screens do not reliably stack — always return to the explicit
    // source screen (invoice list / disbursement / etc.) instead of goBack(),
    // which often lands on Invoice Overview (drawer initial route).
    const target = returnRoute || 'InvoiceDetails';
    const params: Record<string, unknown> = {};
    if (target === 'InvoiceDetails') {
      if (returnProgramId) params.programId = returnProgramId;
      if (fromInvoiceDashboard) params.fromInvoiceDashboard = true;
    }
    (navigation as any).navigate(
      target,
      Object.keys(params).length ? params : undefined,
    );
  }, [navigation, returnRoute, returnProgramId, fromInvoiceDashboard]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        goBackToList();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onHardwareBack,
      );
      return () => sub.remove();
    }, [goBackToList]),
  );

  useEffect(() => {
    if (!invoiceId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    invoiceApi
      .getInvoiceDetails(invoiceId)
      .then((data: any) => {
        if (cancelled) return;
        const apm = data?.anchorParticipantMapping;
        const pvd = data?.programVendorDetails;
        const party = data?.party;
        const program = data?.program;
        const bankDetails = program?.bank_details;
        const rawCreditAccount =
          data?.creditToBankAccount?.accountNumber ||
          data?.creditToBankAccount?.account_number ||
          (Array.isArray(bankDetails)
            ? bankDetails[0]?.account_number
            : bankDetails?.account_number) ||
          data.credit_to ||
          '';
        const creditTo = rawCreditAccount
          ? decryptValue(String(rawCreditAccount)) || String(rawCreditAccount)
          : '';

        const productName = String(
          data?.product?.name ||
            data?.program?.productConfig?.product?.name ||
            listRowForInvoice?.product?.name ||
            listRowForInvoice?.product_name ||
            '',
        );
        const isSidInvoice = productName
          ? /sales\s*invoice\s*discounting/i.test(productName)
          : isSidActive && !!pvd?.id;
        const isPidInvoice =
          !!pvd?.id ||
          isSidInvoice ||
          /purchase\s*invoice\s*discounting/i.test(productName);

        const dealerName = isPidInvoice
          ? decryptValue(pvd?.vendor_name ?? '') ||
            pvd?.vendor_name ||
            decryptValue(data?.counter_party_name ?? '') ||
            data?.counter_party_name ||
            ''
          : decryptValue(apm?.party?.entity_name ?? '') || '';
        const dealerCode = isPidInvoice
          ? pvd?.vendor_code || data?.counter_party_code || ''
          : apm?.company_code_given_by_party ?? '';
        const programLoanAccount = String(
          program?.basic_parameters?.loan_account_no ||
            (typeof program?.basic_parameters === 'object'
              ? (program.basic_parameters as any)?.loan_account_no
              : '') ||
            data?.counter_party_od_account ||
            '',
        );
        const odAccountNumber = isPidInvoice
          ? decryptValue(programLoanAccount) || programLoanAccount || ''
          : decryptValue(apm?.od_account_no ?? '') || '';
        const anchorName =
          program?.program_name ||
          decryptValue(party?.entity_name ?? '') ||
          '';
        const poRefNo =
          data?.po_ref_no != null && String(data.po_ref_no).trim() !== ''
            ? String(data.po_ref_no)
            : '';

        const subTotal = Number(data?.sub_total) || 0;
        const taxTotal = Number(data?.tax_total) || 0;
        const discountTotal = Number(data?.discount_total) || 0;
        const finalTotal = Number(data?.final_total) || 0;
        const netDisbursementAmount = resolveNetDisbursementAmountFromInvoice(data);
        const tdsAmount = Number(data?.tds_amount) || 0;
        const advanceInterest = Number(data?.upfront_interest) || 0;
        const isVendorFinanceInvoice = /vendor\s*finance/i.test(productName);
        const isSidInvoice =
          /sales\s*invoice\s*discounting/i.test(productName) ||
          /\bsid\b/i.test(productName);
        const showAdvanceInterest =
          isVendorFinanceInvoice || isSidInvoice || advanceInterest > 0;

        const items: InvoiceItemRow[] = (data?.invoiceItems || []).map((it: any, idx: number) => {
          const lineTotal = Number(it.total) || 0;
          const lineDiscount = Number(it.discount_amount) || 0;
          const taxes = Array.isArray(it.taxes) ? it.taxes : [];
          const taxAmount = taxes.reduce(
            (sum: number, t: any) => sum + (Number(t.tax_amount) || 0),
            0,
          );
          const taxType = taxes[0]?.tax_type || 'Tax';
          const taxPercent = taxes[0]?.tax_percentage ?? 0;
          const taxLabel =
            taxes.length > 0 ? `(${taxType}) (${taxPercent}%)` : '-';
          const qty = Number(it.quantity) || 0;
          const price = Number(it.price_per_quantity) || 0;
          const gross = qty * price;
          const discountPercent =
            it.discount_type === 'Percentage' && it.discount_value != null
              ? Number(it.discount_value) || 0
              : gross > 0
                ? (lineDiscount / gross) * 100
                : 0;

          return {
            id: it.id || `item-${idx}`,
            itemName: it.name ?? '-',
            description: it.description ?? '',
            quantity: qty,
            unit: unitCodeToLabel(it.unit) || '-',
            price,
            discountAmount: lineDiscount,
            discountPercent,
            taxAmount,
            taxLabel,
            total: lineTotal,
          };
        });

        const discountPercent = subTotal > 0 ? (discountTotal / subTotal) * 100 : 0;
        const taxPercent = subTotal > 0 ? (taxTotal / subTotal) * 100 : 0;
        const attachments = mapInvoiceAttachmentsWithUrls(data);

        setInvoiceData({
          invoiceRefNo: data?.invoice_ref_no || invoiceNo || '',
          dealerName,
          dealerCode,
          odAccountNumber,
          anchorName,
          remark: data?.remark ?? '',
          poRefNo,
          tenorDays:
            data?.tenor != null && data?.tenor !== ''
              ? String(Math.round(Number(data.tenor)))
              : '',
          invoiceDate: formatApiInvoiceDate(data?.invoice_date) || '-',
          invoiceDueDate: formatApiInvoiceDate(data?.invoice_due_date) || '-',
          paymentDate: formatApiInvoiceDate(data?.payment_date) || '-',
          grnDate: formatApiInvoiceDate(data?.grn_date) || '',
          disbursementDate:
            formatApiInvoiceDate(data?.disbursement_date) || '',
          usanceDays: (() => {
            const resolved = resolveDisbursementUsanceDaysDisplay(
              data?.usance_days ?? null,
              data?.invoice_due_date ?? null,
              data?.disbursement_date ?? null,
              data?.tenor ?? null,
            );
            return resolved === '-' ? '' : resolved;
          })(),
          creditTo,
          workflowMethod:
            apm?.program?.method || data?.program?.method || data?.workflow_method || '',
          currency: data?.currency || 'INR',
          earlyPaymentDiscount:
            data?.early_payment_discount != null &&
            String(data.early_payment_discount).trim() !== ''
              ? String(data.early_payment_discount).trim()
              : '',
          subTotal,
          items,
          discount: {percent: discountPercent, amount: discountTotal},
          tax: {percent: taxPercent, amount: taxTotal},
          tdsAmount,
          advanceInterest,
          showAdvanceInterest,
          isVendorFinance: isVendorFinanceInvoice,
          isPid: isPidInvoice,
          isSid: isSidInvoice,
          roiPercent: resolveInvoiceRoiPercent(data),
          total: netDisbursementAmount || finalTotal,
          attachments,
          invoiceStatus: formatStatus(
            data?.invoice_status || listInvoiceStatus || listRowForInvoice?.invoice_status || '',
          ),
          approvalStatus: formatStatus(
            data?.approval_status ||
              listApprovalStatus ||
              listRowForInvoice?.approval_status ||
              '',
          ),
          adminStatus: formatStatus(
            data?.admin_status || listAdminStatus || listRowForInvoice?.admin_status || '',
          ),
        });
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load invoice details');
          setInvoiceData(defaultInvoiceData);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceId, invoiceNo, listInvoiceStatus, listApprovalStatus, listAdminStatus, listRowForInvoice, isSidActive]);

  const handleAttachmentUpload = (_file?: DocumentPickerResponse) => {
    setShowUploadModal(false);
  };

  const openAttachment = async (fullUrl: string) => {
    try {
      await openInvoiceAttachment(fullUrl);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to open attachment');
    }
  };

  const headerTitle = invoiceData.invoiceRefNo || invoiceNo || invoiceId || 'N/A';
  const subtitle = invoiceData.anchorName || invoiceData.dealerName || '';
  /** VF / PID party labels are Vendor, SID is Debtor. AI row stays VF-only via isVendorFinance. */
  const isVendorFinance =
    isVendorFinanceActive || invoiceData.isVendorFinance;
  const useVendorPartyLabels = isVendorFinance || invoiceData.isPid;
  const partyWord = invoiceData.isSid
    ? 'Debtor'
    : useVendorPartyLabels
      ? 'Vendor'
      : 'Dealer';
  const productInvoiceLabel = `${partyWord} Invoice`;
  const odAccountLabel = invoiceData.isSid
    ? 'Escrow Account No.'
    : useVendorPartyLabels
      ? 'Loan OD Account Number'
      : 'OD Account';

  if (loading) {
    return (
      <Container>
        <AppBar
          title="Invoice Detail"
          navigation={navigation as any}
          hideHamburger={true}
          renderLeftIcon={
            isCheckerRole ? (
              <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />
            ) : undefined
          }
          onPressLeftIcon={isCheckerRole ? goBackToList : undefined}
        />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={styles.centerStateText}>Loading invoice details...</Text>
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <AppBar
          title="Invoice Detail"
          navigation={navigation as any}
          hideHamburger={true}
          renderLeftIcon={
            isCheckerRole ? (
              <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />
            ) : undefined
          }
          onPressLeftIcon={isCheckerRole ? () => (navigation as any).goBack() : undefined}
        />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <AppBar
        title="Invoice Detail"
        navigation={navigation as any}
        hideHamburger={true}
        renderLeftIcon={
          isCheckerRole ? (
            <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />
          ) : undefined
        }
        onPressLeftIcon={isCheckerRole ? goBackToList : undefined}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            {!isCheckerRole && (
              <TouchableOpacity style={styles.backButton} onPress={goBackToList}>
                <LeftChevron height={scaleWidth(16)} width={scaleHeight(16)} />
              </TouchableOpacity>
            )}
            <View style={styles.headerTextBlock}>
              <Text style={styles.productInvoiceLabel}>{productInvoiceLabel}</Text>
              <Text style={styles.invoiceRefTitle}>{headerTitle}</Text>
              {!!subtitle && (
                <Text style={styles.invoiceSubtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconAction} disabled>
                <Download width={scaleWidth(16)} height={scaleHeight(16)} />
              </TouchableOpacity>
            </View>
          </View>

          {(invoiceData.invoiceStatus ||
            invoiceData.approvalStatus ||
            invoiceData.adminStatus) && (
            <View style={styles.statusBadgesRow}>
              {!!invoiceData.invoiceStatus && (
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getInvoiceStatusStyles(invoiceData.invoiceStatus).backgroundColor},
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {color: getInvoiceStatusStyles(invoiceData.invoiceStatus).color},
                    ]}>
                    {invoiceData.invoiceStatus}
                  </Text>
                </View>
              )}
              {!!invoiceData.approvalStatus && (
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getApprovalStatusStyles(invoiceData.approvalStatus).backgroundColor},
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {color: getApprovalStatusStyles(invoiceData.approvalStatus).color},
                    ]}>
                    {invoiceData.approvalStatus}
                  </Text>
                </View>
              )}
              {!!invoiceData.adminStatus && (
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: getAdminStatusStyles(invoiceData.adminStatus).backgroundColor},
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {color: getAdminStatusStyles(invoiceData.adminStatus).color},
                    ]}>
                    {invoiceData.adminStatus}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Party Details — ApproveRejectModal pattern */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Party Details</Text>
          <View style={styles.detailsTable}>
            <DetailRow
              label="Anchor"
              value={displayOrDash(invoiceData.anchorName)}
            />
            <DetailRow
              label={`${partyWord} Name`}
              value={displayOrDash(invoiceData.dealerName)}
            />
            <DetailRow
              label={odAccountLabel}
              value={displayOrDash(invoiceData.odAccountNumber)}
            />
            <DetailRow
              label={`${partyWord} Code`}
              value={displayOrDash(invoiceData.dealerCode)}
            />
            <DetailRow
              label="Credit To"
              value={displayOrDash(invoiceData.creditTo)}
              isLast
            />
          </View>

          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.detailsTable}>
            {/* Web Vendor Invoice preview order (VF + DF): */}
            <DetailRow
              label="Invoice Date"
              value={displayOrDash(invoiceData.invoiceDate)}
            />
            <DetailRow
              label="Invoice Due Date"
              value={displayOrDash(invoiceData.invoiceDueDate)}
            />
            <DetailRow
              label="Payment Date"
              value={displayOrDash(invoiceData.paymentDate)}
            />
            <DetailRow
              label="GRN Date"
              value={displayOrDash(invoiceData.grnDate)}
            />
            <DetailRow
              label="Disbursement Date"
              value={displayOrDash(invoiceData.disbursementDate)}
            />
            <DetailRow
              label="Po Ref No"
              value={displayOrDash(invoiceData.poRefNo)}
            />
            <DetailRow
              label="Tenor"
              value={displayOrDash(invoiceData.tenorDays)}
            />
            <DetailRow
              label="Usance Days"
              value={displayOrDash(invoiceData.usanceDays)}
              isLast
            />
          </View>

          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.detailsTable}>
            <DetailRow
              label="Early Payment Discount"
              value={displayEarlyPaymentDiscount(invoiceData.earlyPaymentDiscount)}
            />
            <DetailRow
              label="Remark"
              value={displayOrDash(invoiceData.remark)}
              isLast
            />
          </View>

          <Text style={styles.sectionTitle}>Items</Text>
          {invoiceData.items.length === 0 ? (
            <Text style={styles.emptyHint}>No items found</Text>
          ) : (
            invoiceData.items.map(item => {
              const discountValue =
                item.discountPercent > 0
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
                  <DetailRow label="Unit" value={displayOrDash(item.unit)} />
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
            basicAmount={invoiceData.subTotal}
            discount={invoiceData.discount.amount}
            gstAmount={invoiceData.tax.amount}
            tdsAmount={invoiceData.tdsAmount}
            advanceInterest={invoiceData.advanceInterest}
            netDisbursementAmount={invoiceData.total}
            showAdvanceInterest={invoiceData.showAdvanceInterest}
            onInvoiceAmountInfoPress={() => setShowInvoiceAmountFormula(true)}
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
            {invoiceData.attachments.length > 0
              ? ` · ${invoiceData.attachments.length}`
              : ''}
          </Text>
          {invoiceData.attachments.length === 0 ? (
            <Text style={styles.emptyHint}>No attachments</Text>
          ) : (
            invoiceData.attachments.map((att, idx) => {
              const fileName =
                att.attachment_url?.split('/').pop() || `Attachment ${idx + 1}`;
              const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
              const isPdf = ext === 'PDF';
              return (
                <TouchableOpacity
                  key={att.id}
                  style={styles.attachmentCard}
                  onPress={() => openAttachment(att.fullUrl)}
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
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <Text style={styles.attachmentMeta}>Tap to view</Text>
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
        </View>
      </ScrollView>

      <UploadModal
        visible={showUploadModal}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={handleAttachmentUpload}
      />
      <AdvanceInterestFormulaModal
        visible={showAdvanceInterestFormula}
        onClose={() => setShowAdvanceInterestFormula(false)}
        amounts={{
          basicAmount: invoiceData.subTotal,
          discount: invoiceData.discount.amount,
          gstAmount: invoiceData.tax.amount,
          tdsAmount: invoiceData.tdsAmount,
          advanceInterest: invoiceData.advanceInterest,
          roiPercent: invoiceData.roiPercent,
          tenorDays: invoiceData.tenorDays,
        }}
      />
      <InvoiceAmountFormulaModal
        visible={showInvoiceAmountFormula}
        onClose={() => setShowInvoiceAmountFormula(false)}
        amounts={{
          basicAmount: invoiceData.subTotal,
          discount: invoiceData.discount.amount,
          gstAmount: invoiceData.tax.amount,
        }}
      />
      <DisbursementRequestedFormulaModal
        visible={showDisbursementRequestedFormula}
        onClose={() => setShowDisbursementRequestedFormula(false)}
        amounts={{
          basicAmount: invoiceData.subTotal,
          discount: invoiceData.discount.amount,
          gstAmount: invoiceData.tax.amount,
          tdsAmount: invoiceData.tdsAmount,
        }}
      />
      <NetDisbursementFormulaModal
        visible={showNetDisbursementFormula}
        onClose={() => setShowNetDisbursementFormula(false)}
        amounts={{
          basicAmount: invoiceData.subTotal,
          discount: invoiceData.discount.amount,
          gstAmount: invoiceData.tax.amount,
          tdsAmount: invoiceData.tdsAmount,
          advanceInterest: invoiceData.advanceInterest,
        }}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(24),
  },
  centerStateText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  errorText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.red,
    textAlign: 'center',
  },
  content: {
    padding: scaleWidth(16),
    paddingBottom: scaleHeight(32),
    gap: scaleHeight(12),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: '#E8EAED',
    padding: scaleWidth(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    marginRight: scaleWidth(10),
    marginTop: scaleHeight(2),
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  productInvoiceLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    marginBottom: scaleHeight(4),
  },
  invoiceRefTitle: {
    fontSize: scaleFont(17),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  invoiceSubtitle: {
    marginTop: scaleHeight(4),
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  headerActions: {
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  iconAction: {
    width: scaleWidth(34),
    height: scaleWidth(34),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFC',
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
    marginTop: scaleHeight(12),
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(4),
  },
  statusBadgeText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(10),
  },
  detailsTable: {
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(8),
    padding: scaleWidth(12),
    marginBottom: scaleHeight(14),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: scaleHeight(7),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    gap: scaleWidth(8),
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailRowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scaleWidth(6),
    marginRight: scaleWidth(4),
  },
  detailRowLabel: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flexShrink: 1,
  },
  detailRowLabelEmphasize: {
    fontFamily: Fonts.GilroySemiBold,
  },
  detailRowValue: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    flexShrink: 0,
    textAlign: 'right',
  },
  detailRowValueEmphasize: {
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
    padding: scaleWidth(12),
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    borderWidth: 1,
    borderColor: '#E8EAED',
    marginBottom: scaleHeight(10),
  },
  attachmentIcon: {
    width: scaleWidth(44),
    height: scaleWidth(44),
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleWidth(12),
  },
  attachmentIconPdf: {
    backgroundColor: '#E8F4FD',
  },
  attachmentIconText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  attachmentInfo: {
    flex: 1,
    marginRight: scaleWidth(8),
  },
  attachmentName: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(2),
  },
  attachmentMeta: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyRegular,
    color: Colors.graybase,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(6),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  viewButtonText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
});
