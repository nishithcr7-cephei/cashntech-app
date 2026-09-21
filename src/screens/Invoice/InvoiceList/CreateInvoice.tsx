import React, {useMemo, useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Modal,
  BackHandler,
  InteractionManager,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  useIsFocused,
} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  AppBar,
  Container,
  BusyOverlay,
  InvoiceProgramLimitBanner,
} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {formatApiInvoiceDate} from '@utils/invoiceDateFormat';
import {ensureCameraPermission} from '@services/permissions';
import {runGSTInvoiceExtractionWithAI} from '@services/ocr';
import type {GeminiRetryEvent} from '@services/geminiOcr';
import {
  InvoiceForm,
  type PartyTaxOption,
  type CreditToOption,
} from '@components/InvoiceForm';
import {InvoiceCamera} from '@components/InvoiceCamera';
import {UploadModal} from '@components/index';
import type {InvoiceFields, InvoiceLineItem} from '@type/Invoice';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {Camera, Upload, AI, LeftChevron} from '@assets/Icons';
import Toast from 'react-native-toast-message';
import {
  computeInvoiceLineAggregates,
  computeInvoiceNetTotal,
  computeVendorFinanceAdvanceInterest,
  extractRoiPercent,
  isTdsPartyTaxName,
  round2,
} from '@utils/invoiceTotals';
import {
  computeCreateInvoiceTotals,
  computeInvoiceAmountForLimitCheck,
  getOcrPartyLabels,
  isPidProductType,
  shouldWarnVfZeroAdvanceInterest,
} from '@utils/invoiceCreateCalc';
import {convertOcrLineItems} from '@utils/ocrLineItemMapper';
import {
  normalizeOcrPatch,
  type InvoiceProductType,
} from '@utils/ocrPatchNormalizer';
import {expectedNextApprovalAfterCreate} from '@utils/invoiceStatusDisplay';
import {invoiceApi} from '@services/api/invoice.api';
import {
  fetchDealerInfoRequest,
  createInvoiceRequest,
  updateInvoiceRequest,
  resetCreateInvoiceState,
} from '@store/invoice/inv.slice';
import {
  selectDealerInfo,
  selectDealerInfoError,
  selectCreateInvoiceLoading,
  selectCreateInvoiceSuccess,
  selectCreateInvoiceError,
} from '@store/invoice/inv.selector';
import {
  toggleProgramSelection,
} from '@store/programSelection/programSelection.slice';
import {
  setLeavingCreateInvoice,
  setOpeningCreateInvoice,
  selectLeavingCreateInvoice,
} from '@store/ui';
import {userSelector} from '@store/user';
import {PERMISSIONS} from '@constants/permissions';
import {AppRole, ROLE_LABELS} from '@constants/roles';
import {
  fetchPermissionsRequest,
  selectPermissionsLoading,
  selectPermissionsError,
} from '@store/permissions';
import {useHasPermission} from '@hooks/useHasPermission';
import type {DealerInfoParticipant} from '@store/invoice/inv.types';
import {
  getParticipantAvailableLimit,
} from '@utils/normalizeDealerInfo';
import {formatIndianNumber} from '@utils/Utils';
import {decryptValue} from '@utils/decrypt';
import {requiresCreditToAccountId} from '@utils/invoicePartyInfoRoute';
import {resolveProductCodeFromName} from '@store/product/product.resolver';
import {selectEffectiveProductCode, selectActiveProductId} from '@store/product/product.selectors';
import {PRODUCT_CODES} from '@store/product/product.types';

function matchDealerInfoParticipant(
  participants: DealerInfoParticipant[] | undefined,
  dealerName: string | undefined,
  dealerCode: string | undefined,
): DealerInfoParticipant | null {
  if (!participants?.length) {
    return null;
  }
  if (!dealerName?.trim() && !dealerCode?.trim()) {
    return null;
  }
  return (
    participants.find(p => {
      const decryptedName =
        decryptValue(p.party?.entity_name || '') || p.party?.entity_name;
      const rawName = p.party?.entity_name;
      const codeMatched =
        !!dealerCode &&
        (p.company_code_given_by_party === dealerCode ||
          p.company_code === dealerCode);
      return (
        (!!dealerName &&
          (decryptedName === dealerName || rawName === dealerName)) ||
        codeMatched
      );
    }) ?? null
  );
}

function formatLimitInr(amount: number): string {
  return `₹${formatIndianNumber(String(Number(amount.toFixed(2))))}`;
}

function parseLimitNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

const getInitialFields = (): InvoiceFields => ({
  dealer: '',
  dealerCode: '',
  odAccountNumber: '',
  invoiceNumber: '',
  associatedPO: '',
  tenor: '',
  invoiceDate: '',
  paymentDate: '',
  invoiceDueDate: '',
  grnDate: '',
  earlyPaymentDiscount: '',
  currency: 'INR',
  creditTo: '',
  remark: '',
  items: [],
  discountType: '',
  discountValue: '',
  cgst: '',
  sgst: '',
  grandTotal: '',
  tdsAmount: '0',
  upfrontInterest: '0',
});

interface ValidationErrors {
  invoiceNumber?: string;
  dealer?: string;
  dealerCode?: string;
  invoiceDate?: string;
  tenor?: string;
  items?: string;
  [key: string]: string | undefined;
}

function isBankAccountUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

function resolveCreditAccountIdFromOptions(
  creditTo: string | undefined,
  options: Array<{label: string; value: string; accountId?: string}>,
  currentAccountId?: string,
): string | undefined {
  const existing = currentAccountId?.trim();
  if (existing && isBankAccountUuid(existing)) return existing;
  // Non-UUID leftovers (encrypted/plain account numbers mistakenly stored as
  // accountId) must not short-circuit — keep resolving against options.
  const raw = (creditTo || '').trim();
  if (!raw) {
    return existing && isBankAccountUuid(existing) ? existing : undefined;
  }
  const rawDecrypted = (decryptValue(raw) || raw).trim();
  const selected = options.find(opt => {
    const optValue = (opt.value || '').trim();
    const optLabel = (opt.label || '').trim();
    const optDecrypted = (decryptValue(optValue) || optValue).trim();
    return (
      optValue === raw ||
      optLabel === raw ||
      opt.accountId === raw ||
      optDecrypted === raw ||
      optValue === rawDecrypted ||
      optLabel === rawDecrypted ||
      optDecrypted === rawDecrypted
    );
  });
  const fromOption = selected?.accountId?.trim();
  if (fromOption && isBankAccountUuid(fromOption)) return fromOption;
  if (existing && isBankAccountUuid(existing)) return existing;
  return undefined;
}



export const CreateInvoice: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const programSelection = useSelector((state: any) => state.programSelection);

  const resetScreenData = useCallback(() => {
    setFields(getInitialFields());
    setSelectedParticipant(null);
    setSelectedAttachment(null);
    dispatch(resetCreateInvoiceState());
  }, [dispatch]);

  const lastPreviewTokenRef = useRef<number | undefined>();
  // After user confirms Leave/Cancel / success — skip second beforeRemove prompt.
  const allowLeaveRef = useRef(false);

  const clearCreateInvoiceRouteParams = useCallback(() => {
    try {
      (navigation as any).setParams({
        previewFields: undefined,
        previewAttachment: undefined,
        previewReturnToken: undefined,
        freshCreate: undefined,
      });
    } catch {
      // setParams can fail when this screen is not focused
    }
    lastPreviewTokenRef.current = undefined;
  }, [navigation]);

  /** Leave Create → list. Prefer replace so hardware back does not reopen Create + BusyOverlay. */
  const goToInvoiceList = useCallback(
    (refreshList = true) => {
      dispatch(resetCreateInvoiceState());
      dispatch(setLeavingCreateInvoice(false));
      dispatch(setOpeningCreateInvoice(false));
      const params = refreshList ? {refreshList: true} : undefined;
      const nav = navigation as any;
      if (typeof nav.replace === 'function') {
        nav.replace('InvoiceDetails', params);
      } else {
        nav.navigate('InvoiceDetails', params);
      }
    },
    [dispatch, navigation],
  );

  // Permissions refresh on focus only — do NOT flush form here.
  // Leaving Create Invoice is handled by confirmLeaveCreateInvoice /
  // beforeRemove so Preview / camera / picker can return safely.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPermissionsRequest());
    }, [dispatch]),
  );

  const dealerInfo = useSelector(selectDealerInfo);
  const dealerInfoError = useSelector(selectDealerInfoError);
  const createInvoiceLoading = useSelector(selectCreateInvoiceLoading);
  const createInvoiceSuccess = useSelector(selectCreateInvoiceSuccess);
  const createInvoiceError = useSelector(selectCreateInvoiceError);
  const userId = useSelector((s: any) => s.user?.id);
  const userPartyName = useSelector((s: any) => s.user?.party_name as string | null | undefined);
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const permissionsError = useSelector(selectPermissionsError);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';

  const [fields, setFields] = useState<InvoiceFields>(() => getInitialFields());
  const [errors, setErrors] = useState<ValidationErrors>({});
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const [ocrLoading, setOcrLoading] = useState(false);
  const isLeavingCreate = useSelector(selectLeavingCreateInvoice);
  const [ocrStatusText, setOcrStatusText] = useState('Extracting invoice data...');
  const [isOcrPopulated, setIsOcrPopulated] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isOcrUploadModalVisible, setIsOcrUploadModalVisible] = useState(false);
  const [isProofUploadModalVisible, setIsProofUploadModalVisible] = useState(false);
  // Stores the available limit for the specific participant in edit mode.
  // Fetched fresh when invoice details load, matching Web Portal behavior.
  const [apmAvailableLimit, setApmAvailableLimit] = useState<number | null>(null);
  const [selectedParticipant, setSelectedParticipant] =
    useState<DealerInfoParticipant | null>(null);
  const selectedParticipantRef = useRef(selectedParticipant);
  selectedParticipantRef.current = selectedParticipant;

  const effectiveProductCode = useSelector(selectEffectiveProductCode);
  const activeProductId = useSelector(selectActiveProductId);
  const invoiceNo: string | undefined = route?.params?.invoiceNo;
  const mode: 'edit' | 'recreate' | undefined = route?.params?.mode;
  // Product-aware labels (Dealer vs Vendor vs PID): prefer the selected program's
  // own product name, falling back to the active product context.
  const productType = useMemo<InvoiceProductType>(() => {
    const fromProgram = resolveProductCodeFromName(programSelection?.productName);
    const code = fromProgram ?? effectiveProductCode;
    if (code === PRODUCT_CODES.VENDOR_FINANCE) {
      return 'vendor_finance';
    }
    if (code === PRODUCT_CODES.PURCHASE_INVOICE_DISCOUNTING) {
      return 'purchase_invoice_discounting';
    }
    return 'dealer_finance';
  }, [programSelection?.productName, effectiveProductCode]);

  const isVendorFinance = productType === 'vendor_finance';
  const isPid = isPidProductType(productType);

  const creditToOptions = useMemo<CreditToOption[]>(() => {
    // PID: prefer the selected vendor's bank accounts (ProgramVendorBankAccount).
    // DF/VF: program / party bank_details aggregate.
    const details =
      (selectedParticipant?.bank_details &&
      selectedParticipant.bank_details.length > 0
        ? selectedParticipant.bank_details
        : null) ||
      dealerInfo?.bank_details ||
      dealerInfo?.party?.party_bank_details;
    // Dedupe by decrypted account number; prefer rows with a real UUID
    // (party-info bankAccounts.id) — required for DF + VF + PID create alike.
    const byAccount = new Map<string, CreditToOption>();
    for (const b of details ?? []) {
      const rawAccount = String((b as any)?.account_number ?? '');
      const accountNumber = (decryptValue(rawAccount) || rawAccount).trim();
      if (!accountNumber) continue;
      const id = (b as any)?.id != null ? String((b as any).id).trim() : '';
      const accountId = isBankAccountUuid(id)
        ? id
        : id && id !== rawAccount && id !== accountNumber
          ? id
          : undefined;
      const next: CreditToOption = {
        label: accountNumber,
        value: accountNumber,
        accountId,
      };
      const existing = byAccount.get(accountNumber);
      if (
        !existing ||
        (accountId && isBankAccountUuid(accountId) && !existing.accountId)
      ) {
        byAccount.set(accountNumber, next);
      }
    }
    return Array.from(byAccount.values());
  }, [dealerInfo, selectedParticipant]);

  const resolvedCreditAccountId = useMemo(
    () =>
      resolveCreditAccountIdFromOptions(
        fields.creditTo,
        creditToOptions,
        fields.creditToAccountId,
      ),
    [fields.creditTo, fields.creditToAccountId, creditToOptions],
  );

  // Keep creditToAccountId in sync once bank options load (encrypted/raw
  // mismatch used to leave UUID empty even when account number was shown).
  useEffect(() => {
    if (mode === 'edit' || mode === 'recreate') return;
    if (!creditToOptions.length) return;

    if (!fields.creditTo?.trim() && creditToOptions.length === 1) {
      const only = creditToOptions[0];
      if (only?.value) {
        setFields(prev => ({
          ...prev,
          creditTo: only.value,
          creditToAccountId: only.accountId,
        }));
      }
      return;
    }

    const resolved = resolvedCreditAccountId;
    if (resolved && resolved !== fields.creditToAccountId) {
      setFields(prev => ({...prev, creditToAccountId: resolved}));
      // Clear stale field error once UUID is linked (same account already shown).
      setErrors(prev => {
        if (!prev.creditTo) return prev;
        const next = {...prev};
        delete next.creditTo;
        return next;
      });
    }
  }, [
    creditToOptions,
    fields.creditTo,
    fields.creditToAccountId,
    mode,
    resolvedCreditAccountId,
  ]);

  const isFormValid = useMemo(() => {
    const tenorDays = parseInt(String(fields.tenor ?? '').trim(), 10);
    const tenorOk = Number.isFinite(tenorDays) && tenorDays > 0;
    // Unified backend requires credit_to_account_id (UUID) on create for
    // DF + VF alike; edit mode pass-through only, no re-selection needed.
    const creditAccountOk =
      mode === 'edit' ||
      !requiresCreditToAccountId(productType) ||
      !!resolvedCreditAccountId;
    return !!(
      fields.invoiceNumber?.trim() &&
      fields.dealer?.trim() &&
      fields.invoiceDate?.trim() &&
      tenorOk &&
      fields.items &&
      fields.items.length > 0 &&
      fields.creditTo?.trim() &&
      creditAccountOk
    );
  }, [fields, mode, productType, resolvedCreditAccountId]);

  console.log('[CreateInvoice] Render, createInvoiceLoading:', createInvoiceLoading, 'isFormValid:', isFormValid);
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentPickerResponse | null>(null);
  const disabled = useMemo(
    () =>
      createInvoiceLoading || ocrLoading || permissionsLoading || isLeavingCreate,
    [createInvoiceLoading, ocrLoading, permissionsLoading, isLeavingCreate],
  );
  const previewFieldsFromRoute: InvoiceFields | undefined = route?.params?.previewFields;
  const previewAttachmentFromRoute: DocumentPickerResponse | undefined = route?.params?.previewAttachment;
  const previewReturnToken: number | undefined = route?.params?.previewReturnToken;

  const createPermissionKey = useMemo(
    () =>
      productType === 'vendor_finance'
        ? PERMISSIONS.VF_CREATE_INVOICE
        : PERMISSIONS.DF_CREATE_INVOICE,
    [productType],
  );
  const hasCreatePerm =
    useHasPermission(createPermissionKey) ||
    useHasPermission(PERMISSIONS.INVOICE_LIST_CREATE);
  const hasEditPerm = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const hasRecreatePerm = useHasPermission(PERMISSIONS.INVOICE_LIST_RECREATE);
  const hasUploadPerm =
    useHasPermission(PERMISSIONS.INVOICE_LIST_UPLOAD_VERIFY) ||
    useHasPermission(PERMISSIONS.VF_INVOICE_LIST_UPLOAD_VERIFY);
  const hasAttachmentPerm = useHasPermission(PERMISSIONS.INVOICE_LIST_ATTACHMENT);
  // Create Invoice must show "Add Attachments" for DF + VF makers so they can
  // attach the invoice file (web parity). Do not require DF-only
  // upload_verify ∩ attachment — that hid the button for VF and many DF users.
  const canUploadFinal =
    mode === 'edit'
      ? hasAttachmentPerm || hasUploadPerm
      : hasCreatePerm || hasAttachmentPerm || hasUploadPerm;
  const [partyTaxOptions, setPartyTaxOptions] = useState<PartyTaxOption[]>([]);
  /** TDS party-tax config (excluded from GST dropdown). */
  const [tdsTaxConfig, setTdsTaxConfig] = useState<{
    id?: number;
    ratePercent: number;
    threshold: number | null;
  } | null>(null);
  const [ytdInvoiceTotal, setYtdInvoiceTotal] = useState(0);
  const ocrPartyLabels = useMemo(
    () => getOcrPartyLabels(productType),
    [productType],
  );
  const isOcrPrerequisitesMet = useMemo(() => {
    const tenorDays = parseInt(String(fields.tenor ?? '').trim(), 10);
    const creditAccountOk =
      !requiresCreditToAccountId(productType) || !!resolvedCreditAccountId;
    return !!(
      fields.dealer?.trim() &&
      fields.dealerCode?.trim() &&
      fields.odAccountNumber?.trim() &&
      fields.invoiceDate?.trim() &&
      fields.invoiceDueDate?.trim() &&
      Number.isFinite(tenorDays) &&
      tenorDays > 0 &&
      fields.creditTo?.trim() &&
      creditAccountOk
    );
  }, [
    fields.dealer,
    fields.dealerCode,
    fields.odAccountNumber,
    fields.invoiceDate,
    fields.invoiceDueDate,
    fields.tenor,
    fields.creditTo,
    productType,
    resolvedCreditAccountId,
  ]);

  const showOcrPrerequisitesToast = useCallback(() => {
    const missing: string[] = [];
    if (!fields.dealer?.trim()) missing.push(ocrPartyLabels.party);
    if (!fields.dealerCode?.trim()) missing.push(ocrPartyLabels.code);
    if (!fields.odAccountNumber?.trim()) missing.push(ocrPartyLabels.od);
    if (!fields.invoiceDate?.trim()) missing.push('Inv. Date');
    if (!fields.invoiceDueDate?.trim()) missing.push('Due Date');
    const tenorDays = parseInt(String(fields.tenor ?? '').trim(), 10);
    if (!Number.isFinite(tenorDays) || tenorDays <= 0) missing.push('Tenor');
    if (!fields.creditTo?.trim()) {
      missing.push('Credit To');
    } else if (
      requiresCreditToAccountId(productType) &&
      !resolvedCreditAccountId
    ) {
      missing.push('Valid Credit To account');
    }

    Toast.show({
      type: 'info',
      text1: 'Fill required fields before OCR',
      text2: `Missing: ${missing.join(', ')}`,
      visibilityTime: 4500,
    });
  }, [
    fields.dealer,
    fields.dealerCode,
    fields.odAccountNumber,
    fields.invoiceDate,
    fields.invoiceDueDate,
    fields.tenor,
    fields.creditTo,
    ocrPartyLabels,
    productType,
    resolvedCreditAccountId,
  ]);

  const isOcrTemporarilyDisabled = false;

  const loadPartyTaxes = useCallback(() => {
    const programId = String(programSelection?.programId || '').trim();
    if (!programId) {
      setPartyTaxOptions([]);
      setTdsTaxConfig(null);
      return;
    }

    invoiceApi
      .getProgramInvoiceTaxes(programId)
      .then(async taxes => {
        const gstOptions: PartyTaxOption[] = [];
        let tdsCandidate: {
          id?: number;
          ratePercent: number;
          threshold: number | null;
        } | null = null;

        for (const t of taxes) {
          const isTds =
            isTdsPartyTaxName(t.name) || !!t.section_nature?.id;
          if (isTds) {
            if (!tdsCandidate) {
              tdsCandidate = {
                id: t.id,
                ratePercent: Number(t.value) || 0,
                threshold:
                  t.threshold != null && Number.isFinite(Number(t.threshold))
                    ? Number(t.threshold)
                    : null,
              };
            }
            continue;
          }
          gstOptions.push({
            label: t.name,
            value: t.name,
            percentage: Number(t.value) || 0,
            id: t.id,
            sectionNatureId: t.section_nature?.id ?? null,
            threshold: t.threshold ?? null,
            isTds: false,
          });
        }

        // Fallback detail fetch when list omits TDS threshold (legacy party/tax API).
        if (
          tdsCandidate?.id != null &&
          (tdsCandidate.threshold == null || !Number.isFinite(tdsCandidate.threshold))
        ) {
          try {
            const detail = await invoiceApi.getPartyTaxById(tdsCandidate.id);
            if (detail?.threshold != null) {
              tdsCandidate.threshold = Number(detail.threshold);
            }
            if (detail?.value != null) {
              tdsCandidate.ratePercent = Number(detail.value) || tdsCandidate.ratePercent;
            }
          } catch {
            // keep list values
          }
        }

        setPartyTaxOptions(gstOptions);
        setTdsTaxConfig(tdsCandidate);
      })
      .catch(() => {
        setPartyTaxOptions([]);
        setTdsTaxConfig(null);
      });
  }, [programSelection?.programId]);

  useFocusEffect(
    useCallback(() => {
      loadPartyTaxes();
    }, [loadPartyTaxes]),
  );

  // FY YTD sub_total for TDS threshold (same party as create payload).
  useEffect(() => {
    const partyId = String(dealerInfo?.party?.id || '').trim();
    if (!partyId) {
      setYtdInvoiceTotal(0);
      return;
    }
    let cancelled = false;
    invoiceApi
      .getPartyInvoicesTotal(partyId)
      .then(total => {
        if (!cancelled) setYtdInvoiceTotal(total);
      })
      .catch(() => {
        if (!cancelled) setYtdInvoiceTotal(0);
      });
    return () => {
      cancelled = true;
    };
  }, [dealerInfo?.party?.id]);

  const isVendorFinanceUpfront =
    isVendorFinance &&
    String(dealerInfo?.interest_charge_type || '').trim().toLowerCase() ===
      'upfront';

  // Client-confirmed VF Upfront: TDS excludes GST; preserve existing base for other flows.
  const invoiceTotals = useMemo(
    () =>
      computeCreateInvoiceTotals({
        items: fields.items,
        fieldsTax: {
          cgst: fields.cgst,
          sgst: fields.sgst,
          taxTotal: fields.taxTotal,
        },
        productType,
        isVendorFinanceUpfront,
        tdsRatePercent: tdsTaxConfig?.ratePercent,
        tdsThreshold: tdsTaxConfig?.threshold,
        ytdInvoiceTotal,
      }),
    [
      fields.items,
      fields.cgst,
      fields.sgst,
      fields.taxTotal,
      productType,
      tdsTaxConfig,
      ytdInvoiceTotal,
      isVendorFinanceUpfront,
    ],
  );

  // VF Upfront AI = (Invoice Amount − TDS) × ROI% × (Tenor/365).
  const advanceInterestInfo = useMemo(
    () =>
      computeVendorFinanceAdvanceInterest({
        isVendorFinance,
        interestChargeType: dealerInfo?.interest_charge_type,
        subTotal: invoiceTotals.subTotal,
        discountTotal: invoiceTotals.discountTotal,
        taxTotal: invoiceTotals.taxTotal,
        tdsAmount: invoiceTotals.tds,
        roiPercent: extractRoiPercent(selectedParticipant?.interest_parameters),
        tenorDays: fields.tenor,
      }),
    [
      isVendorFinance,
      dealerInfo?.interest_charge_type,
      invoiceTotals.subTotal,
      invoiceTotals.discountTotal,
      invoiceTotals.taxTotal,
      invoiceTotals.tds,
      selectedParticipant,
      fields.tenor,
    ],
  );

  const showAdvanceInterest = advanceInterestInfo.chargeApplies;

  useEffect(() => {
    const nextTds = invoiceTotals.tds.toFixed(2);
    const nextAdvanceInterest = advanceInterestInfo.chargeApplies
      ? advanceInterestInfo.advanceInterest
      : 0;
    const nextNet = computeInvoiceNetTotal(
      invoiceTotals.subTotal,
      invoiceTotals.discountTotal,
      invoiceTotals.taxTotal,
      invoiceTotals.tds,
      nextAdvanceInterest,
    ).toFixed(2);

    const currentAdvanceInterest = parseFloat(fields.upfrontInterest || '0') || 0;

    if (
      fields.tdsAmount === nextTds &&
      fields.grandTotal === nextNet &&
      currentAdvanceInterest === nextAdvanceInterest
    ) {
      return;
    }

    setFields(prev => ({
      ...prev,
      tdsAmount: nextTds,
      upfrontInterest: nextAdvanceInterest.toFixed(2),
      grandTotal: nextNet,
    }));
  }, [
    invoiceTotals,
    advanceInterestInfo,
    fields.tdsAmount,
    fields.upfrontInterest,
    fields.grandTotal,
  ]);

  // Determine required permission based on mode
  const hasRequiredPerm = () => {
    if (mode === 'edit') {
      return hasEditPerm;
    } else if (mode === 'recreate') {
      return hasRecreatePerm;
    } else {
      return hasCreatePerm;
    }
  };

  const headerModeTitle = mode === 'edit' ? "Invoice Details [Edit Invoice]" : "Invoice Details";

  // Role-based access control: Prevent checkers from accessing Create Invoice screen
  useEffect(() => {
    if (isAnchorChecker || isDealerChecker) {
      Alert.alert(
        'Access Denied',
        'Checker roles cannot create invoices. You can only approve/reject invoices.',
        [
          {
            text: 'OK',
            onPress: () => {
              (navigation as any).navigate('InvoiceDetails');
            },
          },
        ],
      );
    }
  }, [isAnchorChecker, isDealerChecker, navigation]);

  // Program-level role normalization (e.g., "Anchor Maker" -> "anchor_maker")
  const programRoleKey = useMemo(() => {
    const rawRole = programSelection?.role;
    if (!rawRole) return null;
    const normalizedRole = rawRole.toLowerCase().trim().replace(/\s+/g, '_');
    if (normalizedRole === 'vendor_maker') return 'dealer_maker';
    if (normalizedRole === 'vendor_checker') return 'dealer_checker';
    return normalizedRole as AppRole;
  }, [programSelection?.role]);

  // Method-based access control: Push-Pull logic
  const programMethod = programSelection?.method;
  const isAllowedForMethod = useMemo(() => {
    // If we are editing an existing invoice, we allow it (matching Web behavior)
    if (mode === 'edit') return true;

    // Priority: Program-specific role > Global user role
    const effectiveRole = programRoleKey || userRole;
    if (!programMethod || !effectiveRole) return true;

    // Checkers are never allowed to create
    if (effectiveRole === 'anchor_checker' || effectiveRole === 'dealer_checker') return false;

    // Push -> Only Anchor Maker
    if (programMethod === 'Push') return effectiveRole === 'anchor_maker';
    // Pull -> Only Dealer Maker
    if (programMethod === 'Pull') return effectiveRole === 'dealer_maker';
    
    return true;
  }, [programMethod, userRole, programRoleKey, mode]);

  useEffect(() => {
    if (mode !== 'edit' && programSelection?.programId && !isAllowedForMethod && !permissionsLoading) {
      const effectiveRole = programRoleKey || userRole;
      const roleLabel = ROLE_LABELS[effectiveRole as AppRole] || effectiveRole || 'User';
      
      Alert.alert(
        'Method Mismatch',
        `You are not allowed to create invoices for a ${programMethod} program as a ${roleLabel}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              (navigation as any).navigate('InvoiceDetails');
            },
          },
        ],
      );
    }
  }, [isAllowedForMethod, programSelection?.programId, programMethod, userRole, programRoleKey, permissionsLoading, navigation]);

  // Permission validation for Create/Edit Invoice
  useEffect(() => {
    if (!permissionsLoading && !hasRequiredPerm()) {
      const actionName = mode === 'edit' ? 'edit' : mode === 'recreate' ? 'recreate' : 'create';
      Alert.alert(
        'Access Denied',
        `You do not have permission to ${actionName} an invoice. Please contact your administrator.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Safely navigate back - if canGoBack, use goBack, otherwise navigate to InvoiceDetails
              if ((navigation as any).canGoBack?.()) {
                (navigation as any).goBack();
              } else {
                (navigation as any).navigate('InvoiceDetails');
              }
            },
          },
        ],
      );
      
      // Optional: Automatically navigate the user back after 3 seconds
      const timer = setTimeout(() => {
        if ((navigation as any).canGoBack?.()) {
          (navigation as any).goBack();
        } else {
          (navigation as any).navigate('InvoiceDetails');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [permissionsLoading, hasCreatePerm, hasEditPerm, hasRecreatePerm, mode, navigation]);

  // Handle Permissions API Error
  useEffect(() => {
    if (permissionsError) {
      Alert.alert('Error', 'Failed to verify permissions. Please try again.');
    }
  }, [permissionsError]);
  
  // Fetch dealer info and bank list when program is selected
  useEffect(() => {
    const programId = programSelection?.programId;
    if (programId) {
      dispatch(fetchDealerInfoRequest(programId));
    }
  }, [programSelection?.programId, dispatch]);

  // Toast: removed debug program selection toasts
  useEffect(() => {
    // Debug toasts removed for better UX
  }, [programSelection?.programId]);

  // Toast: removed debug dealer info toasts
  useEffect(() => {
    if (dealerInfo) {
      // Debug toasts removed for better UX
    }
  }, [dealerInfo]);

  useEffect(() => {
    if (dealerInfoError) {
      Toast.show({
        type: 'error',
        text1: 'Dealer info failed',
        text2: dealerInfoError,
      });
    }
  }, [dealerInfoError]);

  // Restore form when returning from preview (Close X on preview page).
  // Apply once per previewReturnToken — stale route params must not re-fill
  // after Leave & Clear.
  useEffect(() => {
    if (route?.params?.freshCreate) return;
    if (!previewReturnToken) return;
    if (lastPreviewTokenRef.current === previewReturnToken) return;
    lastPreviewTokenRef.current = previewReturnToken;
    if (previewFieldsFromRoute) setFields(previewFieldsFromRoute);
    if (previewAttachmentFromRoute) setSelectedAttachment(previewAttachmentFromRoute);
    if (previewFieldsFromRoute?.dealer && dealerInfo?.participants?.length) {
      const participant = dealerInfo.participants.find(p => {
        const pName = p.party?.entity_name || '';
        const decryptedPName = decryptValue(pName);
        return pName === previewFieldsFromRoute.dealer || decryptedPName === previewFieldsFromRoute.dealer;
      });
      if (participant) setSelectedParticipant(participant);
    }
  }, [
    previewReturnToken,
    previewFieldsFromRoute,
    previewAttachmentFromRoute,
    dealerInfo?.participants,
    route?.params?.freshCreate,
  ]);

  // Fetch invoice details when in 'edit' or 'recreate' mode
  useEffect(() => {
    if ((mode !== 'edit' && mode !== 'recreate') || !route?.params?.invoiceId) return;

    let cancelled = false;
    setOcrLoading(true);
    invoiceApi
      .getInvoiceDetails(route.params.invoiceId)
      .then((res: any) => {
        if (cancelled || !res) return;
        const data = res;
        const apm = data.anchorParticipantMapping;
        const pvd = data.programVendorDetails;
        const productName = String(
          data.product?.name ||
            data.program?.productConfig?.product?.name ||
            data.product_name ||
            '',
        );
        const isPidInvoice =
          !!pvd?.id ||
          /purchase\s*invoice\s*discounting/i.test(productName);

        // Edit/recreate: PID uses programVendorDetails; DF/VF use APM.
        const rawDealerEntityName = isPidInvoice
          ? pvd?.vendor_name ||
            data.counter_party_name ||
            ''
          : apm?.party?.entity_name || data.counter_party_name || '';
        const decryptedDealerName =
          decryptValue(rawDealerEntityName) || rawDealerEntityName;
        const dealerCode = isPidInvoice
          ? pvd?.vendor_code ||
            data.counter_party_code ||
            ''
          : apm?.company_code_given_by_party || data.counter_party_code || '';
        const programLoanAccount = String(
          data.program?.basic_parameters?.loan_account_no ||
            (typeof data.program?.basic_parameters === 'object'
              ? (data.program.basic_parameters as any)?.loan_account_no
              : '') ||
            '',
        );
        const odAccountNumber = isPidInvoice
          ? decryptValue(programLoanAccount) ||
            programLoanAccount ||
            decryptValue(data.counter_party_od_account ?? '') ||
            data.counter_party_od_account ||
            ''
          : decryptValue(apm?.od_account_no ?? '') ||
            apm?.od_account_no ||
            '';

        const mappedItems: InvoiceLineItem[] = (data.invoiceItems || []).map(
          (item: any) => ({
            id: item.id,
            itemName: item.name || '',
            description: item.description || '',
            quantity: String(item.quantity || '0'),
            unit: item.unit || 'PCS',
            pricePerQuantity: String(item.price_per_quantity || '0'),
            total: String(item.total || '0'),
            // Normalize discount_type: convert 'absolute' to 'value' for the dropdown
            discountType: item.discount_type === 'absolute' ? 'value' : (item.discount_type || ''),
            discountValue: String(item.discount_value || '0'),
            discountAmount: String(item.discount_amount || '0'),
            taxes: (item.taxes || []).map((t: any) => ({
              taxType: t.tax_type || 'GST',
              taxPercentage: String(t.tax_percentage || '0'),
              taxAmount: String(t.tax_amount || '0'),
            })),
          }),
        );

        const bankDetails = data.program?.bank_details;
        const rawCreditAccount =
          data.creditToBankAccount?.accountNumber ||
          data.creditToBankAccount?.account_number ||
          (Array.isArray(bankDetails)
            ? bankDetails[0]?.account_number
            : bankDetails?.account_number) ||
          data.credit_to ||
          '';
        const creditToAccount = rawCreditAccount
          ? decryptValue(String(rawCreditAccount)) || String(rawCreditAccount)
          : '';

        const nextFields: InvoiceFields = {
          ...getInitialFields(),
          dealer: decryptedDealerName,
          dealerCode,
          odAccountNumber,
          invoiceNumber: data.invoice_ref_no || '',
          associatedPO: data.po_ref_no != null ? String(data.po_ref_no) : '',
          tenor:
            data.tenor != null && data.tenor !== ''
              ? String(Math.round(Number(data.tenor)))
              : '',
          invoiceDate: formatApiInvoiceDate(data.invoice_date),
          paymentDate: formatApiInvoiceDate(data.payment_date),
          invoiceDueDate: formatApiInvoiceDate(data.invoice_due_date),
          grnDate: formatApiInvoiceDate(data.grn_date),
          remark: data.remark || '',
          currency: data.currency || 'INR',
          creditTo: creditToAccount,
          // Pass-through UUID so update keeps the existing credit-to account
          // (unified backend `updateInvoice.dto` accepts it optionally).
          creditToAccountId: data.credit_to_account_id || undefined,
          items: mappedItems,
          discountValue: String(data.discount_total || '0'),
          grandTotal: String(data.final_total || '0'),
          tdsAmount: String(data.tds_amount ?? '0'),
          upfrontInterest: String(data.upfront_interest ?? '0'),
          attachments: (data.attachment || []).map((a: any) => ({
            id: a.id,
            attachment_url: a.attachment_url,
          })),
        };

        setFields(nextFields);

        // Update flat program fields so dealerInfo can be fetched.
        // Use setProgramSelection (not toggleProgramSelection) so selectedPrograms
        // is NOT updated — this keeps the breadcrumb in its previous state and
        // allows the beforeRemove reset to 'all' to work correctly on back.
        if (data.program?.id) {
          dispatch(
            toggleProgramSelection({
              programId: data.program?.id || '',
              programName: data.program?.program_name || data.program_name || '',
              bankId: data.program?.productConfig?.partnerBank?.id || data.partnerBank?.id || '',
              bankName: data.program?.productConfig?.partnerBank?.bank_name || data.bank_name || data.partnerBank?.bank_name || '',
              productId: data.program?.productConfig?.product?.id || '',
              productName: data.program?.productConfig?.product?.name || data.product_name || '',
              partyId: data.party?.id || '',
              userType: (data.program?.productConfig?.product?.name || data.product_name || '').toLowerCase().includes('dealer') ? 'dealer' : 'vendor',
              method: data.program?.method || null,
              role: data.program?.role || null,
              status: data.program?.status || null,
              approvalLevel: null
            }),
          );
        }

        // Fetch fresh dealerInfo for this program to get accurate available limit.
        // Available limit = sanctioned - utilized - pipeline_requests (matches backend).
        if (data.program?.id) {
          invoiceApi.getDealerInfo(data.program.id)
            .then((dealerRes: any) => {
              const participants = dealerRes?.data?.participants || dealerRes?.participants || [];
              const apmId = isPidInvoice ? pvd?.id : apm?.id;
              const apmCode = isPidInvoice
                ? pvd?.vendor_code
                : apm?.company_code_given_by_party;

              const matchedP = participants.find((p: any) => {
                const pIdMatch = p.id && apmId && String(p.id) === String(apmId);
                const partyIdMatch =
                  !isPidInvoice &&
                  p.party?.id &&
                  apm?.party?.id &&
                  String(p.party.id) === String(apm.party.id);
                const codeMatch =
                  p.company_code &&
                  (isPidInvoice
                    ? pvd?.vendor_code &&
                      String(p.company_code) === String(pvd.vendor_code)
                    : apm?.company_code &&
                      String(p.company_code) === String(apm.company_code));
                const givenCodeMatch =
                  p.company_code_given_by_party &&
                  apmCode &&
                  String(p.company_code_given_by_party) === String(apmCode);
                const nameMatch = p.party?.entity_name && (
                  decryptValue(p.party.entity_name) === decryptedDealerName ||
                  p.party.entity_name === rawDealerEntityName
                );
                
                return pIdMatch || partyIdMatch || codeMatch || givenCodeMatch || nameMatch;
              });

              if (!matchedP) {
                console.log('[EditMode] Matching failed. Diagnostic info:', {
                  apmId,
                  apmCode,
                  rawDealerEntityName,
                  decryptedDealerName,
                  participantCount: participants.length,
                  firstParticipantSample: participants[0] ? {
                    id: participants[0].id,
                    code: participants[0].company_code,
                    givenCode: participants[0].company_code_given_by_party,
                    partyId: participants[0].party?.id,
                    partyName: participants[0].party?.entity_name
                  } : 'none'
                });
              }

              if (matchedP) {
                const availableLimit = getParticipantAvailableLimit(matchedP);
                setApmAvailableLimit(availableLimit);
                setSelectedParticipant(matchedP);
                console.log(
                  '[EditMode] availableLimit calculated:',
                  availableLimit,
                  'for participant:',
                  matchedP.id,
                );
              } else {
                // Participant not found in fresh dealerInfo — use 0 to be safe (will block if invoice total > 0)
                setApmAvailableLimit(0);
                console.warn('[EditMode] Participant not found in fresh dealerInfo, defaulting availableLimit to 0');
              }
            })
            .catch((err: any) => {
              console.warn('[EditMode] Failed to fetch fresh dealerInfo for limit check:', err);
              setApmAvailableLimit(null); // null = unknown, won't block
            });
        }

        return () => {
          cancelled = true;
        };
      })
      .catch(err => {
        Alert.alert('Error', 'Failed to fetch invoice details for editing.');
        console.error('Fetch edit details error:', err);
      })
      .finally(() => {
        if (!cancelled) setOcrLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, route?.params?.invoiceId, dealerInfo?.participants]);

  // Handle create invoice success / error
  useEffect(() => {
    if (createInvoiceSuccess) {
      dispatch(resetCreateInvoiceState());
      setFields(getInitialFields());
      setSelectedParticipant(null);
      setSelectedAttachment(null);
      setIsOcrPopulated(false);
      setShowCamera(false);
      setIsOcrUploadModalVisible(false);
      setIsProofUploadModalVisible(false);
      setOcrLoading(false);
      Alert.alert(
        'Success',
        mode === 'edit'
          ? 'Invoice updated successfully.'
          : 'Invoice created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              allowLeaveRef.current = true;
              goToInvoiceList(true);
            },
          },
        ],
      );
    }
  }, [createInvoiceSuccess, dispatch, goToInvoiceList, mode]);

  useEffect(() => {
    if (createInvoiceError) {
      Alert.alert('Error', createInvoiceError, [
        {text: 'OK', onPress: () => dispatch(resetCreateInvoiceState())},
      ]);
    }
  }, [createInvoiceError, dispatch]);

  // Ensure currency is always INR
  useEffect(() => {
    if (!fields.currency || fields.currency !== 'INR') {
      setFields(prev => ({...prev, currency: 'INR'}));
    }
  }, [fields.currency]);

  // Validation function. Optional fieldState lets applyPatch validate against
  // the in-flight merged fields (creditTo + creditToAccountId same patch).
  const validateField = (
    fieldName: keyof InvoiceFields,
    value: any,
    fieldState: InvoiceFields = fields,
  ): string | undefined => {
    switch (fieldName) {
      case 'odAccountNumber':
        if (programSelection?.method?.toLowerCase() === 'pull' && !value?.trim()) {
          return 'OD Account No is required for Pull method programs';
        }
        return undefined;
      case 'invoiceNumber':
        if (!value?.trim()) {
          return 'Invoice / Unique Ref. No is required';
        }
        return undefined;
      case 'dealer':
        if (!value?.trim()) {
          return `${ocrPartyLabels.party} Name is required`;
        }
        return undefined;
      case 'dealerCode':
        if (!value?.trim()) {
          return `${ocrPartyLabels.code} is required`;
        }
        return undefined;
      case 'invoiceDate':
        if (!value?.trim()) {
          return 'Invoice Date is required';
        }
        return undefined;
      case 'tenor': {
        const n = parseInt(String(value ?? '').trim(), 10);
        if (!String(value ?? '').trim()) {
          return 'Tenor (days) is required';
        }
        if (!Number.isFinite(n) || n <= 0) {
          return 'Enter a valid tenor greater than zero';
        }
        return undefined;
      }
      case 'invoiceDueDate':
        if (!value?.trim()) {
          return 'Invoice Due Date is required';
        }
        return undefined;
      case 'paymentDate':
        return undefined;
      case 'creditTo':
        if (!value?.trim()) {
          return 'Credit To is required';
        }
        // Unified backend requires credit_to_account_id (UUID) on create.
        // Use fieldState so a same-patch creditToAccountId is not ignored.
        if (
          mode !== 'edit' &&
          requiresCreditToAccountId(productType) &&
          !resolveCreditAccountIdFromOptions(
            String(value || ''),
            creditToOptions,
            fieldState.creditToAccountId,
          )
        ) {
          return 'Please select a valid Credit To account from the list';
        }
        return undefined;
      case 'items':
        if (!value || value.length === 0) {
          return 'At least one item is required';
        }
        // Validate each item
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (!item.itemName?.trim()) {
            return `Item ${i + 1}: Item Name is required`;
          }
          if (!item.quantity?.trim() || parseFloat(item.quantity) <= 0) {
            return `Item ${i + 1}: Valid Quantity is required`;
          }
          if (!item.unit?.trim()) {
            return `Item ${i + 1}: Unit is required`;
          }
          if (!item.pricePerQuantity?.trim() || parseFloat(item.pricePerQuantity) <= 0) {
            return `Item ${i + 1}: Valid Price is required`;
          }
          // Discount is now optional
          /*
          if (!item.discountType?.trim()) {
            return `Item ${i + 1}: Discount Type is required`;
          }
          if (!item.discountValue?.trim()) {
            return `Item ${i + 1}: Discount Value is required`;
          }
          */
          const hasValidTaxInArray = Array.isArray(item.taxes)
            ? item.taxes.some(
                (t: any) =>
                  t?.taxType?.trim() &&
                  t?.taxPercentage?.toString().trim() &&
                  Number(t.taxPercentage) >= 0,
              )
            : false;
          const hasLegacyTax =
            item.taxType?.trim() &&
            item.taxPercentage?.toString().trim() &&
            Number(item.taxPercentage) >= 0;
          if (!hasValidTaxInArray && !hasLegacyTax) {
            return `Item ${i + 1}: Tax details are required`;
          }
        }
        return undefined;
      default:
        return undefined;
    }
  };

  // Validate all fields in order of appearance
  const validateForm = (returnFirstOnly = false): {isValid: boolean; firstError?: string; errors: ValidationErrors} => {
    const newErrors: ValidationErrors = {};
    let firstError: string | undefined;

    const validationOrder: string[] = [
      'dealer',
      'dealerCode',
      'odAccountNumber',
      'invoiceNumber',
      'invoiceDate',
      'tenor',
      'invoiceDueDate',
      'creditTo',
      'items',
    ];

    if (canUploadFinal) {
      validationOrder.push('attachment');
    }

    for (const field of validationOrder) {
      let error: string | undefined;
      
      if (field === 'attachment') {
        const hasAnyAttachmentForValidation = !!selectedAttachment || (fields.attachments && fields.attachments.length > 0);
        if (!hasAnyAttachmentForValidation) {
           error = 'Please upload the invoice file';
        }
      } else {
        error = validateField(field as keyof InvoiceFields, fields[field as keyof InvoiceFields]);
      }

      if (error) {
        newErrors[field] = error;
        if (!firstError) firstError = error;
        if (returnFirstOnly) break;
      }
    }
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstError,
      errors: newErrors,
    };
  };

  const applyPatch = (patch: Partial<InvoiceFields>) => {
    if (patch.currency && patch.currency !== 'INR') patch.currency = 'INR';
    if (patch.dealer && dealerInfo?.participants) {
      const participant = dealerInfo.participants.find(p => {
        const raw = p.party?.entity_name ?? '';
        const decrypted = decryptValue(raw) || raw;
        return decrypted === patch.dealer || raw === patch.dealer;
      });
      if (participant) {
        patch.dealerCode = decryptValue(participant.company_code ?? '') || participant.company_code;
        patch.odAccountNumber =
          decryptValue(participant.od_account_no ?? '') ||
          participant.od_account_no ||
          String((dealerInfo?.basic_parameters as any)?.loan_account_no || '');
        if (isPid && mode !== 'edit' && mode !== 'recreate') {
          // Vendor banks differ per PID vendor — clear prior Credit To.
          patch.creditTo = '';
          patch.creditToAccountId = undefined;
        }
        if (mode !== 'edit' && mode !== 'recreate') {
          // Try participant-level default first, then program-level
          const participantDefaultTerms = Number(
            (participant as any)?.default_payment_terms_days ??
            (participant as any)?.basic_parameters?.default_payment_terms_days,
          );
          const programDefaultTerms = Number(
            dealerInfo?.basic_parameters?.default_payment_terms_days,
          );
          const nextTenor =
            Number.isFinite(participantDefaultTerms) && participantDefaultTerms > 0
              ? Math.round(participantDefaultTerms)
              : Number.isFinite(programDefaultTerms) && programDefaultTerms > 0
                ? Math.round(programDefaultTerms)
                : undefined;
          // Always update tenor when dealer changes (even if same program)
          patch.tenor = nextTenor ? String(nextTenor) : '';
        }
        setSelectedParticipant(participant);
      } else if (patch.dealer && mode !== 'edit' && mode !== 'recreate') {
        // Participant not found in list — reset tenor to program default
        const programDefaultTerms = Number(dealerInfo?.basic_parameters?.default_payment_terms_days);
        patch.tenor = Number.isFinite(programDefaultTerms) && programDefaultTerms > 0
          ? String(Math.round(programDefaultTerms))
          : '';
      }
    }
    setFields(prev => {
      const updated = {...prev, ...patch};
      const newErrors = {...errors};
      Object.keys(patch).forEach(key => {
        const fieldName = key as keyof InvoiceFields;
        const error = validateField(fieldName, updated[fieldName], updated);
        if (error) newErrors[fieldName] = error;
        else delete newErrors[fieldName];
      });
      // Selecting Credit To also sets creditToAccountId — re-check creditTo
      // so a prior "valid account" error clears once UUID is linked.
      if (
        patch.creditToAccountId !== undefined &&
        patch.creditTo === undefined &&
        updated.creditTo
      ) {
        const creditErr = validateField('creditTo', updated.creditTo, updated);
        if (creditErr) newErrors.creditTo = creditErr;
        else delete newErrors.creditTo;
      }
      setErrors(newErrors);
      return updated;
    });
  };

  const openUploadPreview = useCallback(
    (
      previewFields: InvoiceFields,
      previewAttachment?: DocumentPickerResponse | null,
    ) => {
      const participant = selectedParticipantRef.current;
      // Snapshot + fill gaps from selected participant so preview never shows
      // empty dealer/OD when the form had them (DF + VF alike).
      const dealerFromParticipant =
        decryptValue(participant?.party?.entity_name ?? '') ||
        participant?.party?.entity_name ||
        '';
      const codeFromParticipant =
        decryptValue(participant?.company_code ?? '') ||
        participant?.company_code ||
        decryptValue(participant?.company_code_given_by_party ?? '') ||
        participant?.company_code_given_by_party ||
        '';
      const odFromParticipant =
        decryptValue(participant?.od_account_no ?? '') ||
        participant?.od_account_no ||
        '';

      const snapshot: InvoiceFields = {
        ...previewFields,
        items: (previewFields.items || []).map(item => ({
          ...item,
          taxes: item.taxes ? item.taxes.map(t => ({...t})) : undefined,
        })),
        dealer: previewFields.dealer?.trim() || dealerFromParticipant,
        dealerCode: previewFields.dealerCode?.trim() || codeFromParticipant,
        odAccountNumber:
          previewFields.odAccountNumber?.trim() || odFromParticipant,
      };

      // Web Party Details parity (Push vs Pull):
      // Pull (VF vendor / DF dealer maker): party-info / form dealer = Anchor;
      //   counterparty = logged-in party.
      // Push (Anchor maker): party-info = Anchor; selected participant = counterparty.
      const isPullMethod =
        String(programSelection?.method || '').toLowerCase() === 'pull';
      const partyInfoAnchor =
        decryptValue(dealerInfo?.party?.entity_name ?? '') ||
        dealerInfo?.party?.entity_name ||
        '';
      const formDealerName = snapshot.dealer?.trim() || '';
      const formDealerCode = snapshot.dealerCode?.trim() || '';
      const loggedInCounterparty =
        decryptValue(userPartyName || '') || userPartyName || '';

      const previewAnchorName = isPullMethod
        ? formDealerName || partyInfoAnchor
        : partyInfoAnchor || formDealerName;
      const previewCounterPartyName = isPullMethod
        ? loggedInCounterparty || dealerFromParticipant
        : formDealerName || dealerFromParticipant;
      const previewCounterPartyCode = formDealerCode || codeFromParticipant;

      (navigation as any).navigate('InvoiceUploadPreview', {
        previewFields: snapshot,
        previewAttachment: previewAttachment || undefined,
        previewAnchorName,
        previewCounterPartyName,
        previewCounterPartyCode,
        productType,
        previewInvoiceStatus: 'Draft',
        previewApprovalStatus: expectedNextApprovalAfterCreate({
          method: programSelection?.method,
          isVendorFinance: productType === 'vendor_finance',
          userRole,
        }),
        advanceInterestBreakdown: advanceInterestInfo.chargeApplies
          ? advanceInterestInfo
          : null,
        roiPercent: extractRoiPercent(selectedParticipant?.interest_parameters),
      });
    },
    [
      navigation,
      dealerInfo?.party?.entity_name,
      productType,
      userRole,
      advanceInterestInfo,
      programSelection?.method,
      userPartyName,
      selectedParticipant,
    ],
  );

  const handleInvoicePreview = useCallback(() => {
    openUploadPreview(fieldsRef.current, selectedAttachment);
  }, [openUploadPreview, selectedAttachment]);

  // Preview is lighter than Submit: Party + Invoice Date + ≥1 item.
  // Attachment / tenor / credit-to are NOT required to open preview.
  const canPreviewInvoice = useMemo(() => {
    const hasParty = !!fields.dealer?.trim();
    const hasInvoiceDate = !!fields.invoiceDate?.trim();
    const hasItems = Array.isArray(fields.items) && fields.items.length > 0;
    return hasParty && hasInvoiceDate && hasItems;
  }, [fields.dealer, fields.invoiceDate, fields.items]);

  const previewDisabledReasonInternal = useMemo(() => {
    if (!fields.dealer?.trim()) {
      return isPid || productType === 'vendor_finance'
        ? 'Please select Party (Anchor/Vendor) to preview'
        : 'Please select Dealer / Party to preview';
    }
    if (!fields.invoiceDate?.trim()) {
      return 'Please enter Invoice Date to preview';
    }
    if (!fields.items || fields.items.length === 0) {
      return 'Please add at least one item to preview';
    }
    return undefined;
  }, [fields.dealer, fields.invoiceDate, fields.items, productType]);

  const handleProofUploadFile = async (
    file: DocumentPickerResponse | undefined,
  ) => {
    if (!file) return;
    setSelectedAttachment(file);
    // Always read latest form via ref — avoids stale empty header fields
    // after camera/picker briefly blurred this screen.
    openUploadPreview(fieldsRef.current, file);
  };

  const openCamera = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) {
      return Alert.alert('Permission Required', 'Camera permission is needed to capture invoices.');
    }
    setShowCamera(true);
  };

  const handleOcrCapturePress = async () => {
    if (!isOcrPrerequisitesMet) {
      showOcrPrerequisitesToast();
      return;
    }
    await openCamera();
  };

  const handleOcrUploadPress = () => {
    if (!isOcrPrerequisitesMet) {
      showOcrPrerequisitesToast();
      return;
    }
    setIsOcrUploadModalVisible(true);
  };

  const handleGeminiOcrRetry = useCallback((event: GeminiRetryEvent) => {
    const {failedAttempt, nextAttempt, maxAttempts} = event;
    setOcrStatusText(`Retrying attempt ${nextAttempt} of ${maxAttempts}...`);
    Toast.show({
      type: 'info',
      text1: 'Gemini AI OCR',
      text2: `Attempt ${failedAttempt} failed. Retrying (${nextAttempt}/${maxAttempts})...`,
      visibilityTime: 3500,
    });
  }, []);

  const runOcrAndPatchForm = async (uriOrPath: string | null) => {
    if (!uriOrPath) return;
    try {
      setOcrLoading(true);
      setOcrStatusText('Extracting invoice data...');
      const {gstInvoice} = await runGSTInvoiceExtractionWithAI(uriOrPath, {
        onRetry: handleGeminiOcrRetry,
      });
      const header = gstInvoice?.invoice_header;
      const summary = gstInvoice?.financial_summary;
      const gstLineItems = gstInvoice?.line_items ?? [];
      const extractedItems =
        gstLineItems.length > 0 ? convertOcrLineItems(gstLineItems) : [];
      let cgst = '';
      let sgst = '';
      let taxTotal = '';
      let grandTotal = '';
      if (summary) {
        const cgstAmt = summary.total_cgst_amount || 0;
        const sgstAmt = summary.total_sgst_amount || 0;
        const hasIgst = gstLineItems.some(
          line => (line.tax_type || '').toUpperCase() === 'IGST',
        );
        if (cgstAmt > 0 || sgstAmt > 0) {
          cgst = cgstAmt > 0 ? cgstAmt.toFixed(2) : '';
          sgst = sgstAmt > 0 ? sgstAmt.toFixed(2) : '';
        } else if (gstLineItems.some(
          line => (line.tax_type || '').toUpperCase() === 'GST'
          && (line.tax_amount || 0) > 0
        )) {
          // Invoice uses "GST" type (not split CGST/SGST)
          const totalGST = gstLineItems.reduce(
            (s, line) => s + ((line.tax_type || '').toUpperCase() === 'GST'
              ? (line.tax_amount || 0) : 0), 0,
          );
          if (totalGST > 0) taxTotal = totalGST.toFixed(2);
        } else if (hasIgst) {
          const itemSubtotal = extractedItems.reduce(
            (s, i) => s + (parseFloat(i.total) || 0), 0,
          );
          const grand = summary.grand_total_amount || 0;
          const igstAmt = Math.max(0, grand - itemSubtotal);
          if (igstAmt > 0) taxTotal = igstAmt.toFixed(2);
        } else if (extractedItems.length > 0) {
          const subtotal = extractedItems.reduce(
            (s, i) => s + (parseFloat(i.total) || 0), 0,
          );
          const dealerTax = partyTaxOptions[0];
          if (dealerTax && dealerTax.percentage > 0 && subtotal > 0) {
            const gstAmt = Math.round(
              (subtotal * dealerTax.percentage) / 100 * 100,
            ) / 100;
            cgst = (gstAmt / 2).toFixed(2);
            sgst = (gstAmt / 2).toFixed(2);
          }
        }
        if (summary.grand_total_amount > 0) {
          grandTotal = summary.grand_total_amount.toFixed(2);
        }
      }
      console.log('[OCR DEBUG]', JSON.stringify({
        summary: gstInvoice?.financial_summary,
        lineItems: gstInvoice?.line_items,
        cgst,
        sgst,
        taxTotal,
        grandTotal,
      }));
      setFields(prev => {
        const ocrPatch = normalizeOcrPatch(
          {
            invoiceNumber: header?.invoice_number || prev.invoiceNumber,
            associatedPO: header?.order_no || prev.associatedPO,
            earlyPaymentDiscount:
              header?.early_payment_discount || prev.earlyPaymentDiscount || '',
            items: extractedItems.length > 0 ? extractedItems : prev.items,
            cgst,
            sgst,
            taxTotal,
            grandTotal,
          },
          productType,
        );
        return {...prev, ...ocrPatch};
      });

      if (extractedItems.length === 0) {
        setIsOcrPopulated(false);
        Toast.show({
          type: 'info',
          text1: 'No line items found on invoice',
          text2: 'Scan again or add items manually',
          visibilityTime: 4000,
        });
        return;
      }

      setIsOcrPopulated(true);
      Toast.show({
        type: 'success',
        text1: `OCR completed (${extractedItems.length} item${
          extractedItems.length === 1 ? '' : 's'
        } extracted)`,
        visibilityTime: 2500,
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Gemini AI OCR failed',
        text2:
          e?.message ??
          'Failed to extract invoice data. Please try again in a few seconds.',
        visibilityTime: 7000,
      });
    } finally {
      setOcrLoading(false);
      setOcrStatusText('Extracting invoice data...');
    }
  };

  const handleOcrUploadFile = async (file: DocumentPickerResponse | undefined) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      Toast.show({
        type: 'error',
        text1: 'OCR upload supports images only',
        visibilityTime: 2500,
      });
      return;
    }
    await runOcrAndPatchForm(file.uri);
  };
    
  const handleSubmit = async () => {
    // Priority 1: Available Limit Check (Matching Web Portal Logic)
    // In edit mode, use the pre-fetched available limit (loaded when screen opened, like Web Portal).
    // In create mode, calculate from selected participant.

    if (isLimitExceeded && availableProgramLimit !== null) {
      const overBy = invoiceAmountForLimit - availableProgramLimit;
      Alert.alert(
        'Limit Exceeded',
        `Invoice amount ${formatLimitInr(invoiceAmountForLimit)} exceeds available limit ${formatLimitInr(availableProgramLimit)}. Reduce by at least ${formatLimitInr(overBy)}.`,
        [{text: 'OK'}],
      );
      return;
    }

    // Final Total Integrity Check (0.01 precision)
    // Web Create: Sub − Disc + Tax − TDS − Advance Interest
    const {subTotal: subTotalCalc, discountTotal: discCalc, taxTotal: taxCalc} =
      computeInvoiceLineAggregates(fields.items, fields);
    const tdsCalc = parseFloat(fields.tdsAmount || '0') || 0;
    const aiCalc = parseFloat(fields.upfrontInterest || '0') || 0;
    const calculatedGrandTotal = computeInvoiceNetTotal(
      subTotalCalc,
      discCalc,
      taxCalc,
      tdsCalc,
      aiCalc,
    );
    const reportedGrandTotal =
      parseFloat(fields.grandTotal || '0') || calculatedGrandTotal;
    
    if (Math.abs(calculatedGrandTotal - reportedGrandTotal) > 0.01) {
      console.error('[CreateInvoice] Total Mismatch:', {calculatedGrandTotal, reportedGrandTotal});
      Alert.alert(
        'Calculation Error',
        'Invoice total mismatch detected. Please refresh the item totals.',
        [{ text: 'OK' }]
      );
      return;
    }

    // In Edit Mode: skip field-level validations (matches Web Portal behavior).
    // The invoice already exists and was validated at creation. Only business rules apply.
    if (mode !== 'edit') {
      const validation = validateForm(true);
      console.log('[CreateInvoice] handleSubmit called, validation:', validation);
      if (!validation.isValid) {
        Toast.show({
          type: 'error',
          text1: validation.firstError || 'Please fill all required fields',
          visibilityTime: 3000,
        });
        return;
      }
    }

    if (
      mode !== 'edit' &&
      shouldWarnVfZeroAdvanceInterest({
        isVendorFinanceUpfront,
        chargeApplies: advanceInterestInfo.chargeApplies,
        advanceInterest: aiCalc,
        roiPercent: extractRoiPercent(selectedParticipant?.interest_parameters),
        tenorDays: fields.tenor,
        subTotal: subTotalCalc,
        discountTotal: discCalc,
        taxTotal: taxCalc,
        tdsAmount: tdsCalc,
      })
    ) {
      const shouldContinue = await new Promise<boolean>(resolve => {
        Alert.alert(
          'Advance Interest is ₹0.00',
          'VF Upfront: verify Tenor and program ROI before creating this invoice.',
          [
            {text: 'Review', style: 'cancel', onPress: () => resolve(false)},
            {text: 'Continue', onPress: () => resolve(true)},
          ],
          {cancelable: false},
        );
      });
      if (!shouldContinue) {
        return;
      }
    }

    const createdBy = userId != null ? String(userId) : '';

    // In Edit Mode: dispatch update directly.
    // The participant/bank IDs are already stored in the backend invoice record.
    // We don't need selectedParticipant or partnerBankId from the current UI state.
    if (mode === 'edit' && route?.params?.invoiceId) {
      console.log('[CreateInvoice] Edit mode: dispatching updateInvoiceRequest directly');
      dispatch(
        updateInvoiceRequest({
          invoiceId: route.params.invoiceId,
          fields,
          createdBy,
          attachment: selectedAttachment ?? undefined,
          approval_level: 1,
          creditToAccountId: fields.creditToAccountId?.trim() || undefined,
        }),
      );
      return;
    }

    const partnerBankId = programSelection?.bankId;
    if (dealerInfo && (!selectedParticipant || !partnerBankId)) {
      Toast.show({
        type: 'error',
        text1: `Please select a Program (with Bank) and ${ocrPartyLabels.party} first.`,
        visibilityTime: 3000,
      });
      return;
    }
    if (dealerInfo && !createdBy) {
      Toast.show({
        type: 'error',
        text1: 'User session not found. Please log in again.',
        visibilityTime: 3000,
      });
      return;
    }

    if (dealerInfo && selectedParticipant && programSelection?.programId && partnerBankId) {
      if (mode === 'edit' && route?.params?.invoiceId) {
        console.log('[CreateInvoice] Dispatching updateInvoiceRequest');
        dispatch(
          updateInvoiceRequest({
            invoiceId: route.params.invoiceId,
            fields,
            createdBy,
            attachment: selectedAttachment ?? undefined,
            approval_level: 1, // Reset to first checker as per backend discovery
            creditToAccountId: fields.creditToAccountId?.trim() || undefined,
          }),
        );
        return;
      }

      // Golden rule: credit_to_account_id is required on create for DF + VF + PID
      // alike on the unified backend. Resolve UUID from selected account
      // number when dropdown showed a value but accountId wasn't synced.
      const resolvedCreditToAccountId = resolvedCreditAccountId;
      if (requiresCreditToAccountId(productType) && !resolvedCreditToAccountId) {
        Toast.show({
          type: 'error',
          text1: 'Please select a valid Credit To account from the list',
          visibilityTime: 3000,
        });
        return;
      }

      // invoice.party must be the program's Anchor party (DF + VF + PID alike).
      // Prefer party-info `anchorPartyId` (dealerInfo.party.id) over
      // programSelection.partyId: for VF Vendor Maker / DF Dealer Pull,
      // scope bank.partyId is the logged-in counterparty (self), not the
      // anchor — using it made Anchor+Vendor both show the vendor name.
      const anchorPartyId = String(
        (dealerInfo as any)?.party?.id ||
          programSelection?.partyId ||
          '',
      ).trim();

      const participantMappingId = String(selectedParticipant?.id || '').trim();
      const programLoanOd = String(
        (dealerInfo?.basic_parameters as any)?.loan_account_no ||
          selectedParticipant?.od_account_no ||
          '',
      ).trim();
      const counterPartyOdAccount = String(
        decryptValue(
          (isPid ? programLoanOd : selectedParticipant?.od_account_no) || '',
        ) ||
          (isPid ? programLoanOd : selectedParticipant?.od_account_no) ||
          '',
      );

      console.log('[CreateInvoice] Attempting to dispatch createInvoiceRequest', {
        partnerBankId,
        programId: programSelection?.programId,
        productId: programSelection?.productId || activeProductId,
        participantId: participantMappingId,
        isPid,
        partyId: anchorPartyId,
        scopePartyId: programSelection?.partyId,
        partyInfoAnchorId: (dealerInfo as any)?.party?.id,
      });
      try {
        dispatch(
          createInvoiceRequest({
            fields: {
              ...fields,
              creditToAccountId: resolvedCreditToAccountId,
            },
            createdBy,
            partnerBank: String(partnerBankId || ''),
            program: String(programSelection?.programId || ''),
            // Active product context from PR1/PR2: prefer the program's own
            // productId; fall back to the globally active product.
            product: String(programSelection?.productId || activeProductId || ''),
            // DF/VF: APM id. PID: leave empty; vendorMappingId sent instead.
            anchorParticipantMapping: isPid ? '' : participantMappingId,
            vendorMappingId: isPid ? participantMappingId : undefined,
            party: anchorPartyId,
            // Pull (VF vendor / DF dealer maker): party-info row entityName is
            // the Anchor; counterparty is the logged-in party. Push / PID:
            // selected participant (vendor/dealer) is the counterparty.
            counterPartyName: String(
              (String(programSelection?.method || '').toLowerCase() === 'pull'
                ? decryptValue(userPartyName || '') ||
                  userPartyName ||
                  decryptValue(selectedParticipant?.party?.entity_name || '') ||
                  selectedParticipant?.party?.entity_name
                : decryptValue(selectedParticipant?.party?.entity_name || '') ||
                  selectedParticipant?.party?.entity_name) || '',
            ),
            counterPartyCode: String(
              decryptValue(selectedParticipant?.company_code || '') ||
                selectedParticipant?.company_code ||
                '',
            ),
            counterPartyOdAccount,
            attachment: selectedAttachment ?? undefined,
            creditToAccountId: resolvedCreditToAccountId,
          }),
        );
        console.log('[CreateInvoice] createInvoiceRequest dispatch was successful');
      } catch (e: any) {
        console.error('[CreateInvoice] CRITICAL ERROR during dispatch:', e);
        Alert.alert('Submission Error', 'A local error occurred while preparing your submission. Please try again.');
      }
    } else {
      console.log('[CreateInvoice] handleSubmit failed to enter a dispatch block', {
        dealerInfo: !!dealerInfo,
        selectedParticipant: !!selectedParticipant,
        programId: programSelection?.programId,
        partnerBankId
      });
      Toast.show({
        type: 'error',
        text1: 'Please select a Program from the dashboard first, then try again.',
        visibilityTime: 3000,
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      setOcrLoading(true);
      await invoiceApi.deleteInvoiceAttachment(attachmentId);
      setFields(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter(a => a.id !== attachmentId),
      }));
      Toast.show({
        type: 'success',
        text1: 'Attachment deleted',
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete attachment');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleDeleteItem = async (index: number) => {
    const item = fields.items[index];
    if (mode === 'edit' && item?.id) {
      try {
        setOcrLoading(true);
        await invoiceApi.deleteInvoiceItem(item.id);
        Toast.show({
          type: 'success',
          text1: 'Item deleted',
        });
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to delete item');
        return; // Don't update local state if API fails
      } finally {
        setOcrLoading(false);
      }
    }
    const newItems = [...fields.items];
    newItems.splice(index, 1);
    applyPatch({items: newItems});
  };

  const handleDeleteItemTax = async (itemIndex: number, taxIndex: number) => {
    const item = fields.items[itemIndex];
    const tax = item?.taxes?.[taxIndex];
    
    // In edit mode, if tax has an ID, delete via API
    if (mode === 'edit' && (tax as any)?.id) {
      try {
        setOcrLoading(true);
        await invoiceApi.deleteInvoiceItemTax((tax as any).id);
        Toast.show({
          type: 'success',
          text1: 'Tax deleted',
        });
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to delete tax');
        return;
      } finally {
        setOcrLoading(false);
      }
    }

    // Update local state
    const newItems = [...fields.items];
    const taxes = [...(newItems[itemIndex].taxes || [])];
    taxes.splice(taxIndex, 1);
    newItems[itemIndex] = {...newItems[itemIndex], taxes};
    applyPatch({items: newItems});
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Invoice',
      'Are you sure you want to cancel? All entered data will be reset.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            beginLeaveToInvoiceList(() => goToInvoiceList(true));
          },
        },
      ]
    );
  };

  const resetCreateInvoiceForm = useCallback(() => {
    setFields(getInitialFields());
    setErrors({});
    setSelectedParticipant(null);
    setSelectedAttachment(null);
    setShowCamera(false);
    setIsOcrUploadModalVisible(false);
    setIsProofUploadModalVisible(false);
    setIsOcrPopulated(false);
    setOcrLoading(false);
    lastPreviewTokenRef.current = undefined;
    clearCreateInvoiceRouteParams();
  }, [clearCreateInvoiceRouteParams]);

  // Fresh create from invoice list — always start with a blank form.
  useFocusEffect(
    useCallback(() => {
      if (mode === 'edit' || mode === 'recreate') return;
      if (!route?.params?.freshCreate) return;

      resetCreateInvoiceForm();
      resetScreenData();
    }, [
      mode,
      route?.params?.freshCreate,
      resetCreateInvoiceForm,
      resetScreenData,
    ]),
  );

  const beginLeaveToInvoiceList = useCallback((onLeave: () => void) => {
    if (isLeavingCreate) {
      return;
    }
    allowLeaveRef.current = true;
    dispatch(setLeavingCreateInvoice(true));
    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        onLeave();
      });
    });
  }, [dispatch, isLeavingCreate]);

  useFocusEffect(
    useCallback(() => {
      dispatch(setLeavingCreateInvoice(false));
      return () => {
        // Clear loading / leave flags when leaving Create so list is never
        // covered by a stuck BusyOverlay Modal from this screen.
        dispatch(resetCreateInvoiceState());
        dispatch(setLeavingCreateInvoice(false));
        dispatch(setOpeningCreateInvoice(false));
      };
    }, [dispatch]),
  );

  useEffect(() => {
    if (!permissionsLoading) {
      dispatch(setOpeningCreateInvoice(false));
    }
  }, [permissionsLoading, dispatch]);

  // True when user has typed/selected anything worth protecting.
  const isCreateFormDirty = useMemo(() => {
    const f = fields;
    return !!(
      f.dealer?.trim() ||
      f.dealerCode?.trim() ||
      f.odAccountNumber?.trim() ||
      f.invoiceNumber?.trim() ||
      f.associatedPO?.trim() ||
      f.tenor?.trim() ||
      f.invoiceDate?.trim() ||
      f.paymentDate?.trim() ||
      f.invoiceDueDate?.trim() ||
      f.grnDate?.trim() ||
      f.earlyPaymentDiscount?.trim() ||
      f.creditTo?.trim() ||
      f.remark?.trim() ||
      (f.items && f.items.length > 0) ||
      selectedAttachment ||
      (f.attachments && f.attachments.length > 0)
    );
  }, [fields, selectedAttachment]);

  /**
   * Leave Create Invoice:
   * - Preview / OCR routes must NOT trigger this (handled in beforeRemove).
   * - If form has data → ask user; Leave clears, Stay keeps form.
   * - If empty → clear + leave silently.
   */
  const confirmLeaveCreateInvoice = useCallback(
    (onLeave: () => void) => {
      if (ocrLoading) {
        Toast.show({
          type: 'info',
          text1: 'OCR in progress',
          text2: 'Please wait for extraction to finish or tap Cancel.',
          visibilityTime: 3000,
        });
        return;
      }

      const clearAndLeave = () => {
        beginLeaveToInvoiceList(onLeave);
      };

      if (!isCreateFormDirty) {
        clearAndLeave();
        return;
      }

      Alert.alert(
        'Leave Create Invoice?',
        'You have entered invoice details. If you go back, this information will be cleared.',
        [
          {text: 'Stay', style: 'cancel'},
          {
            text: 'Leave & Clear',
            style: 'destructive',
            onPress: clearAndLeave,
          },
        ],
      );
    },
    [ocrLoading, isCreateFormDirty, beginLeaveToInvoiceList],
  );

  // Flush only when leaving Create Invoice for a non-preview route.
  // If form is dirty, ask first (same UX as Cancel / back arrow).
  useEffect(() => {
    const isPreviewNavigation = (action: any) => {
      const type = action?.type;
      const name = action?.payload?.name;
      return (
        (type === 'NAVIGATE' || type === 'JUMP_TO') &&
        name === 'InvoiceUploadPreview'
      );
    };

    const unsubscribe = (navigation as any).addListener(
      'beforeRemove',
      (e: any) => {
        if (isPreviewNavigation(e.data.action)) {
          return;
        }

        // User already confirmed via Cancel / AppBar / hardware back.
        if (allowLeaveRef.current) {
          allowLeaveRef.current = false;
          resetCreateInvoiceForm();
          resetScreenData();
          clearCreateInvoiceRouteParams();
          return;
        }

        if (!isCreateFormDirty) {
          resetCreateInvoiceForm();
          resetScreenData();
          clearCreateInvoiceRouteParams();
          return;
        }

        // Block pop/navigate-away until user confirms.
        e.preventDefault();
        Alert.alert(
          'Leave Create Invoice?',
          'You have entered invoice details. If you go back, this information will be cleared.',
          [
            {text: 'Stay', style: 'cancel'},
            {
              text: 'Leave & Clear',
              style: 'destructive',
              onPress: () => {
                beginLeaveToInvoiceList(() =>
                  navigation.dispatch(e.data.action),
                );
              },
            },
          ],
        );
      },
    );

    return unsubscribe;
  }, [
    navigation,
    isCreateFormDirty,
    beginLeaveToInvoiceList,
    resetCreateInvoiceForm,
    resetScreenData,
    clearCreateInvoiceRouteParams,
  ]);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        confirmLeaveCreateInvoice(() => goToInvoiceList(true));
        return true; // Prevent default — we handle leave ourselves
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, [confirmLeaveCreateInvoice, goToInvoiceList]),
  );

  const hasAnyAttachment = !!selectedAttachment || (fields.attachments && fields.attachments.length > 0);

  const limitCheckParticipant = useMemo(
    () =>
      selectedParticipant ??
      matchDealerInfoParticipant(
        dealerInfo?.participants,
        fields.dealer,
        fields.dealerCode,
      ),
    [
      selectedParticipant,
      dealerInfo?.participants,
      fields.dealer,
      fields.dealerCode,
    ],
  );

  const limitDisplayParticipant = useMemo(() => {
    if (limitCheckParticipant) {
      return limitCheckParticipant;
    }
    if (isPid && dealerInfo?.participants?.length) {
      return dealerInfo.participants[0];
    }
    return null;
  }, [limitCheckParticipant, isPid, dealerInfo?.participants]);

  const availableProgramLimit = useMemo(() => {
    if (mode === 'edit' && apmAvailableLimit !== null) {
      return apmAvailableLimit;
    }
    if (limitDisplayParticipant) {
      return getParticipantAvailableLimit(limitDisplayParticipant);
    }
    return null;
  }, [mode, apmAvailableLimit, limitDisplayParticipant]);

  const invoiceAmountForLimit = useMemo(
    () =>
      computeInvoiceAmountForLimitCheck(fields.items, {
        cgst: fields.cgst,
        sgst: fields.sgst,
        taxTotal: fields.taxTotal,
      }),
    [fields.items, fields.cgst, fields.sgst, fields.taxTotal],
  );

  const isLimitExceeded = useMemo(() => {
    if (availableProgramLimit === null || !limitCheckParticipant) {
      return false;
    }
    if (invoiceAmountForLimit <= 0) {
      return false;
    }
    return invoiceAmountForLimit > availableProgramLimit;
  }, [
    availableProgramLimit,
    limitCheckParticipant,
    invoiceAmountForLimit,
  ]);

  const showProgramLimitBanner =
    availableProgramLimit !== null && !!limitDisplayParticipant && !!dealerInfo;

  const submitButtonAppearsDisabledInternal =
    (canUploadFinal && !hasAnyAttachment) ||
    !isFormValid ||
    isLimitExceeded;

  const submitDisabledReasonInternal = useMemo(() => {
    // In Edit mode, we skip field-level mandatory checks for the button state
    // because the data is already pre-filled and often read-only.
    if (mode === 'edit') return undefined;

    if (!fields.dealer?.trim()) return `${ocrPartyLabels.party} Name is required`;
    if (!fields.dealerCode?.trim()) return `${ocrPartyLabels.code} is required`;
    if (!fields.invoiceNumber?.trim()) return 'Invoice / Unique Ref. No is required';
    if (!fields.invoiceDate?.trim()) return 'Invoice Date is required';
    const tenorDaysHint = parseInt(String(fields.tenor ?? '').trim(), 10);
    if (!Number.isFinite(tenorDaysHint) || tenorDaysHint <= 0) {
      return 'Tenor is required — select from the list';
    }
    if (!fields.creditTo?.trim()) return 'Credit To is required';
    if (
      requiresCreditToAccountId(productType) &&
      !resolveCreditAccountIdFromOptions(
        fields.creditTo,
        creditToOptions,
        fields.creditToAccountId,
      )
    ) {
      return 'Please select a valid Credit To account from the list';
    }
    if (!fields.items || fields.items.length === 0) return 'At least one item is required';
    
    // Items detail check
    for (let i = 0; i < (fields.items?.length || 0); i++) {
       const item = fields.items![i];
       if (!item.itemName?.trim()) return `Item ${i + 1}: Item Name is required`;
       if (!item.quantity?.trim() || parseFloat(item.quantity) <= 0) return `Item ${i + 1}: Valid Quantity is required`;
       if (!item.unit?.trim()) return `Item ${i + 1}: Unit is required`;
      if (!/^[A-Z]{1,3}$/.test(item.unit.trim().toUpperCase())) {
        return `Item ${i + 1}: Unit must be 1 to 3 letters like PCS or BOX`;
      }
       if (!item.pricePerQuantity?.trim() || parseFloat(item.pricePerQuantity) <= 0) return `Item ${i + 1}: Valid Price is required`;
    }

    if (canUploadFinal && !hasAnyAttachment) {
      return 'Please upload the invoice file';
    }
    if (
      isLimitExceeded &&
      availableProgramLimit !== null &&
      invoiceAmountForLimit > 0
    ) {
      const overBy = invoiceAmountForLimit - availableProgramLimit;
      return `Invoice amount ${formatLimitInr(invoiceAmountForLimit)} exceeds available limit ${formatLimitInr(availableProgramLimit)}. Reduce by at least ${formatLimitInr(overBy)}.`;
    }
    return undefined;
  }, [
    fields,
    canUploadFinal,
    hasAnyAttachment,
    mode,
    productType,
    creditToOptions,
    ocrPartyLabels,
    isLimitExceeded,
    availableProgramLimit,
    invoiceAmountForLimit,
  ]);

  const dealerOptions = useMemo(
    () =>
      dealerInfo?.participants?.map(p => ({
        label: decryptValue(p.party.entity_name ?? '') || p.party.entity_name,
        value: p.party.entity_name,
      })) ?? [],
    [dealerInfo],
  );
  const tenorOptions = useMemo(() => {
    const standard = [30, 45, 60, 90];
    const fromDealer = Number(dealerInfo?.basic_parameters?.default_payment_terms_days);
    const fromInvoice = Number(fields.tenor);
    const values = new Set(standard);
    if (Number.isFinite(fromDealer) && fromDealer > 0) {
      values.add(Math.round(fromDealer));
    }
    if (Number.isFinite(fromInvoice) && fromInvoice > 0) {
      values.add(Math.round(fromInvoice));
    }
    return Array.from(values)
      .sort((a, b) => a - b)
      .map(days => ({
        label: `${days} Days`,
        value: String(days),
      }));
  }, [dealerInfo?.basic_parameters?.default_payment_terms_days, fields.tenor]);
  if (permissionsLoading) {
    return (
      <Container>
        <AppBar 
          title="Create Invoice" 
          navigation={navigation as any} 
          renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
          onPressLeftIcon={() => {
            confirmLeaveCreateInvoice(() => goToInvoiceList(true));
          }}
        />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white}}>
          <ActivityIndicator size="large" color={Colors.primaryColor} />
          <Text style={{marginTop: scaleHeight(12), fontFamily: Fonts.GilroyMedium, color: Colors.graybase}}>
            Verifying permissions...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <>
    <Container>
      <AppBar 
        title={mode === 'edit' ? "Edit Invoice" : mode === 'recreate' ? "Recreate Invoice" : "Create Invoice"} 
        navigation={navigation as any}
        hideHamburger={true}
        renderLeftIcon={<LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />}
        onPressLeftIcon={() => {
          confirmLeaveCreateInvoice(() => goToInvoiceList(true));
        }}
      />
      <View style={styles.pageTitleBar}>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitleText} numberOfLines={1}>
            {headerModeTitle}
          </Text>
          {(fields.invoiceNumber || invoiceNo) && (
            <Text style={styles.pageSubtitleText}>
              {fields.invoiceNumber || invoiceNo}
            </Text>
          )}
          
        </View>
      </View>
      <View style={styles.container} pointerEvents={ocrLoading ? 'box-none' : 'auto'}>
        {/* OCR Section - Only shown in Create mode */}
        {!mode && hasCreatePerm && (
          <View pointerEvents={ocrLoading ? 'none' : 'auto'}>
            {/* OCR Badge */}
            <View style={styles.aiBadge}>
              <AI
                width={scaleWidth(18)}
                height={scaleHeight(18)}
                color={Colors.primaryColor}
              />
              <Text style={styles.aiBadgeText}>OCR Extraction (Capture / Upload)</Text>
            </View>

            {/* OCR Buttons */}
            <View style={styles.ocrSection}>
              <Text style={styles.ocrTitle}>Scan invoice for OCR</Text>
              <Text style={styles.ocrSubtitle}>
                {productType === 'vendor_finance'
                  ? 'Capture or upload invoice image. Tenor is required for Advance Interest.'
                  : 'Capture or upload invoice image to auto-fill form fields.'}
              </Text>

              <View style={styles.ocrButtons}>
                <TouchableOpacity
                  style={[
                    styles.ocrButton,
                    styles.cameraButton,
                    (isOcrTemporarilyDisabled || !isOcrPrerequisitesMet || ocrLoading) &&
                      styles.ocrButtonDisabled,
                  ]}
                  onPress={handleOcrCapturePress}
                  disabled={disabled || isOcrTemporarilyDisabled}>
                  <Camera width={scaleWidth(20)} height={scaleHeight(20)} />
                  <Text style={styles.ocrButtonText}>Capture</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.ocrButton,
                    styles.galleryButton,
                    (isOcrTemporarilyDisabled || !isOcrPrerequisitesMet || ocrLoading) &&
                      styles.ocrButtonDisabled,
                  ]}
                  onPress={handleOcrUploadPress}
                  disabled={disabled || isOcrTemporarilyDisabled}>
                  <Upload width={scaleWidth(20)} height={scaleHeight(20)} />
                  <Text style={styles.ocrButtonText}>Upload</Text>
                </TouchableOpacity>
              </View>

              {ocrLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primaryColor} />
                  <Text style={styles.loadingText}>{ocrStatusText}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Invoice Form */}
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}>
          {showProgramLimitBanner && availableProgramLimit !== null ? (
            <InvoiceProgramLimitBanner
              availableLimit={availableProgramLimit}
              invoiceAmount={invoiceAmountForLimit}
              sanctionedLimit={parseLimitNumber(
                limitDisplayParticipant?.sanctioned_limit,
              )}
              utilizedAmount={parseLimitNumber(
                limitDisplayParticipant?.utilized_amount,
              )}
              pipelineRequests={parseLimitNumber(
                limitDisplayParticipant?.pipeline_requests,
              )}
              showLiveStatus={!!limitCheckParticipant}
              isProgramLevel={isPid}
              counterpartyLabel={ocrPartyLabels.party}
              vendorNotSelectedYet={isPid && !limitCheckParticipant}
            />
          ) : null}
          <InvoiceForm
            value={fields}
            onChange={applyPatch}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={createInvoiceLoading}
            errors={errors}
            isFormValid={isFormValid}
            submitButtonAppearsDisabled={submitButtonAppearsDisabledInternal}
            submitDisabledReason={submitDisabledReasonInternal}
            productType={productType}
            dealerOptions={dealerOptions.length > 0 ? dealerOptions : undefined}
            creditToOptions={creditToOptions.length > 0 ? creditToOptions : undefined}
            tenorOptions={tenorOptions}
            partyTaxOptions={partyTaxOptions.length > 0 ? partyTaxOptions : undefined}
            onLoadPartyTaxes={loadPartyTaxes}
            showAdvanceInterest={showAdvanceInterest}
            advanceInterest={advanceInterestInfo.advanceInterest}
            roiPercent={extractRoiPercent(selectedParticipant?.interest_parameters)}
            staleInvoicePeriodDays={dealerInfo?.basic_parameters?.stale_invoice_period_days != null ? Number(dealerInfo.basic_parameters.stale_invoice_period_days) : undefined}
            defaultPaymentTermsDays={dealerInfo?.basic_parameters?.default_payment_terms_days != null ? Number(dealerInfo.basic_parameters.default_payment_terms_days) : undefined}
            mode={mode}
            onDeleteAttachment={handleDeleteAttachment}
            onDeleteItem={handleDeleteItem}
            onDeleteItemTax={handleDeleteItemTax}
            canUploadFinal={canUploadFinal}
            onAddAttachment={() => setIsProofUploadModalVisible(true)}
            selectedAttachment={selectedAttachment}
            onPreview={handleInvoicePreview}
            previewButtonAppearsDisabled={!canPreviewInvoice}
            previewDisabledReason={previewDisabledReasonInternal}
            isOcrMode={isOcrPopulated}
            ocrLoading={ocrLoading}
          />
        </ScrollView>
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <InvoiceCamera
          onCaptured={async path => {
            setShowCamera(false);
            const cameraAttachment: DocumentPickerResponse = {
              uri: 'file://' + path,
              name: `captured-invoice-${Date.now()}.jpg`,
              type: 'image/jpeg',
            } as DocumentPickerResponse;
            await runOcrAndPatchForm(cameraAttachment.uri);
          }}
          onClose={() => setShowCamera(false)}
        />
      </Modal>

      {/* OCR UploadModal */}
      <UploadModal
        visible={isOcrUploadModalVisible}
        allowedFileTypes={['jpg', 'jpeg', 'png']}
        onClose={(file) => {
          if (file) {
            handleOcrUploadFile(file);
            setIsOcrUploadModalVisible(false);
          } else {
            setIsOcrUploadModalVisible(false);
          }
        }}
      />

      {/* Proof UploadModal */}
      <UploadModal
        visible={isProofUploadModalVisible}
        allowedFileTypes={['jpg', 'jpeg', 'png', 'pdf']}
        onClose={(file) => {
          if (file) {
            handleProofUploadFile(file);
            setIsProofUploadModalVisible(false);
          } else {
            setIsProofUploadModalVisible(false);
          }
        }}
      />
    </Container>
    <BusyOverlay
      visible={isFocused && !!createInvoiceLoading}
      message={
        mode === 'edit'
          ? 'Updating invoice…'
          : mode === 'recreate'
            ? 'Recreating invoice…'
            : 'Creating invoice…'
      }
    />
    </>
  );
};

const styles = StyleSheet.create({
  pageTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  backButton: {
    marginRight: scaleWidth(12),
    padding: scaleWidth(4),
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  pageSubtitleText: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    gap: scaleWidth(8),
  },
  aiBadgeText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    letterSpacing: 0.3,
  },
  ocrSection: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(16),
    paddingBottom: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  ocrTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(4),
  },
  ocrSubtitle: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(16),
  },
  ocrButtons: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  ocrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(8),
  },
  ocrButtonDisabled: {
    opacity: 0.5,
  },
  cameraButton: {
    backgroundColor: Colors.primaryColor,
  },
  galleryButton: {
    backgroundColor: Colors.gray200,
  },
  ocrButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(12),
    gap: scaleWidth(8),
  },
  loadingText: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
  },
  proofSection: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  selectedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleHeight(12),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    backgroundColor: Colors.gray200,
    borderRadius: scaleWidth(8),
  },
  selectedFileText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
    flex: 1,
  },
  removeFileText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    marginLeft: scaleWidth(8),
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingBottom: scaleHeight(20),
  },
  footer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    alignItems: 'center',
  },
  uploadInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(18),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(8),
    width: '58%',
    maxWidth: scaleWidth(260),
    minWidth: scaleWidth(160),
  },
  buttonIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadInvoiceButtonText: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});

