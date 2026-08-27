import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {CompositeNavigationProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {
  AppBar,
  Container,
  FilterModal,
  ProgramBreadcrumb,
} from '@components/index';
import {getApiErrorMessage} from '@utils/apiErrorMessage';
import {MarkAsDisbursedModal} from './components/MarkAsDisbursedModal';
import {BulkMarkAsDisbursedModal} from './components/BulkMarkAsDisbursedModal';
import {BulkInvoiceEmailModal} from './components/BulkInvoiceEmailModal';
import {DisbursementBulkActionSheet} from './components/DisbursementBulkActionSheet';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {HomeNavigatorType} from '@type/NavigatorTypes';
import {Search, Dots, Filter} from '@assets/Icons';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {userSelector} from '@store/user';
import {AppRole, ROLE_LABELS} from '@constants/roles';
import {selectProgramSelection, selectAllProgramIds} from '@store/programSelection/programSelection.selector';
import {invoiceApi} from '@services/api/invoice.api';
import {formatStatus} from '@screens/Invoice/InvoiceList/components/InvoiceDetails/types';
import {formatDateDash} from '../InvoiceList/components/InvoiceDetails/types';
import Toast from 'react-native-toast-message';
import {decryptValue} from '@utils/decrypt';
import {useHasPermission} from '@hooks/index';
import {PERMISSIONS} from '@constants/permissions';
import {
  selectPermissionsLoading,
  fetchPermissionsRequest,
  selectCanSendMailToBank,
  selectCanMarkAsDisbursed,
} from '@store/permissions';
import {
  selectBulkDisbursementLoading,
  bulkDisbursementRequest,
} from '@store/invoice';
import {useDispatch} from 'react-redux';
import {
  selectActiveProductId,
  selectActiveProductName,
  selectActiveProductCode,
  selectEffectiveProductCode,
} from '@store/product/product.selectors';
import {getEffectiveProductCode} from '@store/product/product.resolver';
import {PRODUCT_CODES, PRODUCT_DISPLAY_NAMES} from '@store/product/product.types';

const STATUS_COLORS = {
  PENDING: { bg: '#FFF4E5', text: '#FF8C00' },
  SUCCESS: { bg: '#E8F5E9', text: '#2E7D32' },
  REJECTED: { bg: '#FFEBEE', text: '#D32F2F' },
  DEFAULT: { bg: '#F7F8FB', text: Colors.darkblack },
};

function normalizeInvoiceStatus(status: string | null | undefined): string {
  return (status || '').toLowerCase().trim();
}

/** Bulk select only rows shown as Invoice Status = Submitted in the list */
function isSubmittedForBulkSelect(row: DisbursementRow): boolean {
  if (normalizeInvoiceStatus(row.adminStatus) !== 'verified') return false;
  if (normalizeInvoiceStatus(row.invoiceStatus) !== 'submitted') return false;

  const hasDisbursement =
    !!row.disburseDateRaw ||
    (row.disbursedAmount != null && Number(row.disbursedAmount) > 0);
  if (hasDisbursement) return false;

  const utr = (row.utrNo || '').trim();
  if (utr && utr !== '-') return false;

  return true;
}

function isInProgressInvoiceStatus(status: string | null | undefined): boolean {
  if (!status?.trim()) return false;
  const candidates = [
    status,
    formatStatus(status),
    status.replace(/_/g, ' '),
  ];
  return candidates.some(s => normalizeInvoiceStatus(s).replace(/_/g, ' ') === 'in progress');
}

/** Invoice Status = In Progress (admin verified) — eligible for bulk mail to bank */
function isEligibleForBulkEmail(row: DisbursementRow): boolean {
  const admin = normalizeInvoiceStatus(row.adminStatus);
  if (admin && admin !== 'verified') return false;
  return (
    isInProgressInvoiceStatus(row.rawInvoiceStatus) ||
    isInProgressInvoiceStatus(row.invoiceStatus)
  );
}

function isBulkSelectableRow(row: DisbursementRow, canSendMail: boolean): boolean {
  if (isSubmittedForBulkSelect(row)) return true;
  if (canSendMail && isEligibleForBulkEmail(row)) return true;
  return false;
}

function getInvoiceStatusStyles(invoiceStatus: string) {
  const s = normalizeInvoiceStatus(invoiceStatus);
  if (s === 'disbursed' || s === 'settled') return STATUS_COLORS.SUCCESS;
  if (s === 'submitted' || s.includes('pending') || s.includes('processing')) return STATUS_COLORS.PENDING;
  if (s.includes('reject') || s.includes('fail') || s === 'cancelled') return STATUS_COLORS.REJECTED;
  return STATUS_COLORS.DEFAULT;
}

function formatAmountInr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}/-`;
}

export type DisbursementRow = {
  id: string;
  loanRefNo: string;
  invoiceNo: string;
  bankName: string;
  productName: string;
  programName: string;
  primaryParty: string;
  counterParty: string;
  invoiceAmount: string;
  invoiceDate: string;
  grnDate: string;
  dueDate: string;
  disburseDate: string;
  utrNo: string;
  invoiceStatus: string;
  rawInvoiceStatus: string;
  approvalStatus: string;
  adminStatus: string;
  finalTotal?: number;
  disbursedAmount?: number | null;
  bankId?: string;
  programId?: string;
  productId?: string;
  partyId?: string;
  counterPartyId?: string;
  invoiceDateRaw?: string | null;
  disburseDateRaw?: string | null;
};

function mapToDisbursementRow(item: any): DisbursementRow {
  const finalTotal = item.final_total ?? item.finalTotal;
  const invoiceAmount =
    finalTotal != null
      ? `${Number(finalTotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/-`
      : '-';
  const bankName =
    item.bank_name ??
    item.partnerBank?.bank_name ??
    item.program?.productConfig?.partnerBank?.bank_name ??
    '-';
  const productName =
    item.product_name ??
    item.program?.productConfig?.product?.name ??
    item.product?.name ??
    '-';
  const programName = item.program_name ?? item.program?.program_name ?? '-';
  const primaryParty =
    decryptValue(
      item.partyName ?? item.party?.entity_name ?? item.primary_party_name ?? '',
    ) || '-';
  const counterParty =
    decryptValue(
      item.counterPartyName ??
        item.anchorParticipantMapping?.party?.entity_name ??
        item.counter_party_name ??
        '',
    ) || '-';
  const bankId =
    item.partner_bank_id ??
    item.program?.productConfig?.partnerBank?.id ??
    item.partnerBank?.id;
  const programId = item.program_id ?? item.program?.id;
  const productId =
    item.program?.productConfig?.product?.id ??
    item.program?.productConfig?.product_id;
  const partyId = item.party_id ?? item.party?.id;
  const counterPartyId =
    item.anchorParticipantMapping?.party_id ??
    item.anchorParticipantMapping?.party?.id;
  return {
    id: item.id,
    loanRefNo: item.loan_ref_no ?? item.loanRefNo ?? '-',
    invoiceNo: item.invoice_ref_no ?? item.invoiceNo ?? '-',
    bankName,
    productName,
    programName,
    primaryParty,
    counterParty,
    bankId,
    programId,
    productId,
    partyId,
    counterPartyId,
    invoiceAmount,
    invoiceDate: formatDateDash(item.invoice_date ?? item.invoiceDate ?? ''),
    grnDate: formatDateDash(item.grn_date ?? item.grnDate ?? ''),
    dueDate: formatDateDash(item.invoice_due_date ?? item.invoiceDueDate ?? ''),
    disburseDate: formatDateDash(
      item.disbursement_date ?? item.disbursementDate ?? '',
    ),
    utrNo: item.utr_no ?? item.utrNo ?? '-',
    rawInvoiceStatus: (item.invoice_status ?? item.invoiceStatus ?? '').trim(),
    invoiceStatus: (() => {
      const rawStatus = (item.invoice_status ?? item.invoiceStatus ?? '').trim();
      const rawNorm = normalizeInvoiceStatus(rawStatus);
      const disbursedAmt = item.disbursed_amount ?? item.disbursedAmount;
      const hasDisbursementRecord =
        !!(item.disbursement_date ?? item.disbursementDate) ||
        (disbursedAmt != null && Number(disbursedAmt) > 0);
      // Keep In Progress / Created visible for mail-to-bank; only coerce when already disbursed path
      const keepRawLabel =
        rawNorm === 'in progress' ||
        rawNorm === 'in_progress' ||
        rawNorm === 'created';
      if (keepRawLabel) {
        return formatStatus(rawStatus) || rawStatus;
      }
      if (hasDisbursementRecord && rawNorm !== 'rejected') {
        return 'Disbursed';
      }
      return formatStatus(rawStatus) || rawStatus || (hasDisbursementRecord ? 'Disbursed' : '');
    })(),
    approvalStatus: item.approval_status ?? item.approvalStatus ?? '',
    adminStatus: item.admin_status ?? item.adminStatus ?? '',
    finalTotal: finalTotal != null ? Number(finalTotal) : undefined,
    disbursedAmount: item.disbursed_amount ?? item.disbursedAmount ?? null,
    invoiceDateRaw: item.invoice_date ?? item.invoiceDate ?? null,
    disburseDateRaw: item.disbursement_date ?? item.disbursementDate ?? null,
  };
}

export const DisbursementScreen: React.FC = () => {
  const dispatch = useDispatch();
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPermissionsRequest());
    }, [dispatch]),
  );
  const programSelection = useSelector(selectProgramSelection);
  const allProgramIds = useSelector(selectAllProgramIds);
  const activeProductName = useSelector(selectActiveProductName);
  const activeProductCode = useSelector(selectActiveProductCode);
  const productBreadcrumbLabel =
    activeProductName ||
    PRODUCT_DISPLAY_NAMES[getEffectiveProductCode(activeProductCode)];
  const programName =
    programSelection?.programScope === 'all'
      ? 'All Program'
      : programSelection?.programName ?? 'Sun Pharma PGM';
  const userInfo = useSelector(userSelector.getUserInfo);
  const isCashnTechUser =
    userRole === 'cashntech_user' ||
    !!(userRole && ROLE_LABELS[userRole as AppRole] === 'CashnTech User') ||
    String(userInfo?.user_type || '').toLowerCase().trim() === 'cashntech' ||
    String(userInfo?.email || '').toLowerCase().trim().endsWith('@cashntech.com');
  const isAnchorAllAccess = userRole === 'anchor_all_access';
  const isDealerAllAccess = userRole === 'dealer_all_access';
  const isHighPrivilege = isCashnTechUser || isAnchorAllAccess || isDealerAllAccess;
  const isAnchorChecker = userRole === 'anchor_checker';
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';

  // Permissions
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const canViewDisbursement = useHasPermission(PERMISSIONS.DISBURSEMENT);
  const canMarkAsDisbursed = isHighPrivilege || useSelector(selectCanMarkAsDisbursed);
  const canSendMail = isHighPrivilege || useSelector(selectCanSendMailToBank);
  const canDeleteDisbursement = useHasPermission(PERMISSIONS.DISBURSEMENT_DELETE);
  const canExport = useHasPermission(PERMISSIONS.DISBURSEMENT_EXPORT);
  const canFilter = useHasPermission(PERMISSIONS.DISBURSEMENT_FILTER);
  const canShowBulkActionsBtn = canMarkAsDisbursed || canSendMail;

  // The 3-dots icon itself should be visible if the user can view the screen,
  // even if they don't have secondary action permissions (per requirements).
  // EXCLUDED: anchor_maker role should not see 3 dots menu in Disbursement list
  const show3DotsIcon = canViewDisbursement && userRole !== 'anchor_maker';
  const hasNoActionPermissions = !canMarkAsDisbursed && !canSendMail;

  const [disbursementRows, setDisbursementRows] = useState<DisbursementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKpis, setApiKpis] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{x: number; y: number; width: number; height: number} | null>(null);
  const [showDisbursedModal, setShowDisbursedModal] = useState(false);
  const [selectedDisbursementId, setSelectedDisbursementId] = useState<string | null>(null);
  const [mailLoadingId, setMailLoadingId] = useState<string | null>(null);
  const [showBulkActionSheet, setShowBulkActionSheet] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const bulkDisbursementLoading = useSelector(selectBulkDisbursementLoading);
  const menuButtonRefs = useRef<Record<string, any>>({});
  const fetchRequestId = useRef(0);
  const prevSelectedCount = useRef(0);

  const shouldAutoOpenBulkSheet = isCashnTechUser || isHighPrivilege;


  const programIds = useMemo(
    () =>
      programSelection?.programScope === 'all' && allProgramIds?.length
        ? allProgramIds
        : programSelection?.programId
        ? [programSelection.programId]
        : undefined,
    [
      programSelection?.programScope,
      programSelection?.programId,
      allProgramIds,
    ],
  );

  const activeProductId = useSelector(selectActiveProductId);
  const effectiveCode = useSelector(selectEffectiveProductCode);
  const isVendorFinance = effectiveCode === PRODUCT_CODES.VENDOR_FINANCE;
  const disbursementListTitle = isVendorFinance
    ? 'Vendor Wise Invoice Details'
    : isCashnTechUser
      ? 'Invoice'
      : isDealerMaker || isDealerChecker
        ? 'Anchor Wise Invoice Details'
        : 'Dealer Wise Invoice Details';

  /** PR5/PR7 pattern: optional productId for VF list/KPI filters; omitted for DF default. */
  const overviewProductId = useMemo(() => {
    if (
      programSelection?.programScope === 'selected' &&
      programSelection?.productId
    ) {
      return programSelection.productId;
    }
    if (effectiveCode === PRODUCT_CODES.VENDOR_FINANCE && activeProductId) {
      return activeProductId;
    }
    return null;
  }, [
    programSelection?.programScope,
    programSelection?.productId,
    effectiveCode,
    activeProductId,
  ]);

  const fetchDisbursementData = useCallback(async () => {
    const requestId = ++fetchRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const filters = appliedFilters;
      let apiFilters: Parameters<typeof invoiceApi.getVerifiedList>[1] = undefined;
      // Note: Removed local row-based ID lookup to prevent cumulative filtering bugs.
      // IDs should be managed via state or direct program selection when possible.
      if (Object.keys(filters).length > 0) {
        const byInvoiceStatus = filters['Invoice Status']?.length ? filters['Invoice Status'] : undefined;
        if (byInvoiceStatus) {
          apiFilters = {
            byInvoiceStatus,
          };
        }
      }
      if (overviewProductId) {
        apiFilters = {...apiFilters, productId: overviewProductId};
      }
      const [verifiedList, kpisResponse] = await Promise.all([
        invoiceApi.getVerifiedList(programIds, apiFilters),
        invoiceApi
          .getDisbursementKpis(
            programIds,
            overviewProductId ? {productId: overviewProductId} : undefined,
          )
          .catch(() => null),
      ]);
      
      if (requestId !== fetchRequestId.current) return;

      if (kpisResponse) {
        setApiKpis(kpisResponse);
      }

      let verifiedItems = (verifiedList || []).filter(
        (item: any) => {
          // Rule: If it's verified by admin, it belongs on this screen.
          // Don't filter out items based on invoice_status yet, as they need to be visible to be processed.
          const adminStatus = (item.admin_status || '').toLowerCase().trim();
          return adminStatus === 'verified';
        },
      );
      if (apiFilters?.byInvoiceStatus?.length) {
        verifiedItems = verifiedItems.filter((item: any) =>
          apiFilters!.byInvoiceStatus!.some(s => {
            const apiNorm = normalizeInvoiceStatus(
              formatStatus(item.invoice_status || ''),
            ).replace(/_/g, ' ');
            const filterNorm = normalizeInvoiceStatus(s).replace(/_/g, ' ');
            return apiNorm === filterNorm;
          }),
        );
      }
      
      // Mapping preserves the backend array order exactly as returned by the API
      let rows = verifiedItems.map(mapToDisbursementRow);
      
      const finalRows = isCashnTechUser
        ? rows.filter(r => {
            const status = (r.invoiceStatus || '').toLowerCase().trim();
            // CashnTech users should see everything except perhaps very early drafts/rejected items
            // But if it's Verified, it's already past that stage.
            return status !== 'rejected' && status !== 'cancelled';
          })
        : rows;

      setDisbursementRows(finalRows);
    } catch (err: any) {
      if (requestId === fetchRequestId.current) {
        const msg =
          err?.message?.includes('fetch') || err?.code === 'ECONNABORTED'
            ? 'Network error. Check connection.'
            : err?.message || 'Failed to load disbursement data';
        setError(msg);
        setDisbursementRows([]);
      }
    } finally {
      if (requestId === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, [programIds, isCashnTechUser, appliedFilters, overviewProductId]);

  useEffect(() => {
    fetchDisbursementData();
  }, [fetchDisbursementData]);

  // Use API KPIs if available, otherwise fallback to client-side reductions
  const totalDisbursedAmount = apiKpis?.total_disbursed_amount !== undefined 
    ? Number(apiKpis.total_disbursed_amount)
    : disbursementRows.reduce((sum, r) => sum + (r.disbursedAmount ?? 0), 0);
    
  const totalInvoiceAmount = apiKpis?.total_uploaded_amount !== undefined
    ? Number(apiKpis.total_uploaded_amount)
    : disbursementRows.reduce((sum, r) => sum + (r.finalTotal ?? 0), 0);
    
  const pendingDisAmount = apiKpis?.pending_disbursed_amount !== undefined
    ? Number(apiKpis.pending_disbursed_amount)
    : disbursementRows.reduce((sum, r) => sum + Math.max(0, (r.finalTotal ?? 0) - (r.disbursedAmount ?? 0)), 0);

  const formatKpiPercent = (value?: string) => {
    if (value === undefined || value === null || value === '') return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return `${num.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 2})}%`;
  };

  const formatKpiDays = (value?: string) => {
    if (value === undefined || value === null || value === '') return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return `${num.toLocaleString('en-IN', {maximumFractionDigits: 2})} days`;
  };

  const disbursementMetrics = [
    {
      label: 'Total Invoices Uploaded',
      value: `₹ ${totalInvoiceAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`,
    },
    {
      label: 'Total Disbursed Amount',
      value: `₹ ${totalDisbursedAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`,
    },
    {
      label: 'Pending Disbursed Amount',
      value: `₹ ${pendingDisAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`,
    },
    {
      label: 'Repeat Usage Rate %',
      value: formatKpiPercent(apiKpis?.repeat_usage_rate),
    },
    {
      label: 'TAT (Turn Around Time)',
      value: formatKpiDays(apiKpis?.turn_around_time),
    },
    {
      label: 'DSO (Days Sales Outstanding)',
      value: formatKpiDays(apiKpis?.days_sales_outstanding),
    },
  ];

  const navigation = useNavigation<CompositeNavigationProp<
    DrawerNavigationProp<HomeNavigatorType>,
    NativeStackNavigationProp<any>
  >>();

  const banksFilter = [...new Set(disbursementRows.map(r => r.bankName).filter(Boolean))].sort();
  const productsFilter = [...new Set(disbursementRows.map(r => r.productName).filter(Boolean))].sort();
  const programsFilter = [...new Set(disbursementRows.map(r => r.programName).filter(Boolean))].sort();
  const statusesFilter = [...new Set(disbursementRows.map(r => r.invoiceStatus).filter(Boolean))].sort();
  const primaryPartiesFilter = [...new Set(disbursementRows.map(r => r.primaryParty).filter(Boolean))].sort();
  const counterPartiesFilter = [...new Set(disbursementRows.map(r => r.counterParty).filter(Boolean))].sort();
  const disbursementFilterData = {
    'Bank Name': banksFilter.length ? banksFilter : ['No data'],
    'Product Name': productsFilter.length ? productsFilter : ['No data'],
    'Program Name': programsFilter.length ? programsFilter : ['No data'],
    'Invoice Status': statusesFilter.length ? statusesFilter : ['No data'],
    'Primary Party': primaryPartiesFilter.length ? primaryPartiesFilter : ['No data'],
    'Counter Party': counterPartiesFilter.length ? counterPartiesFilter : ['No data'],
  };

  const filteredData = !searchText.trim()
    ? disbursementRows
    : disbursementRows.filter(item => {
        const term = searchText.toLowerCase();
        return (
          (item.primaryParty?.toLowerCase() || '').includes(term) ||
          (item.counterParty?.toLowerCase() || '').includes(term) ||
          (item.loanRefNo?.toLowerCase() || '').includes(term) ||
          (item.invoiceNo?.toLowerCase() || '').includes(term) ||
          (item.programName?.toLowerCase() || '').includes(term)
        );
      });

  const [visibleCount, setVisibleCount] = useState(30);
  useEffect(() => {
    setVisibleCount(30);
    // Clear selection state when search or filters change to prevent accidental bulk actions on hidden items
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBulkActionSheet(false);
    }
  }, [searchText, appliedFilters]);
  const paginatedData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 20, filteredData.length));
  }, [filteredData.length]);

  const handleMenuToggle = (disbursementId: string) => {
    if (openMenuId === disbursementId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }

    const ref = menuButtonRefs.current[disbursementId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(disbursementId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(disbursementId);
    }
  };

  const selectableData = useMemo(() => {
    const seenIds = new Set<string>();
    return filteredData.filter(r => {
      if (!canShowBulkActionsBtn || !r.id || !isBulkSelectableRow(r, canSendMail)) {
        return false;
      }
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    });
  }, [filteredData, canShowBulkActionsBtn, canSendMail]);

  const visibleSelectableData = useMemo(() => {
    const seenIds = new Set<string>();
    return paginatedData.filter(r => {
      if (!canShowBulkActionsBtn || !r.id || !isBulkSelectableRow(r, canSendMail)) {
        return false;
      }
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    });
  }, [paginatedData, canShowBulkActionsBtn, canSendMail]);

  const selectedBulkIds = useMemo(() => {
    const validIds = new Set(selectableData.map(r => r.id));
    return new Set([...selectedIds].filter(id => validIds.has(id)));
  }, [selectedIds, selectableData]);

  const selectedBulkCount = selectedBulkIds.size;

  const allVisibleSelectableSelected =
    visibleSelectableData.length > 0 &&
    visibleSelectableData.every(r => selectedBulkIds.has(r.id));

  useEffect(() => {
    if (selectedIds.size === 0) return;
    if (selectedBulkCount === selectedIds.size) return;
    setSelectedIds(selectedBulkIds);
    if (selectedBulkCount === 0) {
      setIsSelectionMode(false);
      setShowBulkActionSheet(false);
    }
  }, [selectedBulkCount, selectedBulkIds, selectedIds.size]);

  useEffect(() => {
    if (
      shouldAutoOpenBulkSheet &&
      selectedBulkCount > prevSelectedCount.current &&
      selectedBulkCount > 0
    ) {
      setShowBulkActionSheet(true);
    }
    prevSelectedCount.current = selectedBulkCount;
  }, [selectedBulkCount, shouldAutoOpenBulkSheet]);

  const handleSelectAll = () => {
    if (visibleSelectableData.length === 0) return;

    if (allVisibleSelectableSelected) {
      const visibleIds = new Set(visibleSelectableData.map(r => r.id));
      const next = new Set([...selectedBulkIds].filter(id => !visibleIds.has(id)));
      setSelectedIds(next);
      setIsSelectionMode(next.size > 0);
      if (next.size === 0) {
        setShowBulkActionSheet(false);
      }
      return;
    }

    const next = new Set(selectedBulkIds);
    visibleSelectableData.forEach(r => next.add(r.id));
    setSelectedIds(next);
    setIsSelectionMode(true);
    if (shouldAutoOpenBulkSheet) {
      setShowBulkActionSheet(true);
    }
  };

  const toggleSelection = (id: string) => {
    const row = disbursementRows.find(r => r.id === id);
    if (!row || !isBulkSelectableRow(row, canSendMail)) return;

    const next = new Set(selectedBulkIds);
    const wasSelected = next.has(id);
    if (wasSelected) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    setIsSelectionMode(next.size > 0);
    if (!wasSelected && next.size > 0 && shouldAutoOpenBulkSheet) {
      setShowBulkActionSheet(true);
    }
  };

  const bulkEmailInvoices = useMemo(() => {
    const selectedRows = Array.from(selectedBulkIds)
      .map(id => disbursementRows.find(r => r.id === id))
      .filter((row): row is DisbursementRow => !!row);
    return selectedRows
      .filter(row => isEligibleForBulkEmail(row))
      .map(row => {
        const amtStr = row.invoiceAmount?.replace(/[,\s₹/-]/g, '') || '0';
        return {
          id: row.id,
          invoiceNo: row.invoiceNo,
          programName: row.programName,
          primaryParty: row.primaryParty,
          invoiceDate: row.invoiceDate,
          dueDate: row.dueDate,
          invoiceAmount: parseFloat(amtStr) || row.finalTotal || 0,
        };
      });
  }, [selectedBulkIds, disbursementRows]);

  const handleBulkEmailSubmit = async (invoiceIds: string[]) => {
    setBulkLoading(true);
    try {
      const response = await invoiceApi.bulkEmailToBank({invoiceIds});
      setShowBulkEmailModal(false);
      setShowBulkActionSheet(false);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      await fetchDisbursementData();
      Toast.show({
        type: 'success',
        text1: response?.message || 'Bulk mail sent to bank successfully',
        visibilityTime: 3000,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message || err?.message || 'Failed to send bulk mail',
        visibilityTime: 3000,
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkAction = (action: string) => {
    if (action === 'sendMail' || action === 'mail') {
      const selectedRows = Array.from(selectedBulkIds)
        .map(id => disbursementRows.find(r => r.id === id))
        .filter((row): row is DisbursementRow => !!row);
      const skippedCount = selectedRows.length - bulkEmailInvoices.length;

      if (bulkEmailInvoices.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No eligible In Progress invoices selected for sending mail',
          text2: 'Select invoices with Invoice Status = In Progress',
          visibilityTime: 3500,
        });
        return;
      }
      if (skippedCount > 0) {
        Toast.show({
          type: 'info',
          text1: `${skippedCount} selected invoice(s) skipped (not In Progress)`,
          visibilityTime: 2500,
        });
      }
      setShowBulkEmailModal(true);
    } else if (action === 'markAsDisbursed' || action === 'disburse') {
      const eligibleIds = Array.from(selectedBulkIds).filter(id => {
        const row = disbursementRows.find(r => r.id === id);
        return row && isSubmittedForBulkSelect(row);
      });

      if (eligibleIds.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No eligible submitted invoices selected for disbursement',
        });
        return;
      }

      setShowBulkModal(true);
    }
  };

  const toApiDate = (ddMmYyyy: string) => {
    const parts = (ddMmYyyy || '').split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return ddMmYyyy || new Date().toISOString().slice(0, 10);
  };

  const handleBulkSubmit = (invoicesData: any[]) => {
    const invoicesPayload = invoicesData.map(data => {
      const amtStr = data.disbursedAmount?.toString().replace(/[,\s₹/-]/g, '') || '0';
      const amt = parseFloat(amtStr) || 0;
      const status = data.status || 'Disbursed';
      const isDisbursed = normalizeInvoiceStatus(status) === 'disbursed';
      const isHold = normalizeInvoiceStatus(status) === 'hold';
      return {
        invoiceId: data.id,
        status,
        utr_no: isDisbursed ? data.utrNo || undefined : undefined,
        transaction_no: isDisbursed ? data.transactionNo || undefined : undefined,
        disbursed_amount: isDisbursed ? amt : 0,
        disbursement_date: isDisbursed
          ? toApiDate(data.date)
          : isHold
            ? toApiDate(data.expectedReleaseDate)
            : undefined,
        remark: data.remark || undefined,
        hold_category: isHold ? data.holdCategory || undefined : undefined,
        expected_release_date: isHold ? toApiDate(data.expectedReleaseDate) : undefined,
        rejection_reason:
          normalizeInvoiceStatus(status) === 'reject' ? data.remark || undefined : undefined,
      };
    });

    dispatch(
      bulkDisbursementRequest({
        invoices: invoicesPayload,
        onSuccess: async (message?: string) => {
          setShowBulkModal(false);
          setShowBulkActionSheet(false);
          setSelectedIds(new Set());
          setIsSelectionMode(false);
          await fetchDisbursementData();
          Toast.show({
            type: 'success',
            text1: message || 'Bulk disbursement processed successfully',
            visibilityTime: 3000,
          });
        },
      }),
    );
  };

  const handleMenuAction = async (action: string, disbursementId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    switch (action) {
      case 'markAsDisbursed':
        setSelectedDisbursementId(disbursementId);
        setShowDisbursedModal(true);
        break;
      case 'sendMail':
        const invoiceNoForMail = disbursementRows.find(r => r.id === disbursementId)?.invoiceNo;
        Alert.alert(
          'Mail to Bank',
          `Are you sure you want to mail to bank for invoice ${invoiceNoForMail || disbursementId}?`,
          [
            {text: 'Cancel', style: 'cancel', onPress: () => {}},
            {
              text: 'Yes',
              onPress: async () => {
                setMailLoadingId(disbursementId);
                try {
                  const response = await invoiceApi.mailToBank(disbursementId);
                  await fetchDisbursementData();
                  Toast.show({
                    type: 'success',
                    text1: response?.message || 'Mail sent to bank successfully',
                    visibilityTime: 3000,
                  });
                } catch (err: any) {
                  Toast.show({
                    type: 'error',
                    text1:
                      err?.response?.data?.message ||
                      err?.message ||
                      'Failed to send mail to bank',
                    visibilityTime: 3000,
                  });
                } finally {
                  setMailLoadingId(null);
                }
              },
            },
          ],
        );
        break;

    }
  };

  const getMenuPosition = (anchor: {x: number; y: number; width: number; height: number} | null) => {
    const screen = Dimensions.get('window');
    const menuWidth = scaleWidth(180);
    const horizontalPadding = scaleWidth(12);
    const topPadding = scaleHeight(8);
    if (!anchor) {
      return {position: 'absolute' as const, top: topPadding + scaleHeight(60), right: horizontalPadding};
    }
    const desiredLeft = anchor.x + anchor.width - menuWidth;
    const left = Math.max(horizontalPadding, Math.min(desiredLeft, screen.width - menuWidth - horizontalPadding));
    return {position: 'absolute' as const, top: anchor.y + anchor.height + topPadding, left};
  };

  const handleInvoiceNoPress = useCallback(
    (row: DisbursementRow) => {
      (navigation as any).navigate('InvoiceDetailView', {
        invoiceId: row.id,
        invoiceNo: row.invoiceNo,
        returnRoute: 'DisbursementScreen',
        listInvoiceStatus: row.rawInvoiceStatus,
        listAdminStatus: row.adminStatus,
      });
    },
    [navigation],
  );

  const renderInvoiceNoField = (row: DisbursementRow) => (
    <View style={styles.infoColumn}>
      <Text style={styles.infoLabel}>Invoice No.</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleInvoiceNoPress(row)}>
        <Text style={[styles.infoValue, styles.linkText]}>{row.invoiceNo}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGrnDateField = (row: DisbursementRow) =>
    isVendorFinance ? (
      <View style={styles.infoColumn}>
        <Text style={styles.infoLabel}>GRN Date</Text>
        <Text style={styles.infoValue}>
          {!row.grnDate || row.grnDate === 'dd-mm-yyyy' ? '-' : row.grnDate}
        </Text>
      </View>
    ) : null;

  const renderAmountStatusAndUtr = (row: DisbursementRow) => (
    <>
      <View style={styles.infoColumn}>
        <Text style={styles.infoLabel}>Invoice Amount (₹)</Text>
        <Text style={styles.infoValue}>{row.invoiceAmount}</Text>
      </View>
      <View style={styles.infoRowPair}>
        <View style={styles.infoColumnInPair}>
          <Text style={styles.infoLabel}>Disbursement Amount (₹)</Text>
          <Text style={styles.infoValue}>
            {formatAmountInr(row.disbursedAmount)}
          </Text>
        </View>
        <View
          style={[
            styles.infoColumnInPair,
            {backgroundColor: getInvoiceStatusStyles(row.invoiceStatus).bg},
          ]}>
          <Text style={styles.infoLabel}>Invoice Status</Text>
          <Text
            style={[
              styles.infoValue,
              {
                color: getInvoiceStatusStyles(row.invoiceStatus).text,
                fontFamily: Fonts.GilroySemiBold,
              },
            ]}>
            {row.invoiceStatus}
          </Text>
        </View>
      </View>
      <View style={[styles.infoColumn, styles.infoColumnUtr]}>
        <Text style={styles.infoLabel}>UTR No.</Text>
        <Text style={styles.infoValue}>{row.utrNo}</Text>
      </View>
    </>
  );


  const renderDisbursementRow = ({item: row, index}: {item: DisbursementRow; index: number}) => {
    const isSelected = selectedBulkIds.has(row.id);
    const status = normalizeInvoiceStatus(row.invoiceStatus);
    const isClosed = status === 'closed' || status === 'close';
    const isSelectable = isBulkSelectableRow(row, canSendMail) && canShowBulkActionsBtn;

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={isSelectable ? 0.8 : 1}
          onPress={() => {
            if (isSelectable) toggleSelection(row.id);
          }}
          onLongPress={() => {
            if (isSelectable && !isSelectionMode) toggleSelection(row.id);
          }}
          style={styles.listCard}>
          {(() => {
            const hasAvailableActions = !isClosed && ((canSendMail && status !== 'disbursed') || (canMarkAsDisbursed && status === 'submitted'));
            
            if (show3DotsIcon && hasAvailableActions) {
              return (
                <View
                  ref={(r: View | null) => {
                    if (r) menuButtonRefs.current[row.id] = r;
                  }}
                  collapsable={false}
                  style={styles.threeDotsButton}>
                  <TouchableOpacity
                    onPress={() => handleMenuToggle(row.id)}
                    disabled={permissionsLoading}
                    activeOpacity={0.7}
                    style={styles.threeDotsTouchable}>
                    <Dots
                      width={scaleWidth(20)}
                      height={scaleHeight(20)}
                      fill={permissionsLoading ? Colors.graybase : Colors.darkblack}
                      style={{transform: [{rotate: '90deg'}, {scale: 1.05}]}}
                    />
                  </TouchableOpacity>
                </View>
              );
            }
            return null;
          })()}
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: scaleHeight(12)}}>
            {isSelectable && (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected, {marginRight: scaleWidth(10)}]}>
                {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
            )}
            <View style={[styles.indexBadge, {marginBottom: 0}]}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
          {isAnchorMaker ? (
            <>
              {/* Anchor Maker Order: Invoice No → Bank Name → Product Name → Program Name → Counter Party → Invoice Date → GRN Date (VF) → Due Date → Disbursement Date → Invoice Amount (₹) → Disbursement Amount (₹) → UTR No. → Invoice Status */}
              {renderInvoiceNoField(row)}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>{row.bankName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Product Name</Text>
                <Text style={styles.infoValue}>{row.productName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Program Name</Text>
                <Text style={styles.infoValue}>{row.programName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Counter Party</Text>
                <Text style={styles.infoValue}>{row.counterParty}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{row.invoiceDate}</Text>
              </View>
              {renderGrnDateField(row)}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{row.dueDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Disbursement Date</Text>
                <Text style={styles.infoValue}>{row.disburseDate}</Text>
              </View>
              {renderAmountStatusAndUtr(row)}
            </>
          ) : isAnchorChecker ? (
            <>
              {renderInvoiceNoField(row)}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>{row.bankName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Product Name</Text>
                <Text style={styles.infoValue}>{row.productName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Program Name</Text>
                <Text style={styles.infoValue}>{row.programName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Counter Party</Text>
                <Text style={styles.infoValue}>{row.counterParty}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{row.invoiceDate}</Text>
              </View>
              {renderGrnDateField(row)}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{row.dueDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Disbursement Date</Text>
                <Text style={styles.infoValue}>{row.disburseDate}</Text>
              </View>
              {renderAmountStatusAndUtr(row)}
            </>
          ) : (
            <>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Loan Ref No.</Text>
                <Text style={styles.infoValue}>{row.loanRefNo}</Text>
              </View>
              {renderInvoiceNoField(row)}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>{row.bankName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Product Name</Text>
                <Text style={styles.infoValue}>{row.productName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Program Name</Text>
                <Text style={styles.infoValue}>{row.programName}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Primary Party</Text>
                <Text style={styles.infoValue}>{row.primaryParty}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Counter Party</Text>
                <Text style={styles.infoValue}>{row.counterParty}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{row.invoiceDate}</Text>
              </View>
              {renderGrnDateField(row)}
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{row.dueDate}</Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Disbursement Date</Text>
                <Text style={styles.infoValue}>{row.disburseDate}</Text>
              </View>
              {renderAmountStatusAndUtr(row)}
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

  return (
    <Container>
      <AppBar
        title="Transactions > Disbursement"
        navigation={navigation as any}
      />
      <ProgramBreadcrumb />
      <View style={styles.navPathContainer}>
        <Text style={styles.navPathText} numberOfLines={1} ellipsizeMode="tail">
          Products {'>'} {productBreadcrumbLabel} {'>'} Transactions
        </Text>
      </View>
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.content}
        data={loading ? [] : paginatedData}
        keyExtractor={(row, index) => `${row.id || 'id'}-${row.loanRefNo || 'ref'}-${index}`}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListHeaderComponent={
          <>
            {programName !== 'All Program' && (
              <View style={styles.pageTitleBar}>
                <Text style={styles.pageTitleText}>{programName}</Text>
              </View>
            )}
            <View style={styles.cardGrid}>
              {disbursementMetrics.map((metric, index) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.cardLabel}>{metric.label}</Text>
                  <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
            {loading || permissionsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>
                  {permissionsLoading ? 'Fetching permissions...' : 'Loading disbursement data...'}
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchDisbursementData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {!loading && (
              <>
                {!(isDealerMaker || isDealerChecker) && (
                  <View style={styles.invoicesHeader}>
                    <Text style={styles.invoicesLabel}>{disbursementListTitle}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{filteredData.length}</Text>
                    </View>
                  </View>
                )}
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: scaleHeight(4), marginBottom: scaleHeight(4), minHeight: scaleHeight(44)}}>
                    <View style={{flex: 1, justifyContent: 'center', minHeight: scaleHeight(32)}}>
                      {canShowBulkActionsBtn && visibleSelectableData.length > 0 && (
                        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: scaleHeight(4), marginBottom: scaleHeight(2)}}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={{flexDirection: 'row', alignItems: 'center'}}
                            disabled={visibleSelectableData.length === 0}
                            onPress={handleSelectAll}>
                            <View
                              style={[
                                {width: scaleWidth(18), height: scaleWidth(18), borderWidth: 1, borderColor: Colors.graybase, alignItems: 'center', justifyContent: 'center'},
                                allVisibleSelectableSelected && {backgroundColor: Colors.primaryColor, borderColor: Colors.primaryColor},
                              ]}>
                              {allVisibleSelectableSelected && (
                                <Text style={{color: Colors.white, fontSize: scaleFont(12), lineHeight: scaleFont(12)}}>✓</Text>
                              )}
                            </View>
                            <Text style={{fontSize: scaleFont(13), fontFamily: Fonts.GilroyMedium, color: Colors.graybase, marginLeft: scaleWidth(8)}}>Select all</Text>
                            {shouldAutoOpenBulkSheet && (
                              <View style={styles.bulkBadge}>
                                <Text style={styles.bulkBadgeText}>Bulk Actions</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    {selectedBulkCount > 0 && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: Colors.primaryColor,
                          paddingHorizontal: scaleWidth(16),
                          paddingVertical: scaleHeight(6),
                          borderRadius: scaleWidth(6),
                        }}
                        onPress={() => setShowBulkActionSheet(true)}>
                        <Text style={{color: Colors.white, fontSize: scaleFont(13), fontFamily: Fonts.GilroySemiBold}}>Actions ({selectedBulkCount})</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                <View style={styles.searchFilterRow}>
                  <View style={styles.searchContainer}>
                    <Search width={scaleWidth(18)} height={scaleHeight(18)} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by Program / Invoice No."
                      placeholderTextColor={Colors.graybase}
                      value={searchText}
                      onChangeText={setSearchText}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilterModal(true)}>
                    <Filter width={scaleWidth(18)} height={scaleHeight(18)} />
                    <Text style={styles.filterButtonText}>Filters</Text>
                  </TouchableOpacity>
                </View>
                {(isDealerMaker || isDealerChecker) && (
                  <View style={[styles.invoicesHeader, {marginTop: scaleHeight(12)}]}>
                    <Text style={styles.invoicesLabel}>{disbursementListTitle}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{filteredData.length}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={{height: scaleHeight(12)}} />}
        renderItem={renderDisbursementRow}
        ListEmptyComponent={
          !loading && !error && filteredData.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No verified invoices found</Text>
            </View>
          ) : null
        }
        onEndReached={!loading && hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        onScrollBeginDrag={() => {
          setOpenMenuId(null);
          setMenuAnchor(null);
        }}
        ListFooterComponent={
          !loading && hasMore ? (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color={Colors.primaryColor} />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      {!canViewDisbursement && !loading && (
        <View style={styles.accessDeniedOverlay}>
          <Text style={styles.accessDeniedText}>You do not have permission to view this screen.</Text>
        </View>
      )}

      {/* 3-dot Action Menu - Disbursal list view: Checker & CashnTech User - Send Mail to Bank, Mark as Disbursed, Delete */}
      <Modal
          transparent
          visible={!!openMenuId}
          animationType="fade"
          onRequestClose={() => {
            setOpenMenuId(null);
            setMenuAnchor(null);
          }}>
          <Pressable
            style={styles.menuOverlay}
            onPress={() => {
              setOpenMenuId(null);
              setMenuAnchor(null);
            }}>
            <Pressable
              style={[styles.actionMenu, getMenuPosition(menuAnchor)]}
              onPress={() => {}}
            >
              {(() => {
                const selectedRow = filteredData.find(r => r.id === openMenuId);
                const status = (selectedRow?.invoiceStatus || '').toLowerCase();
                const isDisbursed = status === 'disbursed';
                return (
                  <>
                    {hasNoActionPermissions ? (
                      <View style={styles.menuItem}>
                        <FontAwesome6 name="circle-info" iconStyle="solid" color={Colors.graybase} size={16} />
                        <Text style={[styles.menuItemText, styles.menuItemTextDisabled]}>No Actions Available</Text>
                      </View>
                    ) : (
                      <>
                        {canSendMail && status !== 'disbursed' && (
                          <TouchableOpacity
                            style={[
                              styles.menuItem,
                              (permissionsLoading || (selectedRow?.adminStatus.toLowerCase() !== 'verified')) && styles.menuItemDisabled
                            ]}
                            disabled={permissionsLoading || (selectedRow?.adminStatus.toLowerCase() !== 'verified')}
                            onPress={() => handleMenuAction('sendMail', openMenuId as string)}>
                            <FontAwesome6 name="envelope" iconStyle="regular" color={Colors.darkblack} size={16} />
                            <Text style={[styles.menuItemText, (permissionsLoading || (selectedRow?.adminStatus.toLowerCase() !== 'verified')) && styles.menuItemTextDisabled]}>Send Mail to Bank</Text>
                          </TouchableOpacity>
                        )}
                        {canMarkAsDisbursed && (selectedRow?.invoiceStatus.toLowerCase() === 'submitted') && (
                          <TouchableOpacity
                            style={[styles.menuItem, permissionsLoading && styles.menuItemDisabled]}
                            disabled={permissionsLoading}
                            onPress={() => handleMenuAction('markAsDisbursed', openMenuId as string)}>
                            <FontAwesome6 name="money-bill-1" iconStyle="regular" color={Colors.darkblack} size={16} />
                            <Text style={[styles.menuItemText, permissionsLoading && styles.menuItemTextDisabled]}>Mark as Disbursed</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
  
      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilterModal(false);
        }}
        filterData={disbursementFilterData}
        appliedFilters={appliedFilters}
      />

      {/* Mark as Disbursed Modal */}
      <MarkAsDisbursedModal
        visible={showDisbursedModal}
        onClose={() => {
          setShowDisbursedModal(false);
          setSelectedDisbursementId(null);
        }}
        invoiceId={selectedDisbursementId ?? undefined}
        invoiceAmount={
          filteredData.find(item => item.id === selectedDisbursementId)?.invoiceAmount?.replace(/[,/-]/g, '').trim() || '0'
        }
        invoiceNo={
          filteredData.find(item => item.id === selectedDisbursementId)?.invoiceNo
        }
        productCode={getEffectiveProductCode(activeProductCode)}
        onSubmit={async data => {
          if (!selectedDisbursementId) return;
          try {
            const amount = parseFloat(
              (data.disbursedAmount || '0').replace(/[,\s₹]/g, ''),
            );
            const dateParts = (data.date || '').split('-');
            const disbursementDate =
              dateParts.length === 3
                ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
                : data.date;
            const isDisbursed = (data.status || '').toLowerCase() === 'disbursed';
            const isHold = (data.status || '').toLowerCase() === 'hold';
            const isReject = (data.status || '').toLowerCase() === 'reject';
            
            // Format expected release date if present (DD-MM-YYYY -> YYYY-MM-DD)
            let holdReleaseDate = '';
            if (data.expectedReleaseDate) {
              const relParts = data.expectedReleaseDate.split('-');
              if (relParts.length === 3) {
                holdReleaseDate = `${relParts[2]}-${relParts[1]}-${relParts[0]}`;
              } else {
                holdReleaseDate = data.expectedReleaseDate;
              }
            }

            await invoiceApi.markAsDisbursed(selectedDisbursementId, {
              utr_no: isDisbursed ? data.utrNo || '' : undefined,
              transaction_no: isDisbursed ? data.transactionNo || '' : undefined,
              disbursed_amount: isDisbursed && !isNaN(amount) ? amount : 0,
              disbursement_date: isDisbursed ? (disbursementDate || new Date().toISOString().slice(0, 10)) : 
                                 isHold ? (holdReleaseDate || new Date().toISOString().slice(0, 10)) : '',
              status: data.status || 'Disbursed',
              remark: isDisbursed || isHold ? (data.remark || '') : undefined,
              rejection_reason: isReject ? data.rejectionReason : undefined,
              hold_category: isHold ? data.holdCategory : undefined,
              expected_release_date: isHold ? holdReleaseDate : undefined,
              final_total: isDisbursed ? (data.finalTotal ?? 0) : undefined,
              upfront_interest: isDisbursed ? (data.upfrontInterest ?? 0) : undefined,
            });
            Toast.show({
              type: 'success',
              text1: 'Invoice marked as disbursed successfully',
              visibilityTime: 3000,
            });
            setShowDisbursedModal(false);
            setSelectedDisbursementId(null);
            fetchDisbursementData();
          } catch (err: any) {
            Toast.show({
              type: 'error',
              text1: getApiErrorMessage(err, 'Failed to mark as disbursed'),
              visibilityTime: 4000,
            });
          }
        }}
      />
      
      <DisbursementBulkActionSheet
        visible={showBulkActionSheet}
        onClose={() => {
          setShowBulkActionSheet(false);
          setSelectedIds(new Set());
          setIsSelectionMode(false);
        }}
        selectedCount={selectedBulkCount}
        onAction={(action) => {
          setShowBulkActionSheet(false);
          setTimeout(() => {
            handleBulkAction(action);
          }, 300);
        }}
        canMarkAsDisbursed={canMarkAsDisbursed}
        canSendMail={canSendMail}
      />

      <BulkInvoiceEmailModal
        visible={showBulkEmailModal}
        onClose={() => setShowBulkEmailModal(false)}
        isLoading={bulkLoading}
        invoices={bulkEmailInvoices}
        onSubmit={handleBulkEmailSubmit}
      />

      <BulkMarkAsDisbursedModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        isLoading={bulkLoading || bulkDisbursementLoading}
        selectedInvoices={Array.from(selectedBulkIds)
          .filter(id => {
            const row = disbursementRows.find(r => r.id === id);
            return row && isSubmittedForBulkSelect(row);
          })
          .map(id => {
            const row = disbursementRows.find(r => r.id === id);
            const amtStr = row?.invoiceAmount?.replace(/[,\s₹/-]/g, '') || '0';
            const amt = parseFloat(amtStr) || 0;
            return {
              id,
              invoiceNo: row?.invoiceNo || id,
              amount: amt,
              invoiceDateRaw: row?.invoiceDateRaw ?? null,
            };
          })}
        onSubmit={handleBulkSubmit}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    marginBottom: scaleHeight(8),
    marginHorizontal: -scaleWidth(16),
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(16),
  },
  card: {
    flexBasis: '47%',
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: '#FFD9D9',
    minWidth: 0,
  },
  cardLabel: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
    flexWrap: 'wrap',
  },
  cardValue: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    flexShrink: 1,
    minWidth: 0,
  },
  invoicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  invoicesLabel: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  badge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(40),
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  accessDeniedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  accessDeniedText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.red,
    textAlign: 'center',
    paddingHorizontal: scaleWidth(40),
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemTextDisabled: {
    color: Colors.graybase,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    gap: scaleWidth(6),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(12),
    gap: scaleWidth(6),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    padding: 0,
  },
  verticalList: {
    gap: scaleHeight(12),
  },
  cardWrapper: {
    position: 'relative',
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(12),
    padding: scaleWidth(14),
    paddingRight: scaleWidth(44),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    shadowColor: '#00000035',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  checkboxCheck: {
    color: Colors.white,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
    lineHeight: scaleFont(12),
  },
  bulkBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(4),
    marginLeft: scaleWidth(8),
    borderWidth: 1,
    borderColor: '#C3DAFE',
  },
  bulkBadgeText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyBold,
    color: '#4338CA',
    textTransform: 'uppercase',
  },
  threeDotsButton: {
    position: 'absolute',
    top: scaleHeight(12),
    right: scaleWidth(12),
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  threeDotsTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionMenu: {
    backgroundColor: Colors.white,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(12),
    minWidth: scaleWidth(180),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  menuItemText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  menuItemTextDanger: {
    color: Colors.red,
    fontFamily: Fonts.GilroySemiBold,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: scaleHeight(10),
  },
  infoColumn: {
    width: '48.8%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(10),
  },
  infoRowPair: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumnInPair: {
    width: '48.8%',
    backgroundColor: '#F7F8FB',
    borderRadius: scaleWidth(10),
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(10),
  },
  infoColumnUtr: {
    width: '70%',
  },
  infoLabel: {
    fontSize: scaleFont(12),
    color: Colors.graybase,
    marginBottom: scaleHeight(4),
  },
  infoValue: {
    fontSize: scaleFont(14),
    color: Colors.darkblack,
    fontFamily: Fonts.GilroyMedium,
    flexShrink: 1,
  },
  linkText: {
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
  },
  statusGreen: {
    color: Colors.green,
    fontFamily: Fonts.GilroySemiBold,
  },
  indexBadge: {
    backgroundColor: '#F7F8FB',
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(12),
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  indexText: {
    color: Colors.graybase,
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyBold,
  },
  loadingContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    gap: scaleHeight(12),
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  loadMoreFooter: {
    paddingVertical: scaleHeight(16),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scaleWidth(8),
  },
  loadMoreText: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  errorContainer: {
    paddingVertical: scaleHeight(24),
    alignItems: 'center',
    gap: scaleHeight(12),
  },
  errorText: {
    fontSize: scaleFont(14),
    color: Colors.red,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
  },
  retryButtonText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
  navPathContainer: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(8),
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  navPathText: {
    fontSize: scaleFont(12),
    color: '#666666',
    fontFamily: Fonts.GilroyMedium,
  },
});
