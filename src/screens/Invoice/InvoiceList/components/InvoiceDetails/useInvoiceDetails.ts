import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Dimensions, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import Toast from 'react-native-toast-message';
import { scaleWidth, scaleHeight } from '@utils/Scale';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInvoiceListRequest,
  updateInvoiceStatusRequest,
  updateInvoiceVerificationRequest,
  bulkUpdateInvoiceRequest,
  fetchDealerInfoRequest,
} from '@store/invoice/inv.slice';
import { fetchPermissionsRequest } from '@store/permissions';
import {
  setProgramSelection,
  toggleProgramSelection,
  fetchUserScopeRequest,
} from '@store/programSelection/programSelection.slice';
import {
  selectInvoiceList,
  selectInvoiceListLoading,
  selectInvoiceListError,
  selectDealerInfo,
} from '@store/invoice/inv.selector';
import {
  selectProgramSelection,
  selectScopeData,
} from '@store/programSelection/programSelection.selector';
import { ProgramSelectionState } from '@store/programSelection/programSelection.types';
import { userSelector } from '@store/user';
import { AppRole, ROLE_LABELS } from '@constants/roles';
import {selectEffectiveProductCode} from '@store/product/product.selectors';
import {PRODUCT_CODES} from '@store/product/product.types';
import { mapApiToRow, formatDateDash, mapApprovalLogToTimelineStep, formatStatus } from './types';
import { InvoiceListItemApi } from '@store/invoice/inv.types';
import { invoiceApi } from '@services/api/invoice.api';
import { useHasPermission } from '@hooks/useHasPermission';
import { PERMISSIONS } from '@constants/permissions';
import { decryptValue } from '@utils/decrypt';
import {
  computeInvoiceTaxableBase,
  resolveInvoiceRoiPercent,
  resolveNetDisbursementAmountFromInvoice,
} from '@utils/invoiceTotals';
import { resolveApprovalStatusLabel } from '@utils/invoiceStatusDisplay';
import { formatApiInvoiceDate } from '@utils/invoiceDateFormat';
import { mapInvoiceAttachmentsWithUrls, buildInvoiceAttachmentUrl, type InvoiceAttachmentItem } from '@utils/invoiceAttachments';
import type { WorkflowStep } from '@components/InvoiceTrackingModal/InvoiceTrackingModal';
import type {
  ApproveRejectInvoiceDetails,
  ApproveRejectInvoiceItem,
} from '@components/ApproveRejectModal/ApproveRejectModal';
import {
  getBestWorkflowApprovalLevelFromScope,
  getInvoiceApprovalLevel,
  getInvoiceApprovalLevelForId,
} from '@utils/getInvoiceApprovalLevel';
import {isInvoiceBulkSelectable, isPendingInvoiceApprovalRow} from '@utils/invoiceListActionable';
import type {InvoiceListFilters} from '@store/invoice/inv.types';
import {
  selectActiveProductName,
  selectActiveProductCode,
} from '@store/product/product.selectors';
import {PRODUCT_DISPLAY_NAMES} from '@store/product/product.types';
import {getEffectiveProductCode} from '@store/product/product.resolver';
import {readDueDateCalculatedFrom} from '@utils/invoiceDueDate';

export function useInvoiceDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const programSelection = useSelector(selectProgramSelection) as ProgramSelectionState;
  const scopeData = useSelector(selectScopeData);
  const invoiceListRaw = useSelector(selectInvoiceList) as InvoiceListItemApi[];
  const invoiceListLoading = useSelector(selectInvoiceListLoading);
  const invoiceListError = useSelector(selectInvoiceListError);
  const dealerInfo = useSelector(selectDealerInfo);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const userInfoFull = useSelector(userSelector.getUserInfo);
  const userDepartment = (userInfoFull as any)?.department || '';
  const activeProductName = useSelector(selectActiveProductName);
  const activeProductCode = useSelector(selectActiveProductCode);
  const productBreadcrumbLabel =
    activeProductName ||
    PRODUCT_DISPLAY_NAMES[getEffectiveProductCode(activeProductCode)];

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Smooth transition when loading state changes
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [invoiceListLoading]);

  const routeParams = route.params as {
    fromInvoiceDashboard?: boolean;
    bankName?: string;
    dealerName?: string;
    programName?: string;
    programId?: string;
    refreshList?: boolean;
  } | undefined;
  const selectedDealerName = routeParams?.dealerName;
  const fromInvoiceDashboard = routeParams?.fromInvoiceDashboard === true;
  const breadcrumbBank = routeParams?.bankName || (programSelection?.programScope !== 'all' ? programSelection?.bankName : undefined);
  const breadcrumbDealer = routeParams?.dealerName || (programSelection?.programScope !== 'all' ? programSelection?.productName : undefined);
  const breadcrumbProgram = routeParams?.programName || (programSelection?.programScope !== 'all' ? programSelection?.programName : undefined);

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const isAllProgramScope = programSelection?.programScope === 'all';

  const isAnchorAllAccess = userRole === 'anchor_all_access';
  const isDealerAllAccess = userRole === 'dealer_all_access';
  
  const isAnchorMaker = userRole === 'anchor_maker' || isAnchorAllAccess;
  const isAnchorChecker = userRole === 'anchor_checker' || isAnchorAllAccess;
  const isDealerMaker = userRole === 'dealer_maker' || isDealerAllAccess;
  const isDealerChecker = userRole === 'dealer_checker' || isDealerAllAccess;
  const isCashnTechUser =
    userRole === 'cashntech_user' ||
    !!(userRole && ROLE_LABELS[userRole] === 'CashnTech User');
  const effectiveProductCode = useSelector(selectEffectiveProductCode);
  
  const storedUserRole = userRole ? ROLE_LABELS[userRole] : '';

  const dealerListTitle =
    isCashnTechUser
      ? 'Invoice'
      : effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE
        ? 'Vendor Wise Invoice Details'
      : isDealerMaker || isDealerChecker
        ? 'Anchor Wise Invoice Details'
        : 'Dealer Wise Invoice Details';

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentFallback, setAttachmentFallback] = useState<InvoiceAttachmentItem[]>([]);
  
  // Permission Checks
  const canApprove = useHasPermission(PERMISSIONS.INVOICE_LIST_APPROVE);
  const canReject = useHasPermission(PERMISSIONS.INVOICE_LIST_REJECT);
  const canVerify = useHasPermission(PERMISSIONS.INVOICE_LIST_ADMIN_VERIFICATION);
  const canCreate = useHasPermission(PERMISSIONS.INVOICE_LIST_CREATE);
  const canEdit = useHasPermission(PERMISSIONS.INVOICE_LIST_EDIT);
  const canImport = useHasPermission(PERMISSIONS.INVOICE_LIST_UPLOAD_VERIFY);
  const hasFunctionalPermission = canApprove || canReject || canVerify;

  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});
  
  const invoiceData = (invoiceListRaw || []).map((api, idx) => ({
    ...mapApiToRow(api),
    absoluteIndex: idx,
  }));

  let filteredData = invoiceData;
  if (selectedDealerName && invoiceData.length > 0) {
    const dealerNameLower = selectedDealerName.toLowerCase().trim();
    const filteredByDealer = filteredData.filter(item => {
      const itemDealerName = item.dealerName?.toLowerCase().trim() || '';
      const itemDealerCode = item.dealerCode?.toLowerCase().trim() || '';
      return (
        itemDealerName.includes(dealerNameLower) ||
        dealerNameLower.includes(itemDealerName) ||
        itemDealerCode.includes(dealerNameLower) ||
        dealerNameLower.includes(itemDealerCode)
      );
    });
    if (filteredByDealer.length > 0) {
      filteredData = filteredByDealer;
    }
  }
  if (searchText.trim()) {
    const term = searchText.toLowerCase();
    filteredData = filteredData.filter(
      item =>
        (item.dealerName?.toLowerCase() || '').includes(term) ||
        (item.dealerCode?.toLowerCase() || '').includes(term) ||
        (item.invoiceNo?.toLowerCase() || '').includes(term),
    );
  }

  const selectedRowForMenu = openMenuId 
    ? filteredData.find(r => r.id === openMenuId) || invoiceData.find(r => r.id === openMenuId)
    : null;

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]); // Full items for modal
  const [showSendForApprovalModal, setShowSendForApprovalModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const [anchorCheckerInvoiceDetails, setAnchorCheckerInvoiceDetails] = useState<ApproveRejectInvoiceDetails | null>(null);
  const [anchorCheckerDetailsLoading, setAnchorCheckerDetailsLoading] = useState(false);
  const [approvalHistoryEntries, setApprovalHistoryEntries] = useState<WorkflowStep[]>([]);
  const [approvalHistoryLoading, setApprovalHistoryLoading] = useState(false);
  const [approvalHistorySummary, setApprovalHistorySummary] = useState<{
    invoiceAmount?: string;
    counterParty?: string;
    primaryParty?: string;
    raisedOn?: string;
    dueOn?: string;
    programName?: string;
  }>({});
  const [showFinanceRequestModal, setShowFinanceRequestModal] = useState(false);
  const [financeRequestPreview, setFinanceRequestPreview] = useState<any>(null);
  const [financeRequestLoading, setFinanceRequestLoading] = useState(false);
  const [financeRequestSubmitting, setFinanceRequestSubmitting] = useState(false);
  const [financeRequestInvoiceId, setFinanceRequestInvoiceId] = useState<string | null>(null);

  const programIdFromParams = routeParams?.programId;
  const concreteProgramId = programSelection?.programId ?? programIdFromParams;
  const programId = isAllProgramScope ? '' : concreteProgramId ?? '';

  useEffect(() => {
    if (!scopeData?.length) {
      dispatch(fetchUserScopeRequest());
    }
  }, [dispatch, scopeData]);

  useEffect(() => {
    if (!scopeData?.length || !programSelection?.productId) return;
    if (programSelection.approvalLevel != null) return;
    const level = getBestWorkflowApprovalLevelFromScope(scopeData, {
      productId: programSelection.productId,
      programId: programSelection.programId,
    });
    if (level != null) {
      dispatch(setProgramSelection({approvalLevel: level}));
    }
  }, [dispatch, scopeData, programSelection?.productId, programSelection?.programId, programSelection?.approvalLevel]);

  useEffect(() => {
    const isAlreadySet = programSelection?.programId === programIdFromParams && !!programSelection?.programName;
    if (!programIdFromParams || isAlreadySet) return;
    if (scopeData?.length) {
      for (const bank of scopeData) {
        for (const product of bank.products || []) {
          const program = product.programs?.find((p: any) => p.id === programIdFromParams);
          if (program) {
            dispatch(
              toggleProgramSelection({
                bankId: bank.id,
                bankName: bank.name,
                productId: product.id,
                productName: product.name,
                programId: program.id,
                programName: program.name,
                userType: (product.name || '').toLowerCase().includes('dealer') ? 'dealer' : 'vendor',
                partyId: bank.partyId,
                method: program.method,
                role: program.role,
                status: program.status,
                approvalLevel: product.approval_level ?? null,
              }),
            );
            return;
          }
        }
      }
    }
    // Final fallback: set as much as we have from route params to keep breadcrumb visible
    dispatch(
      setProgramSelection({
        programId: programIdFromParams,
        programName: routeParams?.programName || '',
        bankName: routeParams?.bankName || '',
        productName: routeParams?.dealerName || '', // Fallback dealer to product name if missing
      }),
    );
  }, [programIdFromParams, programSelection, scopeData, dispatch, routeParams]);

  const inv = appliedFilters['Invoice Status'];
  const admin = appliedFilters['Admin Status'];
  const apiFilters: InvoiceListFilters | undefined = (() => {
    const body: InvoiceListFilters = {};
    if (inv?.length) body.byInvoiceStatus = inv;
    if (admin?.length) body.byAdminStatus = admin;
    return Object.keys(body).length ? body : undefined;
  })();

  const hasAnyProgramContext = isAllProgramScope || !!concreteProgramId;

  const refreshInvoiceList = useCallback(() => {
    if (!hasAnyProgramContext) return;
    setVisibleCount(30);
    dispatch(fetchInvoiceListRequest({ programId, filters: apiFilters }));
  }, [hasAnyProgramContext, programId, apiFilters, dispatch]);

  useEffect(() => {
    if (!hasAnyProgramContext) return;
    dispatch(fetchInvoiceListRequest({ programId, filters: apiFilters }));
  }, [hasAnyProgramContext, programId, apiFilters, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (!hasAnyProgramContext || routeParams?.refreshList !== true) return;
      dispatch(fetchInvoiceListRequest({ programId, filters: apiFilters }));
      (navigation as any).setParams({ refreshList: false });
    }, [hasAnyProgramContext, programId, apiFilters, dispatch, navigation, routeParams?.refreshList]),
  );

  // Auto-refresh permissions and reset search on screen focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPermissionsRequest());
      // setSearchText(''); // REMOVED: Search should persist when returning from detail view
    }, [dispatch]),
  );

  useEffect(() => {
    if (!showApproveRejectModal || !programId) return;
    dispatch(fetchDealerInfoRequest(programId));
  }, [showApproveRejectModal, programId, dispatch]);

  const dueDateCalculatedFrom = useMemo(
    () => readDueDateCalculatedFrom(dealerInfo?.basic_parameters),
    [dealerInfo?.basic_parameters],
  );

  useEffect(() => {
    if (!showApproveRejectModal || !selectedInvoiceId) {
      setAnchorCheckerInvoiceDetails(null);
      return;
    }
    let cancelled = false;
    setAnchorCheckerDetailsLoading(true);
    invoiceApi
      .getInvoiceDetails(selectedInvoiceId)
      .then((data: any) => {
        if (cancelled) return;
        const selectedListRow = (() => {
          const raw = invoiceListRaw.find((inv: InvoiceListItemApi) => inv.id === selectedInvoiceId);
          return raw ? mapApiToRow(raw) : undefined;
        })();
        const apm = data?.anchorParticipantMapping;
        const party = data?.party;
        const program = data?.program;
        const rawDealerName =
          apm?.party?.entity_name ??
          apm?.party?.name ??
          data?.counter_party_name ??
          '';
        const dealerName =
          decryptValue(rawDealerName) ||
          rawDealerName ||
          selectedListRow?.dealerName ||
          selectedListRow?.counterParty ||
          '-';

        const rawAnchorName =
          party?.entity_name ??
          party?.name ??
          data?.primary_party_name ??
          program?.program_name ??
          '';
        let anchorName =
          decryptValue(rawAnchorName) ||
          rawAnchorName ||
          selectedListRow?.primaryParty ||
          '-';
        let dealerNameResolved = dealerName;
        if (effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE) {
          [anchorName, dealerNameResolved] = [dealerNameResolved, anchorName];
        }

        const partyCode =
          apm?.company_code_given_by_party ??
          selectedListRow?.dealerCode ??
          '';
        const odAccountNumber =
          decryptValue(apm?.od_account_no ?? '') || apm?.od_account_no || '';

        const invoiceDate =
          formatApiInvoiceDate(data?.invoice_date) ||
          (data?.invoice_date ? formatDateDash(data.invoice_date) : '') ||
          selectedListRow?.invoiceDate ||
          '';
        const invoiceDueDate =
          formatApiInvoiceDate(data?.invoice_due_date) ||
          (data?.invoice_due_date ? formatDateDash(data.invoice_due_date) : '') ||
          selectedListRow?.dueDate ||
          '';
        const grnDate = formatApiInvoiceDate(data?.grn_date) || '';
        const paymentDate = formatApiInvoiceDate(data?.payment_date) || '';
        const poRefNo =
          data?.po_ref_no != null && String(data.po_ref_no).trim() !== ''
            ? String(data.po_ref_no)
            : '';
        const tenorDays =
          data?.tenor != null && data?.tenor !== ''
            ? String(Math.round(Number(data.tenor)))
            : '';

        const subTotalAmount = Number(data?.sub_total) || 0;
        const discountAmount = Number(data?.discount_total) || 0;
        const taxAmount = Number(data?.tax_total) || 0;
        const advanceInterest = Number(data?.upfront_interest) || 0;
        const tdsAmount = Number(data?.tds_amount) || 0;
        const netDisbursementAmount = resolveNetDisbursementAmountFromInvoice(data);
        const invoiceAmountValue = computeInvoiceTaxableBase(
          subTotalAmount,
          discountAmount,
          taxAmount,
        );
        const invoiceAmount =
          invoiceAmountValue > 0
            ? `Rs. ${invoiceAmountValue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} /-`
            : selectedListRow?.invoiceAmount || 'Rs. 0 /-';
        const programNameFromApi = program?.program_name || '';

        // Prefer creditToBankAccount; fall back to list/program bank_details.
        const rawInvoice = invoiceListRaw.find((inv: any) => inv.id === selectedInvoiceId);
        const bankDetails =
          data?.creditToBankAccount?.accountNumber ??
          (Array.isArray(program?.bank_details)
            ? program?.bank_details?.[0]?.account_number
            : program?.bank_details?.account_number) ??
          rawInvoice?.program?.bank_details?.[0]?.account_number ??
          data?.credit_to ??
          '';
        const rawAccNumber = bankDetails || '';
        const decryptedAcc = rawAccNumber ? decryptValue(String(rawAccNumber)) : '';
        const creditTo =
          (decryptedAcc && decryptedAcc !== String(rawAccNumber)
            ? decryptedAcc
            : rawAccNumber
              ? String(rawAccNumber)
              : '') || '';

        let creditAccountNumber = '-';
        if (creditTo && programNameFromApi) {
          creditAccountNumber = `(${creditTo}) ${programNameFromApi}`;
        } else if (creditTo) {
          creditAccountNumber = creditTo;
        } else if (programNameFromApi) {
          creditAccountNumber = programNameFromApi;
        }

        const items: ApproveRejectInvoiceItem[] = (data?.invoiceItems || []).map(
          (it: any, idx: number) => {
            const lineTotal = Number(it.total) || 0;
            const lineDiscount = Number(it.discount_amount) || 0;
            const taxes = Array.isArray(it.taxes) ? it.taxes : [];
            const lineTaxAmount = taxes.reduce(
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
              unit: String(it.unit ?? '-'),
              price,
              discountAmount: lineDiscount,
              discountPercent,
              taxAmount: lineTaxAmount,
              taxLabel,
              total: lineTotal,
            };
          },
        );

        const attachments = (() => {
          const fromApi = data?.attachment ?? data?.attachments;
          if (Array.isArray(fromApi) && fromApi.length > 0) {
            return fromApi
              .map((a: any, idx: number) => {
                const attachment_url = String(
                  a?.attachment_url ?? a?.attachmentUrl ?? '',
                ).trim();
                const existingFull = String(a?.fullUrl ?? '').trim();
                const sourcePath = attachment_url || existingFull;
                if (!sourcePath) return null;
                return {
                  id: Number(a?.id) || idx,
                  attachment_url: attachment_url || existingFull,
                  fullUrl: buildInvoiceAttachmentUrl(sourcePath) || existingFull,
                };
              })
              .filter(Boolean) as InvoiceAttachmentItem[];
          }
          return mapInvoiceAttachmentsWithUrls(data);
        })();

        setAnchorCheckerInvoiceDetails({
          dealerName: dealerNameResolved,
          anchorName,
          partyCode,
          odAccountNumber,
          creditTo,
          creditAccountNumber,
          invoiceDate,
          invoiceDueDate,
          grnDate,
          paymentDate,
          poRefNo,
          tenorDays,
          invoiceAmount,
          subTotal: invoiceAmount,
          subTotalAmount,
          discountAmount,
          taxAmount,
          advanceInterest,
          tdsAmount,
          netDisbursementAmount,
          roiPercent: resolveInvoiceRoiPercent(data),
          finalPayableAmount: invoiceAmount,
          finalDueDate: invoiceDueDate,
          items,
          attachments,
          invoiceStatus: formatStatus(
            data?.invoice_status || selectedListRow?.invoiceStatus || '',
          ),
          approvalStatus: resolveApprovalStatusLabel(
            data?.approval_status || selectedListRow?.rawApprovalStatus,
            data?.current_step?.role,
          ),
          adminStatus: formatStatus(
            data?.admin_status || selectedListRow?.adminStatus || '',
          ),
        });
      })
      .catch(() => {
        // Keep prefilled row-level details when API detail fetch fails
      })
      .finally(() => {
        if (!cancelled) setAnchorCheckerDetailsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    showApproveRejectModal,
    selectedInvoiceId,
    invoiceListRaw,
    effectiveProductCode,
  ]);

  useEffect(() => {
    if (!showCheckerApprovalModal || !selectedInvoiceId) {
      setApprovalHistoryEntries([]);
      setApprovalHistoryLoading(false);
      return;
    }
    let cancelled = false;
    setApprovalHistoryLoading(true);
    setApprovalHistoryEntries([]);
    invoiceApi
      .getInvoiceApprovalHistory(selectedInvoiceId)
      .then((logs: any[]) => {
        if (cancelled) return;
        const entries = (Array.isArray(logs) ? logs : [])
          .map(log => {
            try {
              return mapApprovalLogToTimelineStep(log);
            } catch {
              return null;
            }
          })
          .filter((entry): entry is WorkflowStep => entry !== null);
        setApprovalHistoryEntries(entries);
      })
      .catch(() => {
        if (!cancelled) setApprovalHistoryEntries([]);
      })
      .finally(() => {
        if (!cancelled) setApprovalHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showCheckerApprovalModal, selectedInvoiceId]);

  const banks = [...new Set(invoiceData.map(r => r.bankName).filter(Boolean))].sort();
  const products = [...new Set(invoiceData.map(r => r.productName).filter(Boolean))].sort();
  const programs = [...new Set(invoiceData.map(r => r.programName).filter(Boolean))].sort();
  const primaryParties = [...new Set(invoiceData.map(r => r.primaryParty).filter(Boolean))].sort();
  const counterParties = [...new Set(invoiceData.map(r => r.counterParty).filter(Boolean))].sort();
  const invoiceStatuses = [...new Set(invoiceData.map(r => r.invoiceStatus).filter(Boolean))].sort();
  const adminStatuses = [...new Set(invoiceData.map(r => r.adminStatus).filter(Boolean))].sort();
  const invoiceFilterData = {
    Bank: banks.length ? banks : ['No data'],
    Product: products.length ? products : ['No data'],
    Program: programs.length ? programs : ['No data'],
    'Primary Party': primaryParties.length ? primaryParties : ['No data'],
    'Counter Party': counterParties.length ? counterParties : ['No data'],
    'Invoice Status': invoiceStatuses.length ? invoiceStatuses : ['No data'],
    'Admin Status': adminStatuses.length ? adminStatuses : ['No data'],
  };

  useEffect(() => {
    setVisibleCount(30);
  }, [appliedFilters, searchText, programId, selectedDealerName]);

  const paginatedData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 20, filteredData.length));
  }, [filteredData.length]);

  const handleMenuToggle = (invoiceId: string) => {
    if (openMenuId === invoiceId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }
    const ref = menuButtonRefs.current[invoiceId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({ x, y, width, height });
        setOpenMenuId(invoiceId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(invoiceId);
    }
  };

  const handleInvoiceNoPress = useCallback(
    (invoiceId: string, invoiceNo: string) => {
      const row =
        filteredData.find(r => r.invoiceNo === invoiceNo || r.id === invoiceId) ??
        invoiceData.find(r => r.invoiceNo === invoiceNo || r.id === invoiceId);
      const resolvedInvoiceId = row?.id || invoiceId;
      (navigation as any).navigate('InvoiceDetailView', {
        invoiceId: resolvedInvoiceId,
        invoiceNo,
        programId,
        fromInvoiceDashboard,
        returnRoute: 'InvoiceDetails',
        listInvoiceStatus: row?.rawInvoiceStatus,
        listApprovalStatus: row?.rawApprovalStatus,
        listAdminStatus: row?.rawAdminStatus,
        listActionable: row?.actionable,
      });
    },
    [navigation, programId, fromInvoiceDashboard, filteredData, invoiceData],
  );

  const handleMenuAction = (action: string, invoiceId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    const invoiceNo =
      filteredData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceId;
    const rowForAction =
      filteredData.find(item => item.id === invoiceId) ??
      invoiceData.find(item => item.id === invoiceId);

    switch (action) {
      case 'viewDetails':
        (navigation as any).navigate('InvoiceDetailView', {
          invoiceId,
          invoiceNo,
          programId,
          fromInvoiceDashboard,
          returnRoute: 'InvoiceDetails',
          listInvoiceStatus: rowForAction?.rawInvoiceStatus,
          listApprovalStatus: rowForAction?.rawApprovalStatus,
          listAdminStatus: rowForAction?.rawAdminStatus,
          listActionable: rowForAction?.actionable,
        });
        break;
      case 'edit':
        (navigation as any).navigate('CreateInvoice', {
          invoiceId,
          invoiceNo,
          mode: 'edit',
        });
        break;
      case 'checkerApproval':
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setApprovalHistorySummary({
          invoiceAmount: rowForAction?.invoiceAmount,
          counterParty: rowForAction?.counterParty,
          primaryParty: rowForAction?.primaryParty,
          raisedOn: rowForAction?.requestDate,
          dueOn: rowForAction?.dueDate,
          programName: rowForAction?.programName,
        });
        setShowCheckerApprovalModal(true);
        break;
      case 'recreateInvoice':
        (navigation as any).navigate('CreateInvoice', {
          invoiceId,
          invoiceNo,
          mode: 'recreate',
        });
        break;
      case 'approvalHistory':
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setApprovalHistorySummary({
          invoiceAmount: rowForAction?.invoiceAmount,
          counterParty: rowForAction?.counterParty,
          primaryParty: rowForAction?.primaryParty,
          raisedOn: rowForAction?.requestDate,
          dueOn: rowForAction?.dueDate,
          programName: rowForAction?.programName,
        });
        setShowCheckerApprovalModal(true);
        break;
      case 'delete':
        Alert.alert(
          'Delete Invoice',
          'Are you sure you want to delete this invoice? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  const res = await invoiceApi.deleteInvoice(invoiceId);
                  if (res?.statusCode === 200 || res?.status === 200) {
                    Toast.show({
                      type: 'success',
                      text1: 'Success',
                      text2: 'Invoice deleted successfully',
                    });
                    refreshInvoiceList();
                  } else {
                    Toast.show({
                      type: 'error',
                      text1: 'Delete Failed',
                      text2: res?.message || 'Failed to delete invoice',
                    });
                  }
                } catch (e: any) {
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: (e as Error)?.message || 'An error occurred during deletion',
                  });
                }
              },
            },
          ],
        );
        break;
      case 'approveReject': {
        const isVfApproval =
          effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE;
        const listPrimaryParty = rowForAction?.primaryParty || '-';
        const listCounterParty =
          rowForAction?.dealerName || rowForAction?.counterParty || '-';
        setAnchorCheckerInvoiceDetails({
          dealerName: isVfApproval ? listPrimaryParty : listCounterParty,
          anchorName: isVfApproval ? listCounterParty : listPrimaryParty,
          partyCode: rowForAction?.dealerCode || '',
          creditAccountNumber: rowForAction?.creditAccountNumber || '-',
          creditTo: rowForAction?.creditAccountNumber || '-',
          invoiceDate: rowForAction?.invoiceDate || '',
          invoiceDueDate: rowForAction?.dueDate || '',
          finalDueDate: rowForAction?.dueDate || '',
          invoiceAmount: rowForAction?.invoiceAmount || 'Rs. 0 /-',
          subTotal: rowForAction?.invoiceAmount || '-',
          finalPayableAmount: rowForAction?.invoiceAmount || '-',
          items: [],
          attachments: [],
          invoiceStatus: rowForAction?.invoiceStatus || '',
          approvalStatus: rowForAction?.approvalStatus || '',
          adminStatus: rowForAction?.adminStatus || '',
        });
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setShowApproveRejectModal(true);
        break;
      }
      case 'invoiceVerification': {
        const isVfVerification =
          effectiveProductCode === PRODUCT_CODES.VENDOR_FINANCE;
        const verifyPrimaryParty = rowForAction?.primaryParty || '-';
        const verifyCounterParty =
          rowForAction?.dealerName || rowForAction?.counterParty || '-';
        setAnchorCheckerInvoiceDetails({
          dealerName: isVfVerification ? verifyPrimaryParty : verifyCounterParty,
          anchorName: isVfVerification ? verifyCounterParty : verifyPrimaryParty,
          partyCode: rowForAction?.dealerCode || '',
          creditAccountNumber: rowForAction?.creditAccountNumber || '-',
          creditTo: rowForAction?.creditAccountNumber || '-',
          invoiceDate: rowForAction?.invoiceDate || '',
          invoiceDueDate: rowForAction?.dueDate || '',
          invoiceAmount: rowForAction?.invoiceAmount || 'Rs. 0 /-',
          invoiceStatus: rowForAction?.invoiceStatus || '',
          approvalStatus: rowForAction?.approvalStatus || '',
          adminStatus: rowForAction?.adminStatus || '',
        });
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setShowApproveRejectModal(true);
        break;
      }
      case 'financeRequest': {
        if (isCashnTechUser) {
          break;
        }
        const runFinanceRequestPreview = async () => {
          setFinanceRequestInvoiceId(invoiceId);
          setSelectedInvoiceId(invoiceId);
          setSelectedInvoiceNo(invoiceNo);
          setFinanceRequestPreview(null);
          setFinanceRequestLoading(true);
          setShowFinanceRequestModal(true);
          try {
            const previewRes = await invoiceApi.getFinanceRequestPreview(invoiceId);
            const preview =
              previewRes?.data ?? previewRes?.result ?? previewRes ?? {};
            if (!preview || typeof preview !== 'object') {
              throw new Error('Empty Finance Request preview');
            }
            setFinanceRequestPreview(preview);
          } catch (e: any) {
            setShowFinanceRequestModal(false);
            setFinanceRequestPreview(null);
            setFinanceRequestInvoiceId(null);
            Toast.show({
              type: 'error',
              text1: 'Preview Failed',
              text2:
                e?.response?.data?.message ||
                e?.message ||
                'Could not load Finance Request preview',
            });
          } finally {
            setFinanceRequestLoading(false);
          }
        };
        runFinanceRequestPreview();
        break;
      }
      case 'attachment': {        const listItem = invoiceListRaw.find(inv => inv.id === invoiceId);
        setAttachmentFallback(mapInvoiceAttachmentsWithUrls(listItem ?? {}));
        setSelectedInvoiceId(invoiceId);
        setShowAttachmentModal(true);
        break;
      }
      case 'print':
        break;
      case 'payMeEarly':
        break;
    }
  };

  const closeFinanceRequestModal = useCallback(() => {
    if (financeRequestSubmitting) return;
    setShowFinanceRequestModal(false);
    setFinanceRequestPreview(null);
    setFinanceRequestLoading(false);
    setFinanceRequestInvoiceId(null);
  }, [financeRequestSubmitting]);

  const submitFinanceRequest = useCallback(
    async (payload: {preferredDisbursementDate: string}) => {
      if (!financeRequestInvoiceId || financeRequestSubmitting || financeRequestLoading) {
        return;
      }
      setFinanceRequestSubmitting(true);
      try {
        const res = await invoiceApi.submitWorkflowStatusAction({
          invoiceId: financeRequestInvoiceId,
          action: 'Finance Request',
          remark: '-',
          preferredDisbursementDate: payload.preferredDisbursementDate,
        });
      if (res?.statusCode === 200 || res?.status === 200) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Finance Request submitted successfully',
        });
        setShowFinanceRequestModal(false);
        setFinanceRequestPreview(null);
        setFinanceRequestInvoiceId(null);
        refreshInvoiceList();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Finance Request Failed',
          text2: res?.message || 'Failed to submit Finance Request',
        });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          e?.response?.data?.message ||
          e?.message ||
          'Failed to submit Finance Request',
      });
    } finally {
      setFinanceRequestSubmitting(false);
    }
  }, [
    financeRequestInvoiceId,
    financeRequestSubmitting,
    financeRequestLoading,
    refreshInvoiceList,
  ]);

  const isInvoiceSelectable = useCallback((item: any) => {
    if (typeof item.actionable === 'boolean') {
      if (isCashnTechUser) {
        return isInvoiceBulkSelectable(item, {
          isCashnTechUser,
          hasFunctionalPermission,
          canVerify,
        });
      }
      return item.actionable && hasFunctionalPermission;
    }

    // Legacy fallback when actionable is absent from list API
    if (isCashnTechUser) {
      return isInvoiceBulkSelectable(item, {
        isCashnTechUser,
        hasFunctionalPermission,
        canVerify,
      });
    }

    const programMethod = programSelection?.method;
    const userRoleInternal = programSelection?.role?.toLowerCase().replace(' ', '_');

    if (programMethod === "Push" && userRoleInternal === "anchor_checker") {
       // follow original logic for checker turn below
    } else if (programMethod === "Pull" && userRoleInternal === "dealer_checker") {
       // follow original logic for checker turn below
    } else if (userRoleInternal === "anchor_checker" || userRoleInternal === "dealer_checker") {
       return false;
    }

    const iStatus = (item.rawInvoiceStatus || '').toLowerCase();
    const aStatus = (item.rawAdminStatus || '').toLowerCase();
    const approvalS = (item.rawApprovalStatus || '').trim().toUpperCase().replace(/_/g, ' ');

    // 1. Basic Backend Blocks
    if (iStatus === 'draft') return false;
    if (approvalS.includes('PENDING ATTACHMENT') || iStatus === 'attachment pending') return false;
    if (aStatus === 'verified') return false;

    // 2. Functional Permission Check (Sync with 3-dots)
    if (!hasFunctionalPermission) return false;

    // For regular roles, check if approval_status contains "PENDING [ROLE]"
    const roleLabel = (storedUserRole || '').trim().toUpperCase();
    if (isAnchorAllAccess || isDealerAllAccess) {
       const baseRole = isAnchorAllAccess ? 'ANCHOR' : 'DEALER';
       return approvalS.includes(`PENDING ${baseRole} CHECKER`) || approvalS.includes(`PENDING ${baseRole} MAKER`);
    }
    
    if (roleLabel) {
      const expected = `PENDING ${roleLabel}`;
      return approvalS.includes(expected);
    }

    return false;
  }, [isCashnTechUser, storedUserRole, hasFunctionalPermission, canVerify, programSelection?.method, programSelection?.role, isAnchorAllAccess, isDealerAllAccess]);

  const toggleInvoiceSelection = (invoiceId: string) => {
    const item = filteredData.find(r => r.id === invoiceId) || invoiceData.find(r => r.id === invoiceId);
    if (!item) return;

    const isSelected = selectedInvoiceIds.includes(invoiceId);
    // Allow clearing stale selections after refresh/status change.
    if (isSelected) {
      setSelectedInvoiceIds(prev => prev.filter(id => id !== invoiceId));
      setSelectedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      return;
    }

    if (!isInvoiceSelectable(item)) {
      Toast.show({
        type: 'info',
        text1: 'Not eligible',
        text2: 'Invoice not ready for bulk action.',
      });
      return;
    }

    setSelectedInvoiceIds(prev => [...prev, invoiceId]);
    setSelectedInvoices(prev => [
      ...prev,
      {
        id: item.id,
        invoiceNo: item.invoiceNo,
        dealerName: item.dealerName || item.counterParty,
        amount: item.invoiceAmount,
        dueDate: item.dueDate,
        rawApprovalStatus: item.rawApprovalStatus,
      },
    ]);
  };

  // Drop selections that are no longer bulk-eligible (e.g. after refresh or status change).
  useEffect(() => {
    const eligibleIds = new Set(
      filteredData.filter(row => isInvoiceSelectable(row)).map(row => row.id),
    );
    setSelectedInvoiceIds(prev => {
      const next = prev.filter(id => eligibleIds.has(id));
      return next.length === prev.length ? prev : next;
    });
    setSelectedInvoices(prev => {
      const next = prev.filter(inv => eligibleIds.has(inv.id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredData, isInvoiceSelectable]);

  const selectedRowsForModal = invoiceData.filter(row =>
    selectedInvoiceIds.includes(row.id),
  );

  const selectedRow =
    filteredData.find(r => r.id === selectedInvoiceId) ??
    invoiceData.find(r => r.id === selectedInvoiceId);

  const selectedInvoiceDetails = selectedRow
    ? {
      subTotal: selectedRow.invoiceAmount,
      withholdingTaxesPercent: undefined,
      withholdingAmount: undefined,
      finalPayableAmount: selectedRow.invoiceAmount,
      finalDueDate: selectedRow.dueDate,
      invoiceStatus: selectedRow.invoiceStatus || '',
      approvalStatus: selectedRow.approvalStatus || '',
      adminStatus: selectedRow.adminStatus || '',
    }
    : undefined;

  const allSelectedOnScreen = (() => {
    if (isCashnTechUser) {
      const pendingItems = filteredData.filter(
        row =>
          (row.rawAdminStatus || '').trim().toUpperCase() === 'PENDING_VERIFICATION' ||
          (row.rawAdminStatus || '').trim().toUpperCase() === 'PENDING VERIFICATION',
      );
      return pendingItems.length > 0 && pendingItems.every(row => selectedInvoiceIds.includes(row.id));
    }
    const selectableItems = filteredData.filter(row => isInvoiceSelectable(row));
    return (
      selectableItems.length > 0 &&
      selectableItems.every(row => selectedInvoiceIds.includes(row.id))
    );
  })();

  const checkerRoleContext = useMemo(
    () => ({
      isAnchorChecker,
      isDealerMaker,
      isDealerChecker,
    }),
    [isAnchorChecker, isDealerMaker, isDealerChecker],
  );

  const resolveWorkflowLevelForInvoice = useCallback(
    (_invoiceId?: string) =>
      getBestWorkflowApprovalLevelFromScope(scopeData, {
        productId: programSelection?.productId,
        programId: concreteProgramId || programId || undefined,
      }) ?? programSelection?.approvalLevel ?? null,
    [
      scopeData,
      programSelection?.productId,
      programSelection?.approvalLevel,
      concreteProgramId,
      programId,
    ],
  );

  const resolveApprovalLevelForInvoice = useCallback(
    (invoiceId: string) => {
      const row =
        filteredData.find(r => r.id === invoiceId) ||
        invoiceData.find(r => r.id === invoiceId);
      return getInvoiceApprovalLevel({
        workflowLevelFromScope: resolveWorkflowLevelForInvoice(invoiceId),
        rawApprovalStatus: row?.rawApprovalStatus,
        ...checkerRoleContext,
      });
    },
    [
      filteredData,
      invoiceData,
      resolveWorkflowLevelForInvoice,
      checkerRoleContext,
    ],
  );

  const approvalLevel = selectedInvoiceId
    ? resolveApprovalLevelForInvoice(selectedInvoiceId)
    : resolveApprovalLevelForInvoice('');

  const toggleSelectAllVisible = () => {
    if (
      !isDealerChecker &&
      !isAnchorChecker &&
      !isCashnTechUser &&
      !isAnchorAllAccess &&
      !isDealerAllAccess
    ) {
      return;
    }

    const visibleItems = filteredData.filter(row => isInvoiceSelectable(row));
    const visibleIds = visibleItems.map(row => row.id);

    if (visibleItems.length === 0) {
      if (selectedInvoiceIds.length > 0) {
        setSelectedInvoiceIds([]);
        setSelectedInvoices([]);
        return;
      }
      if (filteredData.length > 0) {
        Toast.show({
          type: 'info',
          text1: 'No eligible invoices',
          text2: 'None ready for bulk action.',
        });
      }
      return;
    }

    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every(id => selectedInvoiceIds.includes(id));

    if (allVisibleSelected) {
      setSelectedInvoiceIds(prev => prev.filter(id => !visibleIds.includes(id)));
      setSelectedInvoices(prev => prev.filter(inv => !visibleIds.includes(inv.id)));
    } else {
      setSelectedInvoiceIds(prev => Array.from(new Set([...prev, ...visibleIds])));

      const newItems = visibleItems.filter(row => !selectedInvoiceIds.includes(row.id)).map(row => ({
        id: row.id,
        invoiceNo: row.invoiceNo,
        dealerName: row.dealerName || row.counterParty,
        amount: row.invoiceAmount,
        dueDate: row.dueDate,
        rawApprovalStatus: row.rawApprovalStatus,
      }));
      setSelectedInvoices(prev => [...prev, ...newItems]);
    }
  };

  const onApproveRejectApprove = (
    invoiceId: string,
    remarks?: string,
    grnDate?: string,
  ) => {
    if (!canApprove) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'You do not have permission to approve invoices.',
      });
      return;
    }
    dispatch(
      updateInvoiceStatusRequest({
        invoiceId,
        action: 'Approve',
        approvalLevel: resolveApprovalLevelForInvoice(invoiceId),
        remark: remarks,
        grnDate,
        programId,
        filters: apiFilters,
      }),
    );
    setShowApproveRejectModal(false);
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
    setAnchorCheckerInvoiceDetails(null);
  };

  const onApproveRejectReject = (
    invoiceId: string,
    remarks?: string,
    grnDate?: string,
  ) => {
    // Maker/checker workflow reject uses PATCH /invoice/status (same as approve); web often grants only approve permission.
    if (!canReject && !canApprove) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'You do not have permission to reject invoices.',
      });
      return;
    }
    dispatch(
      updateInvoiceStatusRequest({
        invoiceId,
        action: 'Reject',
        approvalLevel: resolveApprovalLevelForInvoice(invoiceId),
        remark: remarks,
        grnDate,
        programId,
        filters: apiFilters,
      }),
    );
    setShowApproveRejectModal(false);
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
    setAnchorCheckerInvoiceDetails(null);
  };

  const onVerifyApprove = (invoiceId: string, remarks?: string) => {
    if (!canVerify) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'You do not have permission to verify invoices.',
      });
      return;
    }
    const invNo = selectedInvoiceNo;
    dispatch(
      updateInvoiceVerificationRequest({
        invoiceId,
        action: 'Verify',
        remark: remarks,
        programId,
        filters: apiFilters,
        onSuccess: () =>
          (navigation as any).navigate('InvoiceDetailView', {
            invoiceId,
            invoiceNo: invNo || invoiceId,
            programId,
            fromInvoiceDashboard,
            returnRoute: 'InvoiceDetails',
          }),
      }),
    );
    setShowApproveRejectModal(false);
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
    setAnchorCheckerInvoiceDetails(null);
  };

  const onVerifyReject = (invoiceId: string, remarks?: string) => {
    if (!canVerify) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'You do not have permission to reject verification.',
      });
      return;
    }
    dispatch(
      updateInvoiceVerificationRequest({
        invoiceId,
        action: 'Reject',
        remark: remarks,
        programId,
        filters: apiFilters,
      }),
    );
    setShowApproveRejectModal(false);
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
    setAnchorCheckerInvoiceDetails(null);
  };

  const onVerifyHold = (invoiceId: string, remarks?: string) => {
    if (!canVerify) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'You do not have permission to update invoice verification.',
      });
      return;
    }
    dispatch(
      updateInvoiceVerificationRequest({
        invoiceId,
        action: 'On Hold',
        remark: remarks,
        programId,
        filters: apiFilters,
      }),
    );
    setShowApproveRejectModal(false);
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
    setAnchorCheckerInvoiceDetails(null);
  };

  const [bulkAction, setBulkAction] = useState<'Verify' | 'Reject' | 'On Hold' | 'Approve'>('Verify');
  const [showBulkReviewModal, setShowBulkReviewModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const lookupRawApprovalStatus = useCallback(
    (invoiceId: string) => {
      const fromRow =
        invoiceData.find(r => r.id === invoiceId)?.rawApprovalStatus ||
        filteredData.find(r => r.id === invoiceId)?.rawApprovalStatus;
      if (fromRow) return fromRow;
      const fromSelection = selectedInvoices.find(
        (inv: {id?: string; rawApprovalStatus?: string}) => inv.id === invoiceId,
      ) as {rawApprovalStatus?: string} | undefined;
      return fromSelection?.rawApprovalStatus;
    },
    [invoiceData, filteredData, selectedInvoices],
  );

  const onBulkApply = (payload: {
    action: 'Verify' | 'Approve' | 'Reject' | 'On Hold';
    invoices: {
      invoiceId: string;
      action: string;
      remark: string;
      approvalRemark?: string;
    }[];
  }) => {
    // Workflow bulk approve/reject → PATCH /invoice/bulk/status (web: approve permission is enough for maker reject).
    const isWorkflowApproveRejectBulk =
      !isCashnTechUser &&
      (payload.action === 'Approve' || payload.action === 'Reject');

    const hasPermission =
      (payload.action === 'Verify' && canVerify) ||
      (payload.action === 'Approve' && canApprove) ||
      (payload.action === 'Reject' &&
        (canReject || (isWorkflowApproveRejectBulk && canApprove))) ||
      (payload.action === 'On Hold' && (canVerify || canApprove));

    if (!hasPermission) {
      setBulkLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: `You do not have permission to perform bulk ${payload.action.toLowerCase()}.`,
      });
      return;
    }

    const isCheckerBulk = isWorkflowApproveRejectBulk;

    dispatch(
      bulkUpdateInvoiceRequest({
        action: payload.action,
        invoices: payload.invoices.map(inv => ({
          ...inv,
          approval_level: isCheckerBulk
            ? getInvoiceApprovalLevelForId(
                inv.invoiceId,
                lookupRawApprovalStatus,
                checkerRoleContext,
                resolveWorkflowLevelForInvoice(inv.invoiceId),
              )
            : undefined,
        })),
        programId: programId || '',
        filters: apiFilters,
        isVerification: isCashnTechUser, // Admin users use verification API
        onSuccess: () => {
          setShowBulkReviewModal(false);
          setSelectedInvoiceIds([]);
          setSelectedInvoices([]);
          setBulkLoading(false);
        },
        onFailure: () => setBulkLoading(false),
      }),
    );
  };

  const handleBulkReviewSubmit = (payload: Parameters<typeof onBulkApply>[0]) => {
    setBulkLoading(true);
    onBulkApply(payload);
  };

  const handleBulkAction = (action: 'Verify' | 'Reject' | 'On Hold' | 'Approve') => {
    if (selectedInvoices.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Selection',
        text2: `Please select at least one ${isCashnTechUser ? 'Pending Verification' : ''} invoice to proceed.`,
      });
      return;
    }
    setBulkAction(action);
    setShowBulkReviewModal(true);
  };

  const getMenuPosition = React.useCallback(
    (anchor: { x: number; y: number; width: number; height: number } | null) => {
      const screen = Dimensions.get('window');
      const menuWidth = scaleWidth(210);
      const horizontalPadding = scaleWidth(12);
      const topPadding = scaleHeight(8);
      if (!anchor) {
        return {
          position: 'absolute' as const,
          top: topPadding + scaleHeight(60),
          right: horizontalPadding,
        };
      }
      const desiredLeft = anchor.x + anchor.width - menuWidth;
      const left = Math.max(
        horizontalPadding,
        Math.min(desiredLeft, screen.width - menuWidth - horizontalPadding),
      );
      const top = Math.max(topPadding, anchor.y + anchor.height + scaleHeight(6));
      return { position: 'absolute' as const, top, left };
    },
    [],
  );


  const programMethod = programSelection?.method;
  const userRoleInternal = programSelection?.role?.toLowerCase().replace(' ', '_');
  // vendor_maker maps to the same counterparty-maker category as dealer_maker
  const normalizedRoleInternal =
    userRoleInternal === 'vendor_maker' ? 'dealer_maker' : userRoleInternal;

  let createInvoiceDisabledReason: string | null = null;

  if (!programSelection?.programId) {
    createInvoiceDisabledReason = "Select a program from the filter to create an invoice";
  } else if (programSelection?.status === "Inactive") {
    createInvoiceDisabledReason = "Program is inactive please contact admin";
  } else {
    const isAllowedByMethod =
      (programMethod === "Pull" && normalizedRoleInternal === "dealer_maker") ||
      (programMethod === "Push" && normalizedRoleInternal === "anchor_maker");
    if (!isAllowedByMethod) {
      createInvoiceDisabledReason =
        'You are not allowed to create invoice for this method';
    }
  }

  const isCreateInvoiceEnabled = createInvoiceDisabledReason === null;

  const onCreateInvoicePress = React.useCallback(() => {
    if (!canCreate) {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'You do not have permission to create invoices.',
      });
      return;
    }

    if (!isCreateInvoiceEnabled) {
      Toast.show({
        type: 'info',
        text1: 'Creation Restricted',
        text2: createInvoiceDisabledReason || 'Check program selection and role permissions.',
      });
      return;
    }

    (navigation as any).navigate('CreateInvoice', {freshCreate: true});
  }, [navigation, canCreate, isCreateInvoiceEnabled, createInvoiceDisabledReason]);

  const userPartyType = isCashnTechUser ? 'cashntech' : (isAnchorMaker || isAnchorChecker) ? 'anchor' : 'dealer';

  const { pendingCount, draftCount, actionRequiredCount } = React.useMemo(() => {
    let pending = 0;
    let draft = 0;
    let actionRequired = 0;

    const myApprovalLevel = String(approvalLevel);

    invoiceData.forEach(row => {
      const iStatusRaw = (row.rawInvoiceStatus || '').trim();
      const approvalStatus = (row.rawApprovalStatus || '').trim();

      // Fix 1 — Draft badge logic
      const isDraftState =
        canImport &&
        (isAnchorMaker || isDealerMaker) &&
        iStatusRaw === 'Draft' &&
        approvalStatus === 'Pending Attachment';
      if (isDraftState) {
        draft++;
      }

      // Fix 3 — Action Required logic
      const isActionRequired =
        canEdit &&
        (isAnchorMaker || isDealerMaker) &&
        iStatusRaw === 'Rejected';
      if (isActionRequired) {
        actionRequired++;
      }

      // Fix 2 — Pending Invoice Approval logic (web Ze parity) — same as blue-dot
      if (
        isPendingInvoiceApprovalRow(row, {
          isCashnTechUser: userPartyType === 'cashntech',
          canVerify,
          isAnchorMaker,
          isDealerMaker,
          isAnchorChecker,
          isDealerChecker,
          canApprove,
          canReject,
          roleLabel: storedUserRole,
          approvalLevel: myApprovalLevel,
        })
      ) {
        pending++;
      }
    });

    return { pendingCount: pending, draftCount: draft, actionRequiredCount: actionRequired };
  }, [
    invoiceData,
    userPartyType,
    isAnchorMaker,
    isAnchorChecker,
    isDealerMaker,
    isDealerChecker,
    canImport,
    canEdit,
    canApprove,
    canReject,
    canVerify,
    approvalLevel,
    storedUserRole,
  ]);

  return {
    programId,
    programName: isAllProgramScope
      ? 'All Program'
      : routeParams?.programName || programSelection?.programName || '',
    apiFilters,
    dispatch,
    navigation,
    invoiceData,
    invoiceFilterData,
    filteredData,
    paginatedData,
    hasMore,
    loadMore,
    invoiceListLoading,
    invoiceListError,
    isAnchorMaker,
    isAnchorChecker,
    isDealerMaker,
    isDealerChecker,
    isCashnTechUser,
    dealerListTitle,
    productBreadcrumbLabel,
    selectedDealerName,
    fromInvoiceDashboard,
    searchText,
    setSearchText,
    showFilterModal,
    setShowFilterModal,
    appliedFilters,
    setAppliedFilters,
    openMenuId,
    setOpenMenuId,
    setMenuAnchor,
    menuAnchor,
    menuButtonRefs,
    showCheckerApprovalModal,
    setShowCheckerApprovalModal,
    approvalHistoryEntries,
    approvalHistoryLoading,
    approvalHistorySummary,
    setApprovalHistoryLoading,
    showFinanceRequestModal,
    financeRequestPreview,
    financeRequestLoading,
    financeRequestSubmitting,
    closeFinanceRequestModal,
    submitFinanceRequest,
    showApproveRejectModal,
    setShowApproveRejectModal,
    selectedInvoiceId,
    setSelectedInvoiceId,
    selectedInvoiceNo,
    setSelectedInvoiceNo,
    selectedInvoiceDetails,
    anchorCheckerInvoiceDetails,
    anchorCheckerDetailsLoading,
    dueDateCalculatedFrom,
    effectiveProductCode,
    showAttachmentModal,
    setShowAttachmentModal,
    attachmentFallback,
    setAttachmentFallback,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    showSendForApprovalModal,
    setShowSendForApprovalModal,
    selectedRowsForModal,
    allSelectedOnScreen,
    breadcrumbBank,
    breadcrumbDealer,
    breadcrumbProgram,
    showAllProgramBreadcrumb: isAllProgramScope,
    handleMenuToggle,
    handleMenuAction,
    handleInvoiceNoPress,
    refreshInvoiceList,
    toggleInvoiceSelection,
    toggleSelectAllVisible,
    onApproveRejectApprove,
    onApproveRejectReject,
    onVerifyApprove,
    onVerifyReject,
    onVerifyHold,
    onBulkApply,
    handleBulkReviewSubmit,
    getMenuPosition,
    onCreateInvoicePress,
    isCreateInvoiceEnabled,
    createInvoiceDisabledReason,
    hasAnyProgramContext,
    canEdit,
    canImport,
    selectedInvoiceRawAdminStatus: selectedRowForMenu?.rawAdminStatus,
    selectedInvoiceRawApprovalStatus: selectedRowForMenu?.rawApprovalStatus,
    selectedInvoiceRawInvoiceStatus: selectedRowForMenu?.rawInvoiceStatus,
    selectedInvoiceActionable: selectedRowForMenu?.actionable,
    selectedInvoiceCurrentStepActionType:
      selectedRowForMenu?.currentStepActionType ?? null,
    selectedInvoiceApprovalLogsCount: selectedRowForMenu?.approvalLogsCount || 0,
    selectedInvoiceCurrentStepSequenceNo:
      selectedRowForMenu?.currentStepSequenceNo ?? null,
    selectedInvoiceProgramMethod: programSelection?.method ?? null,
    userDepartment,
    storedUserRole,
    userInfoFull,
    pendingCount,
    draftCount,
    actionRequiredCount,
    selectedInvoices,
    setSelectedInvoices,
    bulkAction,
    setBulkAction,
    showBulkReviewModal,
    setShowBulkReviewModal,
    handleBulkAction,
    bulkLoading,
    setBulkLoading,
    isAnchorAllAccess,
    isDealerAllAccess,
    isInvoiceSelectable,
  };
}
