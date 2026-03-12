import * as React from 'react';
import {useState, useEffect, useCallback} from 'react';
import {View, Alert, Dimensions} from 'react-native';
import {scaleWidth, scaleHeight} from '@utils/Scale';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {DocumentPickerResponse} from '@react-native-documents/picker';
import {
  fetchInvoiceListRequest,
  updateInvoiceStatusRequest,
  updateInvoiceVerificationRequest,
} from '@store/invoice/inv.slice';
import {setProgramSelection} from '@store/programSelection/programSelection.slice';
import {
  selectInvoiceList,
  selectInvoiceListLoading,
  selectInvoiceListError,
} from '@store/invoice/inv.selector';
import {
  selectProgramSelection,
  selectScopeData,
} from '@store/programSelection/programSelection.selector';
import {ProgramSelectionState} from '@store/programSelection/programSelection.types';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';
import {mapApiToRow, formatDateDash, mapApprovalLogToEntry} from './types';
import type {InvoiceRow} from './types';
import {InvoiceListItemApi} from '@store/invoice/inv.types';
import {invoiceApi} from '@services/api/invoice.api';
import type {CheckerApprovalEntry} from '@components/CheckerApprovalModal/CheckerApprovalModal';
import type {ApproveRejectInvoiceDetails} from '@components/ApproveRejectModal/ApproveRejectModal';

export function useInvoiceDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const programSelection = useSelector(selectProgramSelection) as ProgramSelectionState;
  const scopeData = useSelector(selectScopeData);
  const invoiceListRaw = useSelector(selectInvoiceList) as InvoiceListItemApi[];
  const invoiceListLoading = useSelector(selectInvoiceListLoading);
  const invoiceListError = useSelector(selectInvoiceListError);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  
  // Route params: from Invoice Overview (bank/dealer/program breadcrumb) or from drawer (All Program breadcrumb)
  const routeParams = route.params as {
    fromInvoiceDashboard?: boolean;
    bankName?: string;
    dealerName?: string;
    programName?: string;
    programId?: string;
  } | undefined;
  const selectedDealerName = routeParams?.dealerName;
  const fromInvoiceDashboard = routeParams?.fromInvoiceDashboard === true;
  const breadcrumbBank = routeParams?.bankName || (programSelection?.programScope !== 'all' ? programSelection?.bankName : undefined);
  const breadcrumbDealer = routeParams?.dealerName || (programSelection?.programScope !== 'all' ? programSelection?.productName : undefined);
  const breadcrumbProgram = routeParams?.programName || (programSelection?.programScope !== 'all' ? programSelection?.programName : undefined);

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  // Global "All Program" scope from Program selector (breadcrumb).
  const isAllProgramScope = programSelection?.programScope === 'all';

  const isAnchorMaker = userRole === 'anchor_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCashnTechUser = userRole === 'cashntech_user';

  const dealerListTitle = 'Dealer Wise Invoice Details';

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCheckerApprovalModal, setShowCheckerApprovalModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const menuButtonRefs = React.useRef<Record<string, View | null>>({});
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showSendForApprovalModal, setShowSendForApprovalModal] = useState(false);
  const [showSelectProgramForCreateModal, setShowSelectProgramForCreateModal] = useState(false);
  const [anchorCheckerInvoiceDetails, setAnchorCheckerInvoiceDetails] = useState<ApproveRejectInvoiceDetails | null>(null);
  const [anchorCheckerDetailsLoading, setAnchorCheckerDetailsLoading] = useState(false);
  const [approvalHistoryEntries, setApprovalHistoryEntries] = useState<CheckerApprovalEntry[]>([]);
  const [approvalHistoryLoading, setApprovalHistoryLoading] = useState(false);

  // Use programId from Redux; fallback to route params when navigating back from InvoiceDetailView.
  // When Program scope is "All", we intentionally pass an empty string – API then returns all
  // invoices within the user's scope (no program filter applied).
  const programIdFromParams = routeParams?.programId;
  const concreteProgramId = programSelection?.programId ?? programIdFromParams;
  const programId = isAllProgramScope ? '' : concreteProgramId ?? '';

  // Restore program selection when coming back with programId in params (e.g. from InvoiceDetailView)
  useEffect(() => {
    if (!programIdFromParams || programSelection?.programId) return;
    // Try to restore full selection from scopeData if available
    if (scopeData?.length) {
      for (const bank of scopeData) {
        for (const product of bank.products || []) {
          const program = product.programs?.find((p: any) => p.id === programIdFromParams);
          if (program) {
            dispatch(
              setProgramSelection({
                bankId: bank.id,
                bankName: bank.name,
                productId: product.id,
                productName: product.name,
                programId: program.id,
                programName: program.name,
              }),
            );
            return;
          }
        }
      }
    }
    dispatch(setProgramSelection({programId: programIdFromParams}));
  }, [programIdFromParams, programSelection?.programId, scopeData, dispatch]);

  const inv = appliedFilters['Invoice Status'];
  const appr = appliedFilters['Approval Status'];
  const apiFilters: {byInvoiceStatus?: string[]; byApprovalStatus?: string[]} | undefined = (() => {
    const body: {byInvoiceStatus?: string[]; byApprovalStatus?: string[]} = {};
    if (inv?.length) body.byInvoiceStatus = inv;
    if (appr?.length) body.byApprovalStatus = appr;
    return Object.keys(body).length ? body : undefined;
  })();

  const hasAnyProgramContext = isAllProgramScope || !!concreteProgramId;

  useEffect(() => {
    if (!hasAnyProgramContext) return;
    dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
  }, [hasAnyProgramContext, programId, apiFilters, dispatch]);

  // Refetch list when screen comes into focus (e.g. back from InvoiceDetailView)
  useFocusEffect(
    useCallback(() => {
      if (!hasAnyProgramContext) return;
      dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
    }, [hasAnyProgramContext, programId, apiFilters, dispatch]),
  );

  // Fetch invoice details for anchor_checker or CashnTech when ApproveReject modal opens
  useEffect(() => {
    if ((!isAnchorChecker && !isCashnTechUser) || !showApproveRejectModal || !selectedInvoiceId) {
      setAnchorCheckerInvoiceDetails(null);
      return;
    }
    let cancelled = false;
    setAnchorCheckerDetailsLoading(true);
    setAnchorCheckerInvoiceDetails(null);
    invoiceApi
      .getInvoiceDetails(selectedInvoiceId)
      .then((data: any) => {
        if (cancelled) return;
        const apm = data?.anchorParticipantMapping;
        const party = data?.party;
        const dealerName = apm?.party?.entity_name ?? apm?.party?.name ?? '-';
        const creditAccountNumber = apm?.od_account_no ?? '-';
        const anchorName = party?.entity_name ?? party?.name ?? '-';
        const invoiceDate = data?.invoice_date ? formatDateDash(data.invoice_date) : 'DD / MM / YYYY';
        const invoiceDueDate = data?.invoice_due_date ? formatDateDash(data.invoice_due_date) : 'DD / MM / YYYY';
        // Use final_total (total invoice amount including tax/discount) for approval modal
        const totalAmount = data?.final_total ?? data?.sub_total;
        const invoiceAmount =
          totalAmount != null
            ? `Rs. ${Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /-`
            : 'Rs. 0 /-';
        setAnchorCheckerInvoiceDetails({
          dealerName,
          creditAccountNumber,
          anchorName,
          invoiceDate,
          invoiceDueDate,
          invoiceAmount,
        });
      })
      .catch(() => {
        if (!cancelled) setAnchorCheckerInvoiceDetails(null);
      })
      .finally(() => {
        if (!cancelled) setAnchorCheckerDetailsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAnchorChecker, isCashnTechUser, showApproveRejectModal, selectedInvoiceId]);

  // Fetch approval history when Approval History modal opens
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
              return mapApprovalLogToEntry(log);
            } catch {
              return null;
            }
          })
          .filter((entry): entry is CheckerApprovalEntry => entry !== null);
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

  const invoiceData = invoiceListRaw.map(mapApiToRow);

  const banks = [...new Set(invoiceData.map(r => r.bankName).filter(Boolean))].sort();
  const products = [...new Set(invoiceData.map(r => r.productName).filter(Boolean))].sort();
  const programs = [...new Set(invoiceData.map(r => r.programName).filter(Boolean))].sort();
  const primaryParties = [...new Set(invoiceData.map(r => r.primaryParty).filter(Boolean))].sort();
  const counterParties = [...new Set(invoiceData.map(r => r.counterParty).filter(Boolean))].sort();
  const invoiceStatuses = [...new Set(invoiceData.map(r => r.invoiceStatus).filter(Boolean))].sort();
  const approvalStatuses = [...new Set(invoiceData.map(r => r.approvalStatus).filter(Boolean))].sort();
  const invoiceFilterData = {
    Bank: banks.length ? banks : ['No data'],
    Product: products.length ? products : ['No data'],
    Program: programs.length ? programs : ['No data'],
    'Primary Party': primaryParties.length ? primaryParties : ['No data'],
    'Counter Party': counterParties.length ? counterParties : ['No data'],
    'Invoice Status': invoiceStatuses.length ? invoiceStatuses : ['No data'],
    'Approval Status': approvalStatuses.length ? approvalStatuses : ['No data'],
  };

  // Summary metrics for Invoice List & Approval (match design: Dealers, Total Invoices, Amount, Pending, Approved, Rejected)
  const dealersCount = new Set(invoiceData.map(r => r.dealerName)).size;
  const totalInvoices = invoiceData.length;
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  invoiceData.forEach(r => {
    const a = (r.approvalStatus || '').toLowerCase();
    const s = (r.invoiceStatus || '').toLowerCase();
    if (a.includes('reject') || s.includes('reject')) rejected += 1;
    else if (a.includes('approval_complete') || a.includes('approved') || a.includes('complete')) approved += 1;
    else pending += 1;
  });
  const summaryStats = {
    dealers: dealersCount,
    totalInvoices,
    totalInvoiceAmount: '₹ 20,000,000.00', // placeholder until API provides amount
    pendingInvoices: pending,
    approvedInvoices: approved,
    rejectedInvoices: rejected,
  };

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

  const handleMenuToggle = (invoiceId: string) => {
    if (openMenuId === invoiceId) {
      setOpenMenuId(null);
      setMenuAnchor(null);
      return;
    }
    const ref = menuButtonRefs.current[invoiceId] as any;
    if (ref?.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuAnchor({x, y, width, height});
        setOpenMenuId(invoiceId);
      });
    } else {
      setMenuAnchor(null);
      setOpenMenuId(invoiceId);
    }
  };

  const handleMenuAction = (action: string, invoiceId: string) => {
    setOpenMenuId(null);
    setMenuAnchor(null);

    const invoiceNo =
      filteredData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceData.find(item => item.id === invoiceId)?.invoiceNo ??
      invoiceId;

    switch (action) {
      case 'viewDetails':
        (navigation as any).navigate('InvoiceDetailView', {
          invoiceId,
          invoiceNo,
          programId,
          fromInvoiceDashboard,
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
        setShowCheckerApprovalModal(true);
        break;
      case 'delete':
        Alert.alert(
          'Delete Invoice',
          'Are you sure you want to delete this invoice?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                console.log('Delete invoice:', invoiceId);
              },
            },
          ],
        );
        break;
      case 'approveReject':
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setShowApproveRejectModal(true);
        break;
      case 'invoiceVerification':
        setSelectedInvoiceId(invoiceId);
        setSelectedInvoiceNo(invoiceNo);
        setShowApproveRejectModal(true);
        break;
      case 'attachment':
        setSelectedInvoiceId(invoiceId);
        setShowAttachmentModal(true);
        break;
      case 'print':
        console.log('Print invoice:', invoiceId, invoiceNo);
        // TODO: Implement print functionality
        break;
      case 'payMeEarly':
        console.log('Pay me Early for invoice:', invoiceId);
        break;
    }
  };

  const handleAttachmentUpload = (file?: DocumentPickerResponse) => {
    if (file && selectedInvoiceId) {
      console.log('Upload attachment for invoice:', selectedInvoiceId, file.name);
    }
    setShowAttachmentModal(false);
    setSelectedInvoiceId(null);
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId],
    );
  };

  const selectedRowsForModal = invoiceData.filter(row =>
    selectedInvoiceIds.includes(row.id),
  );

  const selectedRow =
    filteredData.find(r => r.id === selectedInvoiceId) ??
    invoiceData.find(r => r.id === selectedInvoiceId);

  const selectedInvoiceDetails = selectedRow
    ? {
        subTotal: selectedRow.invoiceAmount,
        withholdingTaxesPercent: '0.00/-',
        withholdingAmount: '0.00/-',
        finalPayableAmount: selectedRow.invoiceAmount,
        finalDueDate: selectedRow.dueDate,
      }
    : undefined;

  const allSelectedOnScreen =
    (isDealerChecker || isAnchorChecker) &&
    filteredData.length > 0 &&
    filteredData.every(row => selectedInvoiceIds.includes(row.id));

  const approvalLevel = isAnchorChecker
    ? 1
    : isDealerMaker
    ? 2
    : isDealerChecker
    ? 3
    : 1;

  const toggleSelectAllVisible = () => {
    if (!isDealerChecker && !isAnchorChecker) return;
    const visibleIds = filteredData.map(row => row.id);
    if (allSelectedOnScreen) {
      setSelectedInvoiceIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedInvoiceIds(prev =>
        Array.from(new Set([...prev, ...visibleIds])),
      );
    }
  };

  const onApproveRejectApprove = (invoiceId: string, remarks?: string) => {
    const invNo = selectedInvoiceNo;
    if (__DEV__) {
      console.log('[DEBUG 1] onApproveRejectApprove:', {
        invoiceId,
        invoiceNo: invNo,
        programId,
        apiFilters,
      });
    }
    dispatch(
      updateInvoiceStatusRequest({
        invoiceId,
        action: 'Approve',
        approvalLevel,
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

  const onApproveRejectReject = (invoiceId: string, remarks?: string) => {
    dispatch(
      updateInvoiceStatusRequest({
        invoiceId,
        action: 'Reject',
        approvalLevel,
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

  const onVerifyApprove = (invoiceId: string, remarks?: string) => {
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
          }),
      }),
    );
    setShowApproveRejectModal(false);
    setSelectedInvoiceId(null);
    setSelectedInvoiceNo(null);
    setAnchorCheckerInvoiceDetails(null);
  };

  const onVerifyReject = (invoiceId: string, remarks?: string) => {
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

  const onBulkApply = (action: 'approve' | 'reject' | 'verify' | 'cancel') => {
    // TODO: Call API to apply bulk action (approve/reject/verify/cancel) to selectedInvoiceIds
    console.log('Bulk apply:', action, selectedInvoiceIds);
    setShowSendForApprovalModal(false);
    setSelectedInvoiceIds([]);
    if (programId) {
      dispatch(fetchInvoiceListRequest({programId, filters: apiFilters}));
    }
  };

  const getMenuPosition = useCallback(
    (anchor: {x: number; y: number; width: number; height: number} | null) => {
      const screen = Dimensions.get('window');
      const menuWidth = scaleWidth(180);
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
      return {position: 'absolute' as const, top, left};
    },
    [],
  );

  const onCreateInvoicePress = useCallback(() => {
    setShowSelectProgramForCreateModal(true);
  }, []);

  const onProgramSelectedForCreate = useCallback(() => {
    setShowSelectProgramForCreateModal(false);
    (navigation as any).navigate('CreateInvoice');
  }, [navigation]);

  // Create Invoice should be disabled when user is on global "All Program" scope
  // or when no concrete program is selected.
  const isCreateInvoiceEnabled =
    !isAllProgramScope && !!concreteProgramId;

  return {
    programId,
    programName: routeParams?.programName || programSelection?.programName || '',
    summaryStats,
    apiFilters,
    dispatch,
    navigation,
    invoiceData,
    invoiceFilterData,
    filteredData,
    invoiceListLoading,
    invoiceListError,
    isAnchorMaker,
    isAnchorChecker,
    isDealerMaker,
    isDealerChecker,
    isCashnTechUser,
    dealerListTitle,
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
    setApprovalHistoryLoading,
    showApproveRejectModal,
    setShowApproveRejectModal,
    selectedInvoiceId,
    setSelectedInvoiceId,
    selectedInvoiceNo,
    setSelectedInvoiceNo,
    selectedInvoiceDetails,
    anchorCheckerInvoiceDetails,
    anchorCheckerDetailsLoading,
    showAttachmentModal,
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
    handleAttachmentUpload,
    toggleInvoiceSelection,
    toggleSelectAllVisible,
    onApproveRejectApprove,
    onApproveRejectReject,
    onVerifyApprove,
    onVerifyReject,
    onBulkApply,
    getMenuPosition,
    showSelectProgramForCreateModal,
    setShowSelectProgramForCreateModal,
    onCreateInvoicePress,
    onProgramSelectedForCreate,
    isCreateInvoiceEnabled,
    hasAnyProgramContext,
  };
}
